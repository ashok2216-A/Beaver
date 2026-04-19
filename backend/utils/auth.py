"""
utils/auth.py — Simple header-based master key verification.
"""
import logging
from typing import Optional
from fastapi import Header, Query, HTTPException, status
from config import get_settings

log = logging.getLogger(__name__)
settings = get_settings()

async def verify_admin_key(
    x_admin_key: Optional[str] = Header(None),
    admin_key: Optional[str] = Query(None)
):
    """
    Dependency to verify the Master Access Key.
    Accepts key from 'X-Admin-Key' header or 'admin_key' query parameter (for downloads).
    """
    secret = settings.admin_key
    
    # If no key is configured, allow all (safety for local dev)
    if not secret:
        return
    
    provided_key = x_admin_key or admin_key
    
    if provided_key != secret:
        log.warning("Unauthorized access attempt.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid Master Access Key required (header or query param)"
        )
