from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class CollectionRequest(BaseModel):
    name: str
    description: str = ""

# In-memory collections storage for demo
collections_db = {}

@router.post("/")
async def create_collection(request: CollectionRequest):
    """Create a new collection"""
    if request.name in collections_db:
        return {"error": "Collection already exists", "status_code": 400}
    
    collections_db[request.name] = {
        "name": request.name,
        "description": request.description,
        "documents": []
    }
    
    return {
        "collection_name": request.name,
        "status": "created",
        "description": request.description
    }

@router.get("/")
async def list_collections():
    """List all collections"""
    return {"collections": list(collections_db.keys())}

@router.delete("/{collection_name}")
async def delete_collection(collection_name: str):
    """Delete a collection"""
    if collection_name in collections_db:
        del collections_db[collection_name]
        return {"message": f"Collection '{collection_name}' deleted"}
    else:
        return {"error": "Collection not found", "status_code": 404}