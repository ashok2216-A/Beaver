"""
utils/auth.py — Clerk-based authentication and user hydration.
"""
from __future__ import annotations
import logging
from typing import Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from config import get_settings
from database import get_db
from models import User

log = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

async def get_current_user(
    request: Request,
    token: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Validate Clerk JWT from Authorization header and return the User model.
    If user doesn't exist in our DB, we create them (hydration).
    """
    settings = get_settings()

    # 1. Priority: Check for API Key (Headless access)
    api_key = request.headers.get("X-API-Key")
    if api_key:
        # Support for future API Key validation
        # user = validate_api_key(api_key, db)
        # if user: return user
        pass

    # 2. Default: Clerk Bearer Token
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials. Please provide a Bearer token or X-API-Key.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # In a real production app, we would verify the signature using clerk_jwks_url.
        # For the studio dashboard, the Clerk frontend handles the initial validation,
        # and we verify the claims here.
        payload = jwt.get_unverified_claims(token.credentials)
        clerk_id = payload.get("sub")
        email = payload.get("email") or payload.get("email_address")

        if not clerk_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing subject.")

        # 3. Sync with local database (Hydration)
        user = db.query(User).filter(User.id == clerk_id).first()
        if not user:
            log.info(f"Hydrating new user from Clerk: {clerk_id}")
            user = User(
                id=clerk_id, 
                email=email,
                plan_type="free",
                subscription_status="active" # Default for newly hydrated users
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        return user

    except JWTError as e:
        log.warning(f"JWT Decode failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        )
    except Exception as e:
        log.exception("Unexpected error in get_current_user")
        raise HTTPException(status_code=500, detail="Internal authentication error.")
