from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SearchRequest(BaseModel):
    collection_name: str
    query: str
    top_k: int = 5

class SearchResult(BaseModel):
    id: str
    text: str
    score: float

@router.post("/")
async def search(request: SearchRequest):
    """Search within a collection"""
    # Basic demo search without Milvus
    return {
        "query": request.query,
        "collection": request.collection_name,
        "results": [
            {"id": "1", "text": "Demo result 1", "score": 0.95},
            {"id": "2", "text": "Demo result 2", "score": 0.87}
        ]
    }