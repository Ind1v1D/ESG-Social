"""
Database engine and session factory.

Current backend: **SQLite** (file-based, persisted via Docker volume).

┌──────────────────────────────────────────────────────────────────────┐
│  SQLite Limitations                                                  │
│  ──────────────────────────────────────────────────────────────────── │
│  • Single-writer: only one write transaction at a time.  WAL mode    │
│    (enabled below) improves read concurrency but writes are still    │
│    serialised.                                                       │
│  • Not suitable for horizontal scaling — every replica would need    │
│    its own copy of the database file.                                │
│  • Best suited for MVP / small deployments with moderate traffic.    │
│                                                                      │
│  Migration path to PostgreSQL                                        │
│  ──────────────────────────────────────────────────────────────────── │
│  1. Change DATABASE_URL to a PostgreSQL DSN:                         │
│       DATABASE_URL=postgresql://user:pass@host:5432/dbname           │
│  2. Remove the `check_same_thread` connect arg (SQLite-only).        │
│  3. Remove the SQLite PRAGMA listener.                               │
│  4. Run `alembic upgrade head` (add Alembic for migrations).         │
│  5. Add `psycopg2-binary` (or `asyncpg`) to requirements.txt.       │
│  The SQLAlchemy ORM layer and all models remain unchanged.           │
└──────────────────────────────────────────────────────────────────────┘
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from config import DATABASE_URL

_is_sqlite = "sqlite" in DATABASE_URL

# Build engine kwargs conditionally per backend
_engine_kwargs: dict = {
    "echo": False,
}
if _is_sqlite:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # For PostgreSQL / other network databases, verify connections before use
    _engine_kwargs["pool_pre_ping"] = True

engine = create_engine(DATABASE_URL, **_engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Enable WAL mode for SQLite (better concurrency)
if _is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def get_db():
    """FastAPI dependency that yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and seed default settings + admin."""
    from models import Base, Setting, Admin
    from passlib.context import CryptContext
    from config import ADMIN_USER, ADMIN_PASSWORD

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(Setting).filter(Setting.key == "active_upload_id").first()
        if not existing:
            db.add(Setting(key="active_upload_id", value=""))
            db.commit()

        # Seed default admin from .env if no admins exist
        admin_count = db.query(Admin).count()
        if admin_count == 0:
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            default_admin = Admin(
                username=ADMIN_USER,
                password_hash=pwd_context.hash(ADMIN_PASSWORD),
                is_active=True,
            )
            db.add(default_admin)
            db.commit()
            print(f"[init_db] Seeded default admin: {ADMIN_USER}")
    finally:
        db.close()
