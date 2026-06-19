from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import os
import uuid
import shutil
import logging
from utils.auth import get_current_user
from models.models import User

log = logging.getLogger(__name__)

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = os.path.join(os.getcwd(), ".beaver", "tmp")

@router.post("/upload/temp")
async def upload_temp_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a temporary file. Returns a beaver-file:// token.
    """
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        file_id = str(uuid.uuid4())
        # Preserve extension if present
        ext = os.path.splitext(file.filename)[1] if file.filename else ""
        filename = f"{file_id}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        token = f"beaver-file://{filename}"
        log.info(f"User {current_user.id} uploaded temp file: {token}")
        
        return {"file_id": token, "filename": file.filename, "size": os.path.getsize(filepath)}
    except Exception as e:
        log.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload file")
