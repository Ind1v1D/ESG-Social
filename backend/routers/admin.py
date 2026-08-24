"""
Admin API router — login, upload, publish, rollback, template download, admin management.

Upload lifecycle states:
    draft     → initial state after successful parse
    published → the currently active dataset (only one at a time)
    archived  → previously published, replaced by a newer publish
    failed    → upload had validation errors; cannot be published
"""
import json
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from auth import hash_password, verify_password_db, create_access_token, get_current_admin
from config import MAX_UPLOAD_SIZE
from models import Admin, Upload, Setting, GenderMetric, EngagementMetric, VolunteeringMetric, EsgCoursesMetric
from excel_parser import parse_and_validate
from template_generator import generate_template
from events import event_manager
from rate_limit import login_rate_limit, record_failure, reset as reset_rate_limit
import io

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Allowed MIME types for Excel uploads
_EXCEL_MIMES = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    # Some clients send generic octet-stream
    "application/octet-stream",
}


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=LoginResponse)
def admin_login(req: LoginRequest, request: Request, db: Session = Depends(get_db), _rl=Depends(login_rate_limit)):
    ip = request.client.host if request.client else "unknown"
    admin = db.query(Admin).filter(Admin.username == req.username, Admin.is_active == True).first()
    if not admin or not verify_password_db(req.password, admin.password_hash):
        record_failure(ip)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    reset_rate_limit(ip)
    token = create_access_token(data={"sub": admin.username})
    return LoginResponse(access_token=token)


@router.get("/uploads")
def list_uploads(db: Session = Depends(get_db), admin: str = Depends(get_current_admin)):
    uploads = db.query(Upload).order_by(Upload.created_at.desc()).all()
    active_setting = db.query(Setting).filter(Setting.key == "active_upload_id").first()
    active_id = int(active_setting.value) if active_setting and active_setting.value else None

    return {
        "active_upload_id": active_id,
        "uploads": [
            {
                "id": u.id,
                "filename": u.filename,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "created_by": u.created_by,
                "status": u.status,
                "errors_count": u.errors_count,
                "warnings_count": u.warnings_count,
                "is_active": u.id == active_id,
            }
            for u in uploads
        ],
    }


@router.post("/upload")
async def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    # ── Extension check ──────────────────────────────────────
    if not file.filename or not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx / .xls files are supported")

    # ── MIME type check ──────────────────────────────────────
    if file.content_type and file.content_type not in _EXCEL_MIMES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Expected an Excel spreadsheet.",
        )

    # ── Size check (backend guard, nginx also limits to 20M) ─
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        size_mb = MAX_UPLOAD_SIZE / (1024 * 1024)
        raise HTTPException(status_code=413, detail=f"File too large. Maximum allowed size is {size_mb:.0f} MB.")

    result = parse_and_validate(contents)

    errors = result["errors"]
    warnings = result["warnings"]
    data = result["data"]

    # Create upload record
    status = "failed" if errors else "draft"
    upload = Upload(
        filename=file.filename,
        created_by=admin,
        status=status,
        errors_count=len(errors),
        warnings_count=len(warnings),
        error_details=json.dumps({"errors": errors, "warnings": warnings}),
    )
    db.add(upload)
    db.flush()  # get ID

    if not errors:
        # Store parsed data
        _store_metrics(db, upload.id, data)

    db.commit()
    db.refresh(upload)

    return {
        "upload_id": upload.id,
        "status": upload.status,
        "errors_count": upload.errors_count,
        "warnings_count": upload.warnings_count,
        "errors": errors,
        "warnings": warnings,
    }


def _store_metrics(db: Session, upload_id: int, data: dict):
    """Insert parsed data rows into metric tables."""
    # Gender
    for row in data.get("gender", []):
        db.add(GenderMetric(upload_id=upload_id, **row))

    # Engagement
    for row in data.get("engagement", []):
        db.add(EngagementMetric(upload_id=upload_id, **row))

    # Volunteering
    for row in data.get("volunteering", []):
        db.add(VolunteeringMetric(upload_id=upload_id, **row))

    # ESG Courses
    for row in data.get("esg_courses", []):
        db.add(EsgCoursesMetric(upload_id=upload_id, **row))


def _set_active_upload(db: Session, upload_id: int):
    """
    Activate the given upload and archive the previously published one.
    Ensures only one upload has status='published' at any time.
    """
    # Archive the current published upload (if any and if it's a different one)
    prev_published = (
        db.query(Upload)
        .filter(Upload.status == "published", Upload.id != upload_id)
        .all()
    )
    for prev in prev_published:
        prev.status = "archived"

    # Update the settings pointer
    setting = db.query(Setting).filter(Setting.key == "active_upload_id").first()
    if setting:
        setting.value = str(upload_id)
    else:
        db.add(Setting(key="active_upload_id", value=str(upload_id)))


@router.post("/publish/{upload_id}")
async def publish_upload(
    upload_id: int,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    if upload.status == "failed":
        raise HTTPException(status_code=400, detail="Cannot publish a failed upload")

    _set_active_upload(db, upload_id)
    upload.status = "published"
    db.commit()

    # Broadcast SSE event
    await event_manager.publish_event(upload_id)

    return {"status": "published", "active_upload_id": upload_id}


@router.post("/rollback/{upload_id}")
async def rollback_upload(
    upload_id: int,
    db: Session = Depends(get_db),
    admin: str = Depends(get_current_admin),
):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    if upload.status == "failed":
        raise HTTPException(status_code=400, detail="Cannot rollback to a failed upload")

    _set_active_upload(db, upload_id)
    upload.status = "published"
    db.commit()

    await event_manager.publish_event(upload_id)

    return {"status": "published", "active_upload_id": upload_id}


@router.get("/template")
def download_template(admin: str = Depends(get_current_admin)):
    content = generate_template()
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=social_dashboard_template.xlsx"},
    )


# ── Admin Management ────────────────────────────────────────────

class CreateAdminRequest(BaseModel):
    username: str
    password: str


class UpdateAdminRequest(BaseModel):
    password: str | None = None
    is_active: bool | None = None


@router.get("/admins")
def list_admins(db: Session = Depends(get_db), admin: str = Depends(get_current_admin)):
    admins = db.query(Admin).order_by(Admin.id).all()
    return {
        "admins": [
            {
                "id": a.id,
                "username": a.username,
                "is_active": a.is_active,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in admins
        ]
    }


@router.post("/admins")
def create_admin(req: CreateAdminRequest, db: Session = Depends(get_db), admin: str = Depends(get_current_admin)):
    existing = db.query(Admin).filter(Admin.username == req.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    new_admin = Admin(
        username=req.username,
        password_hash=hash_password(req.password),
        is_active=True,
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return {"id": new_admin.id, "username": new_admin.username, "is_active": new_admin.is_active}


@router.put("/admins/{admin_id}")
def update_admin(admin_id: int, req: UpdateAdminRequest, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    target = db.query(Admin).filter(Admin.id == admin_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")
    if req.password is not None:
        target.password_hash = hash_password(req.password)
    if req.is_active is not None:
        target.is_active = req.is_active
    db.commit()
    return {"id": target.id, "username": target.username, "is_active": target.is_active}


@router.delete("/admins/{admin_id}")
def delete_admin(admin_id: int, db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    target = db.query(Admin).filter(Admin.id == admin_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Admin not found")
    if target.username == current_admin:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    db.delete(target)
    db.commit()
    return {"status": "deleted", "id": admin_id}
