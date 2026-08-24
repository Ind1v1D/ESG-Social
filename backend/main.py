"""
Social Impact Dashboard — FastAPI entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import ALLOWED_ORIGINS, DEBUG
from database import init_db
from routers import admin, public, realtime

app = FastAPI(
    title="Social Impact Dashboard API",
    description="ESG Social KPI dashboard with Excel upload and real-time updates",
    version="1.0.0",
    # Disable interactive docs in production (DEBUG=false)
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
    openapi_url="/openapi.json" if DEBUG else None,
)

# CORS — origins from env; methods/headers restricted to what the frontend needs
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Register routers
app.include_router(admin.router)
app.include_router(public.router)
app.include_router(realtime.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"message": "Social Impact Dashboard API", "docs": "/docs" if DEBUG else "disabled"}


@app.get("/health")
def health():
    """Liveness / readiness probe for container healthchecks."""
    return {"status": "ok"}
