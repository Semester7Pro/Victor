from fastapi import APIRouter
from pydantic import BaseModel
from backend.services.supabase_service import (
    insert_document_record,
    insert_collection_record,
    get_supabase
)
import zipfile
import tempfile
import os

router = APIRouter()

class UploadCallback(BaseModel):
    file_path: str
    filename: str
    mime_type: str
    file_size: int
    org_id: str = ""
    uploader_id: str = ""

@router.post("/upload-callback")
async def upload_callback(data: UploadCallback):

    # ========== CASE 1: ZIP FILE ==========
    if data.mime_type in ["application/zip", "application/x-zip-compressed"] \
       or data.filename.endswith(".zip"):

        supabase = get_supabase()

        # ------------------------------------------
        # 1️⃣ Save ZIP inside documents/zipUploaded/
        # ------------------------------------------
        zip_storage_path = f"zipUploaded/{data.filename}"

        # Download original uploaded zip from Supabase
        temp_zip_path = tempfile.mktemp(suffix=".zip")
        with open(temp_zip_path, "wb") as f:
            res = supabase.storage.from_("documents").download(data.file_path)
            f.write(res)

        print("📥 Downloaded ZIP from:", data.file_path)
        print("📦 Temp ZIP saved at:", temp_zip_path)

        # Re-upload ZIP to the correct folder
        supabase.storage.from_("documents").upload(
            zip_storage_path, open(temp_zip_path, "rb")
        )
        print("⬆️ Uploaded ZIP to:", zip_storage_path)
        
        supabase.storage.from_("documents").remove([data.file_path])
        print("🗑 Deleted original ZIP from:", data.file_path)
        
        # ------------------------------------------
        # 2️⃣ Insert into collections table
        # ------------------------------------------
        collection = insert_collection_record({
            "name": data.filename,
            "file_path": zip_storage_path,   # IMPORTANT
            "org_id": data.org_id,
            "uploader_id": data.uploader_id
        })

        collection_id = collection.get("id")

        # ------------------------------------------
        # 3️⃣ Extract ZIP → upload each file
        # ------------------------------------------
        extracted_docs = []
        temp_extract_dir = tempfile.mkdtemp()

        print("📂 Extracting ZIP...")

        with zipfile.ZipFile(temp_zip_path, 'r') as z:
            z.extractall(temp_extract_dir)

        for root, dirs, files in os.walk(temp_extract_dir):
            for file in files:
                if file.lower().endswith(".zip"):
                    print(f"⏩ Skipping ZIP inside ZIP: {file}")
                    continue
                
                local_path = os.path.join(root, file)

                # Compute relative path inside ZIP
                relative_path = os.path.relpath(local_path, temp_extract_dir)
                relative_path = relative_path.replace("\\", "/")
                # Upload to documents/uploads/
                storage_path = f"uploads/{relative_path}"

                print("⬆️ Uploading extracted file:", storage_path)

                supabase.storage.from_("documents").upload(
                    storage_path, open(local_path, "rb")
                )

                # Insert extracted file into documents table
                inserted = insert_document_record({
                    "collection_id": collection_id,
                    "file_path": storage_path,
                    "filename": data.filename,
                    "mime_type": "application/octet-stream",
                    "file_size": os.path.getsize(local_path),
                    "org_id": data.org_id,
                    "uploader_id": data.uploader_id,
                    "status": "extracted"
                })

                extracted_docs.append(inserted)

        return {
            "status": "ok",
            "type": "zip",
            "collection": collection,
            "documents": extracted_docs
        }

    # ========== CASE 2: SINGLE FILE ==========
    else:
        inserted = insert_document_record({
            "file_path": data.file_path,
            "filename": data.filename,
            "mime_type": data.mime_type,
            "file_size": data.file_size,
            "org_id": data.org_id,
            "uploader_id": data.uploader_id,
            "status": "uploaded"
        })

        return {"status": "ok", "type": "single", "document": inserted}
