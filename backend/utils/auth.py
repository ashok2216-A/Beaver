"""
utils/auth.py — Unified authentication: Clerk JWT + API Key.
"""
from __future__ import annotations
import logging
import hashlib
import time
from datetime import datetime, timezone
from typing import Optional, Any
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
import httpx

from config.config import get_settings
from database.database import get_db
from models.models import User, ApiKey

log = logging.getLogger(__name__)
settings = get_settings()
security = HTTPBearer(auto_error=False)

# ── JWKS cache with TTL ──────────────────────────────────────────────────────
_jwks_cache: Optional[dict[str, Any]] = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL_SECONDS = 3600  # Refresh signing keys every 1 hour

async def get_jwks() -> dict[str, Any]:
    """Fetch Clerk JWKS with a 1-hour TTL cache to handle key rotation."""
    global _jwks_cache, _jwks_fetched_at

    now = time.monotonic()
    if _jwks_cache is not None and (now - _jwks_fetched_at) < _JWKS_TTL_SECONDS:
        return _jwks_cache

    url = settings.clerk_jwks_url
    if not url or "..." in url or "custom-domain" in url:
        log.error("Clerk JWKS URL is missing or set to a placeholder")
        raise HTTPException(
            status_code=500,
            detail="Authentication service is not configured.",
        )

    try:
        headers = {"User-Agent": "Mozilla/5.0 Beaver/1.0"}
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(url, headers=headers)
            r.raise_for_status()
            _jwks_cache = r.json()
            _jwks_fetched_at = now
            log.debug("JWKS cache refreshed successfully")
    except httpx.HTTPStatusError:
        log.error("Failed to fetch JWKS from identity provider")
        raise HTTPException(
            status_code=500,
            detail="Authentication service is temporarily unavailable.",
        )
    except Exception:
        log.exception("Unexpected error refreshing JWKS")
        raise HTTPException(
            status_code=500,
            detail="Internal authentication error.",
        )
    return _jwks_cache

async def verify_clerk_token(token: str) -> dict[str, Any]:
    """Verify a Clerk JWT with issuer validation and key rotation support."""
    jwks = await get_jwks()
    try:
        decode_options: dict[str, Any] = {
            "verify_aud": False,   # Clerk doesn't set aud by default
            "leeway": 60,
        }

        issuer = None
        if settings.clerk_jwks_url:
            base = settings.clerk_jwks_url.rsplit("/.well-known", 1)[0]
            if base:
                issuer = base
                decode_options["verify_iss"] = True

        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer=issuer,
            options=decode_options,
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

# ── API Key logic ────────────────────────────────────────────────────────────

def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()

def validate_api_key(key: str, db: Session) -> User | None:
    h = hash_key(key)
    api_key_obj = db.query(ApiKey).filter(ApiKey.key_hash == h).first()
    if api_key_obj:
        api_key_obj.last_used_at = datetime.now(timezone.utc)
        db.commit()
        return api_key_obj.owner
    return None

# ── Unified auth dependency ──────────────────────────────────────────────────

async def get_current_user(
    request: Request,
    token: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Unified authentication: supports Clerk JWT (Bearer token) or custom API Key.
    Supports both X-API-Key header and Bearer ak_... tokens.
    """
    # 1. Check for X-API-Key header
    api_key = request.headers.get("X-API-Key")
    if api_key:
        user = validate_api_key(api_key, db)
        if user:
            return user
        raise HTTPException(status_code=401, detail="Invalid API Key")

    # 2. Check for Bearer token
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    raw_token = token.credentials

    # Case A: Bearer token is an API Key (ak_...)
    if raw_token.startswith("ak_"):
        user = validate_api_key(raw_token, db)
        if user:
            return user
        raise HTTPException(status_code=401, detail="Invalid API Key")

    # Case B: Bearer token is a Clerk JWT
    try:
        payload = await verify_clerk_token(raw_token)
        clerk_id = payload.get("sub")
        email = payload.get("email") or payload.get("email_address")

        if not clerk_id:
            raise HTTPException(status_code=401, detail="Invalid session token")

        user = db.query(User).filter(User.id == clerk_id).first()
        if not user:
            log.info(f"Hydrating new user from Clerk: {clerk_id}")
            user = User(
                id=clerk_id,
                email=email,
                plan_type="free",
                subscription_status="active"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return user

    except HTTPException:
        raise
    except Exception:
        log.exception("Unexpected auth error")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication failed")
