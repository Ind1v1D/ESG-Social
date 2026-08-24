"""
Simple in-memory rate limiter for login attempts.

Limitations (by design — suitable for MVP):
- State is per-process / per-worker.  If gunicorn runs N workers each
  worker tracks its own counters, so the effective limit is multiplied
  by N in the worst case.
- State is lost on restart.
- Not suitable for multi-instance / horizontally-scaled deployments.
  For that, use Redis-backed rate limiting (e.g. slowapi + Redis).

Usage:
    from rate_limit import login_rate_limit
    @router.post("/login")
    def login(req: LoginRequest, _rl=Depends(login_rate_limit)):
        ...
"""
import time
from collections import defaultdict
from fastapi import HTTPException, Request, status


# ── Configuration ────────────────────────────────────────────
MAX_ATTEMPTS = 5          # max failed attempts before blocking
WINDOW_SECONDS = 5 * 60  # sliding window (5 minutes)

# ── Storage ──────────────────────────────────────────────────
# { ip_address: [ timestamp_of_failed_attempt, ... ] }
_attempts: dict[str, list[float]] = defaultdict(list)


def _clean_old(ip: str) -> None:
    """Remove attempts older than the window."""
    cutoff = time.monotonic() - WINDOW_SECONDS
    _attempts[ip] = [t for t in _attempts[ip] if t > cutoff]


def record_failure(ip: str) -> None:
    """Record a failed login attempt for the given IP."""
    _attempts[ip].append(time.monotonic())


def reset(ip: str) -> None:
    """Clear the failure counter for a given IP (e.g. on successful login)."""
    _attempts.pop(ip, None)


async def login_rate_limit(request: Request) -> None:
    """FastAPI dependency — raises 429 if the caller exceeded the limit."""
    ip = request.client.host if request.client else "unknown"
    _clean_old(ip)
    if len(_attempts[ip]) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Try again in a few minutes.",
        )
