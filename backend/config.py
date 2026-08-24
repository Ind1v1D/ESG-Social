import os
import sys

from dotenv import load_dotenv, find_dotenv

# Load .env from the working directory or any enclosing directory.
# Docker Compose sets these as real environment variables, so this is a no-op there.
load_dotenv(find_dotenv(usecwd=True))

ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
SECRET_KEY = os.getenv("SECRET_KEY", "")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./social_dashboard.db")

# CORS: comma-separated list of allowed origins
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

# Debug mode — controls docs/redoc visibility and other dev features.
# Set to "true" for local development; defaults to "false" (production-safe).
DEBUG = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

# Maximum upload file size in bytes (default: 20 MB)
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", str(20 * 1024 * 1024)))

# ── Validate critical secrets at startup ─────────────────────
_PLACEHOLDER_PREFIXES = ("CHANGE_ME",)

if not ADMIN_PASSWORD or ADMIN_PASSWORD.startswith(_PLACEHOLDER_PREFIXES):
    print("FATAL: ADMIN_PASSWORD environment variable is not set or is a placeholder.", file=sys.stderr)
    sys.exit(1)

if not SECRET_KEY or SECRET_KEY.startswith(_PLACEHOLDER_PREFIXES):
    print("FATAL: SECRET_KEY environment variable is not set or is a placeholder.", file=sys.stderr)
    sys.exit(1)
