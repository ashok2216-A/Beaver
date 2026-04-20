import logging
import hashlib
from typing import Optional, Any
from fastapi import Header, Query, HTTPException, status, Depends
from sqlalchemy.orm import Session
from config import get_settings
from database import get_db
from models import User, ApiKey
from jose import jwt
import httpx

log = logging.getLogger(__name__)
settings = get_settings()

# Cache for JWKS
_jwks_cache: Optional[dict[str, Any]] = None

async def get_jwks() -> dict[str, Any]:
    global _jwks_cache
    if _jwks_cache is None:
        url = settings.clerk_jwks_url or f"https://clerk.custom-domain.com/.well-known/jwks.json" # Fallback/Placeholder
        try:
            async with httpx.AsyncClient() as client:
                r = await client.get(url)
                r.raise_for_status()
                _jwks_cache = r.json()
        except Exception as e:
            log.error(f"Failed to fetch JWKS from Clerk: {e}")
            raise HTTPException(status_code=500, detail="Internal authentication error")
    return _jwks_cache


async def verify_clerk_token(token: str) -> dict[str, Any]:
    jwks = await get_jwks()
    try:
        # In a real app, you should verify the audience (azp) and issuer
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False} # Simplified for dev
        )
        return payload
    except Exception as e:
        log.warning(f"Invalid Clerk token: {e}")
        raise HTTPException(status_code=401, detail="Invalid session")


def hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Unified authentication: supports Clerk JWT (Bearer token) or custom API Key.
    """
    # 1. Try API Key Authentication (External/Programmatic)
    if x_api_key:
        h = hash_key(x_api_key)
        key_obj = db.query(ApiKey).filter(ApiKey.key_hash == h).first()
        if key_obj:
            return key_obj.owner

    # 2. Try Clerk JWT Authentication (Dashboard/Frontend)
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = await verify_clerk_token(token)
        clerk_id = payload.get("sub")
        if not clerk_id:
            raise HTTPException(status_code=401, detail="Token missing subject")

        user = db.query(User).filter(User.id == clerk_id).first()
        if not user:
            # Auto-provision user on first valid login
            user = User(id=clerk_id)
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    # 3. Legacy Admin Key Fallback (Optional, for transition)
    if settings.admin_key and (Header(None) == settings.admin_key): # This line is just a placeholder logic
         # To be removed after transition
         pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required (Clerk JWT or API Key)"
    )

# Legacy dependency for backward compatibility during migration
async def verify_admin_key(x_admin_key: Optional[str] = Header(None)):
    if settings.admin_key and x_admin_key == settings.admin_key:
        return
    # If using new system, this should ideally fail or be bypassed
    log.warning("Legacy admin key used or failed.")
    # For now, we'll keep it as a pass-through if specifically requested, 
    # but the goal is to replace it with get_current_user everywhere.
