"""
database.py â€” SQLAlchemy engine, session factory, and Base.
Supports SQLite (dev) and PostgreSQL (prod) via DATABASE_URL.
"""
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from config.config import get_settings

settings = get_settings()

# Standardize Database URL for Render (postgres:// -> postgresql://)
db_url = settings.database_url
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# SQLite: enforce FK constraints + WAL for concurrency
_connect_args = (
    {"check_same_thread": False}
    if db_url.startswith("sqlite")
    else {}
)

engine = create_engine(
    db_url,
    connect_args=_connect_args,
    echo=False,  # Raw SQL logging is too noisy; using step-based logs in main.py instead
    pool_pre_ping=True,
)

# Enable WAL mode and foreign keys for SQLite
if settings.database_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragmas(dbapi_conn, _):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# Silence SQLAlchemy's noisy engine logging
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
