"""
main.py — Application entry point.

Start with:
  uvicorn main:app --reload                   # dev
  uvicorn main:app --host 0.0.0.0 --port 8000 # prod

Security hardening:
  - Rate limiting via slowapi (SEC-5)
  - Docs disabled in production (SEC-10)
  - Timing headers hidden in production (SEC-14)
"""
import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from utils.limiter import limiter

from config.config import get_settings
from database.database import Base, engine
from routes import agents, chat, auth, billing, oauth, actions, agent_teams, custom_tools, files
from utils.auth import get_current_user

from utils.logging_config import setup_logging
from utils.validate_env import validate_environment

# ─── Logging setup ────────────────────────────────────────────────────────────
settings = get_settings()
setup_logging(log_level=settings.log_level, is_prod=settings.is_production)
log = logging.getLogger(__name__)

# Patch LiteLLM to map the "error" finish reason to "stop" to suppress unmapped warning
try:
    import litellm.litellm_core_utils.core_helpers as litellm_helpers
    if hasattr(litellm_helpers, "_FINISH_REASON_MAP"):
        litellm_helpers._FINISH_REASON_MAP["error"] = "stop"
except Exception as e:
    log.warning(f"Failed to patch LiteLLM _FINISH_REASON_MAP: {e}")


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(_: FastAPI):
    log.info("🚀 beaver backend starting up.")
    
    log.info("⚙️ Step 0/3: Validating environment configuration…")
    validate_environment()
    
    log.info("⚙️ Step 1/3: Loading configuration and settings…")
    _ = get_settings()
    
    log.info("🗄️ Step 2/3: Initializing database engine and tables…")
    Base.metadata.create_all(bind=engine)
    
    log.info("✅ Step 3/3: Database ready. API is now active.")
    yield
    log.info("👋 Shutting down.")


# ─── App factory ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="api2bot Studio API",
    description="Turn any OpenAPI spec into a production-ready AI agent.",
    version="1.0.0",
    # SEC-10: Disable interactive API docs in production
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    lifespan=lifespan,
)

# Attach rate limiter to the app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ─── CORS ─────────────────────────────────────────────────────────────────────

if settings.is_production:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-API-Key"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# ─── Request timing middleware (dev only) ──────────────────────────────────────

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start = time.monotonic()
    response = await call_next(request)
    elapsed_ms = int((time.monotonic() - start) * 1000)
    # SEC-14: Only expose timing info in development
    if not settings.is_production:
        response.headers["X-Process-Time-Ms"] = str(elapsed_ms)
    return response


# ─── Security headers middleware ───────────────────────────────────────────────

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# ─── Global error handler ─────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.exception("Unhandled exception on %s %s", request.method, request.url.path)
    # SEC-12: Never leak internal details to clients
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )


# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(
    auth.router,
    prefix="/api/v1",
)

app.include_router(
    agents.router, 
    prefix="/api/v1",
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    chat.router,   
    prefix="/api/v1",
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    billing.router,
    prefix="/api/v1",
)

app.include_router(actions.router, prefix="/api/v1")
app.include_router(agent_teams.router, prefix="/api/v1")
app.include_router(custom_tools.router, prefix="/api/v1")
app.include_router(
    files.router, 
    prefix="/api/v1",
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    oauth.router,
    prefix="/api/v1",
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    actions.router,
    prefix="/api/v1",
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    agent_teams.router,
    prefix="/api/v1",
    dependencies=[Depends(get_current_user)]
)

app.include_router(
    custom_tools.router,
    prefix="/api/v1",
    # No Clerk JWT auth here — endpoints authenticate via the Duffel API key
    # in the Authorization header and are only callable from the local agent executor.
)




# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}

# ─── Static Files & SPA Catch-all ─────────────────────────────────────────────

# Attempt to find the frontend dist folder in multiple locations
possible_dist_paths = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist"),
    os.path.join(os.getcwd(), "frontend", "dist"),
    os.path.join(os.getcwd(), "dist"),
]

frontend_dist = None
for path in possible_dist_paths:
    if os.path.exists(path) and os.path.exists(os.path.join(path, "index.html")):
        frontend_dist = path
        log.info(f"✅ Found frontend at: {path}")
        break

if frontend_dist:
    # Mount assets folder if it exists
    assets_path = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def catch_all(request: Request, full_path: str):
        # 1. Skip API routes (though they are matched first, this is a safety net)
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "API route not found"})
            
        # 2. Check if it's a static file request (has an extension)
        if "." in full_path.split("/")[-1]:
            # Try to serve the file directly if it exists in dist
            file_path = os.path.join(frontend_dist, full_path)
            if os.path.exists(file_path):
                return FileResponse(file_path)
            return JSONResponse(status_code=404, content={"detail": f"File {full_path} not found"})
            
        # 3. Serve index.html for all other routes (SPA routing)
        index_path = os.path.join(frontend_dist, "index.html")
        return FileResponse(index_path)
else:
    log.warning("⚠️ Frontend dist not found. Operating in API-only mode.")
    @app.get("/")
    def root():
        return {
            "service": "beaver",
            "version": "1.0.0",
            "status":  "running",
            "message": "Frontend not found. Please build frontend first."
        }
