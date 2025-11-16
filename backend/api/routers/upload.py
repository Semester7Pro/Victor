# from fastapi import APIRouter
# from pydantic import BaseModel
# from services.supabase_service import SupabaseService

# router = APIRouter()

# class UploadCallback(BaseModel):
#     file_path: str
#     filename: str
#     mime_type: str
#     file_size: int
#     org_id: str
#     uploader_id: str

# @router.post("/upload-callback")
# async def upload_callback(data: UploadCallback):
#     supabase = SupabaseService()

#     doc_id = supabase.insert_document(
#         org_id=data.org_id,
#         uploader_id=data.uploader_id,
#         file_path=data.file_path,
#         filename=data.filename,
#         mime_type=data.mime_type,
#         file_size=data.file_size
#     )

#     return {"status": "ok", "doc_id": doc_id}
