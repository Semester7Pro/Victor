from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from backend.services.supabase_service import insert_document_record

router = APIRouter()

class UploadCallback(BaseModel):
    file_path: str
    filename: str
    mime_type: str
    file_size: int
    org_id: str = ""
    uploader_id: str = ""

# In-memory storage for demo
uploads_db = []

@router.post("/upload-callback")
async def upload_callback(data: UploadCallback):

    inserted = insert_document_record({
        "file_path": data.file_path,
        "filename": data.filename,
        "mime_type": data.mime_type,
        "file_size": data.file_size,
        "org_id": data.org_id,
        "uploader_id": data.uploader_id,
        "status": "uploaded"
    })

    return {"status": "ok", "document": inserted}
