"""
utils/auth.py — Simple header-based master key verification.
"""
import logging
from fastapi import Header, HTTPException, status
from config import get_settings

log = logging.getLogger(__name__)
settings = get_settings()

async def verify_admin_key(x_admin_key: str = Header(None)):
    """
    Dependency to verify the Master Access Key.
    If ADMIN_KEY is not set in environment, verification is skipped (dev mode).
    """
    admin_key = settings.admin_key
    
    # If no key is configured, allow all (safety for local dev)
    if not admin_key:
        return
    
    if x_admin_key != admin_key:
        log.warning("Unauthorized access attempt from UI.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid X-Admin-Key header required"
        )
