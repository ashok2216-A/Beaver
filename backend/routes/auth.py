import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from models.models import User, ApiKey
from schemas.schemas import ApiKeyCreate, ApiKeyOut, MessageOut, UserOut, UserUpdate
from utils.auth import get_current_user, hash_key
from utils.email import send_agent_alert

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return user

@router.patch("/me", response_model=UserOut)
def update_me(data: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update the currently authenticated user's preferences."""
    if data.email_notifications is not None:
        user.email_notifications = data.email_notifications
    if data.weekly_reports is not None:
        user.weekly_reports = data.weekly_reports
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/me", response_model=MessageOut)
def delete_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Permanently delete the authenticated user's account and all associated data."""
    db.delete(user)
    db.commit()
    return MessageOut(message="Account and all associated data permanently deleted")

@router.post("/test-email", response_model=MessageOut)
async def test_email(user: User = Depends(get_current_user)):
    """Trigger a mock test email to verify preferences."""
    await send_agent_alert(
        user=user, 
        agent_name="Test Beaver", 
        error_message="This is a test alert to verify your notification settings."
    )
    return MessageOut(message="Mock email triggered. Check your backend console.")

@router.post("/keys", response_model=ApiKeyOut)
def create_api_key(data: ApiKeyCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Generate a new secure API Key for the authenticated user."""
    # Generate a secure random key with prefix 'ak_' for easy identification
    raw_key = f"ak_{secrets.token_urlsafe(32)}"
    h = hash_key(raw_key)
    
    new_key = ApiKey(
        user_id=user.id,
        key_hash=h,
        name=data.name
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    
    # Use model_dump or model_validate based on pydantic version
    out = ApiKeyOut.model_validate(new_key)
    out.key = raw_key  # Return the raw key to the user once
    return out

@router.get("/keys", response_model=list[ApiKeyOut])
def list_api_keys(user: User = Depends(get_current_user)):
    """List all API keys belonging to the authenticated user."""
    return user.api_keys

@router.delete("/keys/{key_id}", response_model=MessageOut)
def revoke_api_key(key_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Permanently revoke an API key."""
    key = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.user_id == user.id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API Key not found or access denied")
    
    db.delete(key)
    db.commit()
    return MessageOut(message="API Key successfully revoked")
