from pydantic import BaseModel
class CreateCollectionRequest(BaseModel):
    collection_name: str
    dimension: int
