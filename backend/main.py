"""
main.py — Application entry point.

Start with:
  uvicorn main:app --reload                   # dev
  uvicorn main:app --host 0.0.0.0 --port 8000 # prod
"""
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import get_settings
from database import Base, engine
from routes import agents, chat

# ─── Logging setup ────────────────────────────────────────────────────────────
settings = get_settings()

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(_: FastAPI):
    log.info("🚀 api2bot-studio backend starting up…")
    Base.metadata.create_all(bind=engine)
    log.info("✅ Database tables ready.")
    yield
    log.info("👋 Shutting down.")


# ─── App factory ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="api2bot Studio API",
    description="Turn any OpenAPI spec into a production-ready AI agent.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request timing middleware ─────────────────────────────────────────────────

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.monotonic()
    response = await call_next(request)
    elapsed_ms = int((time.monotonic() - start) * 1000)
    response.headers["X-Process-Time-Ms"] = str(elapsed_ms)
    return response


# ─── Global error handler ─────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Check server logs."},
    )


# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(agents.router, prefix="/api/v1")
app.include_router(chat.router,   prefix="/api/v1")


# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {
        "service": "api2bot-studio",
        "version": "1.0.0",
        "status":  "running",
        "env":     settings.app_env,
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
