"""
Public API router — serves data from the active published dataset.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import distinct

from database import get_db
from models import (
    Setting, Upload, GenderMetric, EngagementMetric,
    VolunteeringMetric, EsgCoursesMetric,
)

router = APIRouter(prefix="/api", tags=["public"])


def _get_active_upload_id(db: Session) -> int | None:
    setting = db.query(Setting).filter(Setting.key == "active_upload_id").first()
    if setting and setting.value:
        return int(setting.value)
    return None


@router.get("/active-version")
def get_active_version(db: Session = Depends(get_db)):
    upload_id = _get_active_upload_id(db)
    if not upload_id:
        return {"active_upload_id": None, "updated_at": None}
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    return {
        "active_upload_id": upload_id,
        "updated_at": upload.created_at.isoformat() if upload and upload.created_at else None,
    }


@router.get("/filters")
def get_filters(db: Session = Depends(get_db)):
    upload_id = _get_active_upload_id(db)
    if not upload_id:
        return {"years": [], "faculties": []}

    # Collect years and faculties from all metric tables
    years = set()
    faculties = set()

    for Model in [GenderMetric, EngagementMetric, VolunteeringMetric, EsgCoursesMetric]:
        rows = db.query(distinct(Model.year)).filter(Model.upload_id == upload_id).all()
        years.update(r[0] for r in rows)
        rows = db.query(distinct(Model.faculty)).filter(Model.upload_id == upload_id).all()
        faculties.update(r[0] for r in rows)

    return {
        "years": sorted(years, reverse=True),
        "faculties": sorted(faculties),
    }


@router.get("/summary")
def get_summary(
    year: int = Query(None),
    faculty: str = Query(None),
    db: Session = Depends(get_db),
):
    upload_id = _get_active_upload_id(db)
    if not upload_id:
        return {"gender": {}, "engagement": {}, "volunteering": {}, "esg_courses": {}}

    def _filter(query, Model):
        q = query.filter(Model.upload_id == upload_id)
        if year:
            q = q.filter(Model.year == year)
        if faculty:
            q = q.filter(Model.faculty == faculty)
        return q

    # Gender summary
    gender_rows = _filter(db.query(GenderMetric), GenderMetric).all()
    avg_female = sum(r.female_pct for r in gender_rows) / len(gender_rows) if gender_rows else 0
    avg_male = sum(r.male_pct for r in gender_rows) / len(gender_rows) if gender_rows else 0
    wl_rows = [r for r in gender_rows if r.women_leadership_pct is not None]
    avg_wl = sum(r.women_leadership_pct for r in wl_rows) / len(wl_rows) if wl_rows else None

    # Engagement summary
    eng_rows = _filter(db.query(EngagementMetric), EngagementMetric).all()
    avg_satisfaction = sum(r.satisfaction_pct for r in eng_rows) / len(eng_rows) if eng_rows else 0
    nps_rows = [r for r in eng_rows if r.nps is not None]
    avg_nps = sum(r.nps for r in nps_rows) / len(nps_rows) if nps_rows else None

    # Volunteering summary
    vol_rows = _filter(db.query(VolunteeringMetric), VolunteeringMetric).all()
    total_volunteers = sum(r.volunteers_students + r.volunteers_staff for r in vol_rows)
    total_hours = sum(r.total_hours for r in vol_rows)
    total_projects = sum(r.projects_count for r in vol_rows)

    # ESG Courses summary
    esg_rows = _filter(db.query(EsgCoursesMetric), EsgCoursesMetric).all()
    total_courses = sum(r.courses_count for r in esg_rows)
    esg_pct_rows = [r for r in esg_rows if r.esg_students_pct is not None]
    avg_esg_pct = sum(r.esg_students_pct for r in esg_pct_rows) / len(esg_pct_rows) if esg_pct_rows else None

    return {
        "gender": {
            "avg_female_pct": round(avg_female, 1),
            "avg_male_pct": round(avg_male, 1),
            "avg_women_leadership_pct": round(avg_wl, 1) if avg_wl is not None else None,
            "records": len(gender_rows),
        },
        "engagement": {
            "avg_satisfaction_pct": round(avg_satisfaction, 1),
            "avg_nps": round(avg_nps, 1) if avg_nps is not None else None,
            "records": len(eng_rows),
        },
        "volunteering": {
            "total_volunteers": total_volunteers,
            "total_hours": round(total_hours, 1),
            "total_projects": total_projects,
            "records": len(vol_rows),
        },
        "esg_courses": {
            "total_courses": total_courses,
            "avg_esg_students_pct": round(avg_esg_pct, 1) if avg_esg_pct is not None else None,
            "records": len(esg_rows),
        },
    }


def _serialize_rows(rows, fields):
    result = []
    for r in rows:
        d = {}
        for f in fields:
            v = getattr(r, f, None)
            d[f] = v
        result.append(d)
    return result


@router.get("/gender")
def get_gender(
    year: int = Query(None),
    faculty: str = Query(None),
    db: Session = Depends(get_db),
):
    upload_id = _get_active_upload_id(db)
    if not upload_id:
        return {"data": [], "summary": {}}

    q = db.query(GenderMetric).filter(GenderMetric.upload_id == upload_id)
    if year:
        q = q.filter(GenderMetric.year == year)
    if faculty:
        q = q.filter(GenderMetric.faculty == faculty)
    rows = q.all()

    fields = ["year", "faculty", "group_type", "male_pct", "female_pct",
              "other_pct", "women_leadership_pct", "pay_gap_pct"]

    avg_female = sum(r.female_pct for r in rows) / len(rows) if rows else 0
    avg_male = sum(r.male_pct for r in rows) / len(rows) if rows else 0
    wl = [r.women_leadership_pct for r in rows if r.women_leadership_pct is not None]
    avg_wl = sum(wl) / len(wl) if wl else None

    return {
        "data": _serialize_rows(rows, fields),
        "summary": {
            "avg_female_pct": round(avg_female, 1),
            "avg_male_pct": round(avg_male, 1),
            "avg_women_leadership_pct": round(avg_wl, 1) if avg_wl is not None else None,
            "total_records": len(rows),
        },
    }


@router.get("/engagement")
def get_engagement(
    year: int = Query(None),
    faculty: str = Query(None),
    db: Session = Depends(get_db),
):
    upload_id = _get_active_upload_id(db)
    if not upload_id:
        return {"data": [], "summary": {}}

    q = db.query(EngagementMetric).filter(EngagementMetric.upload_id == upload_id)
    if year:
        q = q.filter(EngagementMetric.year == year)
    if faculty:
        q = q.filter(EngagementMetric.faculty == faculty)
    rows = q.all()

    fields = ["year", "faculty", "satisfaction_pct", "nps",
              "club_participation_pct", "avg_activities_per_student"]

    avg_sat = sum(r.satisfaction_pct for r in rows) / len(rows) if rows else 0
    nps = [r.nps for r in rows if r.nps is not None]
    avg_nps = sum(nps) / len(nps) if nps else None

    return {
        "data": _serialize_rows(rows, fields),
        "summary": {
            "avg_satisfaction_pct": round(avg_sat, 1),
            "avg_nps": round(avg_nps, 1) if avg_nps is not None else None,
            "total_records": len(rows),
        },
    }


@router.get("/volunteering")
def get_volunteering(
    year: int = Query(None),
    faculty: str = Query(None),
    db: Session = Depends(get_db),
):
    upload_id = _get_active_upload_id(db)
    if not upload_id:
        return {"data": [], "summary": {}}

    q = db.query(VolunteeringMetric).filter(VolunteeringMetric.upload_id == upload_id)
    if year:
        q = q.filter(VolunteeringMetric.year == year)
    if faculty:
        q = q.filter(VolunteeringMetric.faculty == faculty)
    rows = q.all()

    fields = ["year", "faculty", "volunteers_students", "volunteers_staff",
              "total_hours", "projects_count", "top_direction"]

    total_vol = sum(r.volunteers_students + r.volunteers_staff for r in rows)
    total_hrs = sum(r.total_hours for r in rows)
    total_proj = sum(r.projects_count for r in rows)

    return {
        "data": _serialize_rows(rows, fields),
        "summary": {
            "total_volunteers": total_vol,
            "total_hours": round(total_hrs, 1),
            "total_projects": total_proj,
            "total_records": len(rows),
        },
    }


@router.get("/esg-courses")
def get_esg_courses(
    year: int = Query(None),
    faculty: str = Query(None),
    db: Session = Depends(get_db),
):
    upload_id = _get_active_upload_id(db)
    if not upload_id:
        return {"data": [], "summary": {}}

    q = db.query(EsgCoursesMetric).filter(EsgCoursesMetric.upload_id == upload_id)
    if year:
        q = q.filter(EsgCoursesMetric.year == year)
    if faculty:
        q = q.filter(EsgCoursesMetric.faculty == faculty)
    rows = q.all()

    fields = ["year", "faculty", "courses_count", "esg_students_pct", "green_program_students"]

    total_courses = sum(r.courses_count for r in rows)
    esg_pct = [r.esg_students_pct for r in rows if r.esg_students_pct is not None]
    avg_pct = sum(esg_pct) / len(esg_pct) if esg_pct else None
    total_green = sum(r.green_program_students for r in rows if r.green_program_students is not None)

    return {
        "data": _serialize_rows(rows, fields),
        "summary": {
            "total_courses": total_courses,
            "avg_esg_students_pct": round(avg_pct, 1) if avg_pct is not None else None,
            "total_green_program_students": total_green,
            "total_records": len(rows),
        },
    }
