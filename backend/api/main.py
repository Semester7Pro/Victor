import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, HTTPException, status, Request, Depends, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager
import time
from urllib.parse import quote
from dotenv import load_dotenv
from api.dependencies import verify_auth_token
from services.conversation_service import get_conversation_service
from backend.api.routers import auth
from api.milvus_client import get_milvus_client
from services.full_langchain_service import get_full_langchain_rag
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import asyncio
from concurrent.futures import ThreadPoolExecutor
from pymilvus import connections, utility, Collection, DataType
import jwt
from bson import ObjectId
from typing import List, Dict, Optional, Any
import logging

from core.config import get_settings
from services.ollama_service import OllamaService
from services.milvus_service import MilvusService
from services.network_monitor import get_network_monitor
from services.speech_service import get_speech_service
from api.llm_client import HybridLLMClient


# Load .env from project root
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

# Get DEFAULT_USER_ID from environment
DEFAULT_USER_ID = os.getenv("DEFAULT_USER_ID", "default")

# Logger
logger = logging.getLogger(__name__)
settings = get_settings()

# Response Models
class ServiceStatus(BaseModel):
    status: str
    available: Optional[bool] = None
    model: Optional[str] = None
    url: Optional[str] = None
    api_key_configured: Optional[bool] = None
    error: Optional[str] = None

class LLMServices(BaseModel):
    online: ServiceStatus
    offline: ServiceStatus

class HealthResponse(BaseModel):
    status: str
    mode: str
    active_llm: str
    services: Dict[str, Any]

class RootResponse(BaseModel):
    status: str
    mode: str
    message: str
    version: str
    current_mode: str
    services: Dict[str, Any]
    features: Dict[str, bool]

# Lifespan context manager for startup/shutdown
executor = ThreadPoolExecutor(max_workers=2)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("=" * 60)
    logger.info("🚀 Starting VICTOR API in HYBRID MODE")
    logger.info("=" * 60)
    
    # Initialize network monitor
    network_monitor = get_network_monitor()
    
    # Check services
    online_ok, ollama_ok = await network_monitor.check_services(use_cache=False)
    
    logger.info(f"🌐 Online API (OpenRouter): {'✅ Available' if online_ok else '❌ Unavailable'}")
    logger.info(f"⚡ Offline LLM (Ollama): {'✅ Available' if ollama_ok else '❌ Unavailable'}")
    
    # Determine mode
    mode = await network_monitor.get_best_mode()
    logger.info(f"🎯 Active Mode: {mode.upper()}")
    
    if mode == "online":
        logger.info(f"   Using: {settings.ONLINE_LLM_MODEL}")
    elif mode == "offline":
        logger.info(f"   Using: {settings.OLLAMA_LLM_MODEL}")
    
    # Check databases
    try:
        from services.milvus_service import MilvusService
        milvus = MilvusService()
        logger.info("✅ Milvus connected")
    except Exception as e:
        logger.warning(f"⚠️  Milvus: {e}")
    
    try:
        from pymongo import MongoClient
        client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=3000)
        client.admin.command('ping')
        logger.info("✅ MongoDB connected")
        client.close()
    except Exception as e:
        logger.warning(f"⚠️  MongoDB: {e}")
    
    logger.info("=" * 60)
    logger.info("🔄 HYBRID MODE ACTIVE")
    logger.info("💡 Automatic fallback enabled")
    logger.info("=" * 60)
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="VICTOR API (Hybrid Mode)",
    version="2.0.0-hybrid",
    description="AI-powered RAG system - Online with Offline Fallback",
    lifespan=lifespan
)

# CORS middleware
origins = settings.CORS_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Important for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    if "/ask" in str(request.url):
        logger.info(f"🟡 REQUEST: {request.method} {request.url}")
    response = await call_next(request)
    return response

# Pydantic models (keep your existing models)
class QueryRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    top_k: int = 5
    temperature: float = 0.1

class CreateConversationRequest(BaseModel):
    title: str
    metadata: Dict = {}

class ConversationMetadata(BaseModel):
    conversation_id: str
    user_id: str
    title: Optional[str]
    created_at: str
    updated_at: str
    message_count: int

class ListConversationsResponse(BaseModel):
    conversations: List[ConversationMetadata]
    count: int

# Response model for transcription
class TranscriptResponse(BaseModel):
    transcript: str

class SearchResult(BaseModel):
    text: str
    source: Optional[str] = None
    page: Optional[int] = None
    score: Optional[float] = None
    document_id: Optional[str] = None
    chunk_id: Optional[str] = None
    global_chunk_id: Optional[str] = None
    chunk_index: Optional[int] = None
    section_hierarchy: Optional[str] = None
    heading_context: Optional[str] = None
    char_count: Optional[int] = None
    word_count: Optional[int] = None
    published_date: Optional[str] = None
    language: Optional[str] = None
    category: Optional[str] = None
    document_type: Optional[str] = None
    ministry: Optional[str] = None
    source_reference: Optional[str] = None

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    count: int
    latency_ms: float

class RAGResponse(BaseModel):
    query: str
    answer: str
    sources: List[SearchResult]
    conversation_id: Optional[str] = None
    model_used: Optional[str] = None
    total_latency_ms: Optional[float] = None
    method: Optional[str] = None

class HybridSearchRequest(BaseModel):
    query: str
    top_k: int = 5
    category: Optional[str] = None
    language: Optional[str] = None
    document_type: Optional[str] = None
    document_id: Optional[str] = None
    ministry: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None

# Find the RAGRequest class definition and add the missing field

class RAGRequest(BaseModel):
    """Request model for RAG queries with filters"""
    query: str
    conversation_id: Optional[str] = None
    temperature: float = 0.7
    top_k: int = 5
    dense_weight: float = 0.7
    sparse_weight: float = 0.3
    method: str = "hybrid"
    category: Optional[str] = None
    language: Optional[str] = None
    document_type: Optional[str] = None
    document_name: Optional[str] = None
    ministry: Optional[str] = None  # ✅ ADD THIS LINE
    date_from: Optional[str] = None
    date_to: Optional[str] = None

class CompareRequest(BaseModel):
    topic1: str
    topic2: str
    conversation_id: Optional[str] = None
    temperature: float = 0.1
    top_k: int = 5
    dense_weight: float = 0.7
    sparse_weight: float = 0.3
    method: str = "hybrid"

class CompareResponse(BaseModel):
    topic1: str
    topic2: str
    topic1_answer: str
    topic2_answer: str
    comparison_analysis: str
    topic1_sources: List[Any]
    topic2_sources: List[Any]
    conversation_id: str
    model_used: str
    total_latency_ms: float

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check API and Milvus health with hybrid search validation"""
    try:
        milvus_client = get_milvus_client()
        health = milvus_client.health_check()
        
        return HealthResponse(
            status="healthy" if health["milvus_connected"] else "unhealthy",
            milvus_connected=health["milvus_connected"],
            collection_exists=health["collection_exists"],
            total_vectors=health["total_vectors"],
            embedding_model=health.get("embedding_model", ""),
            hybrid_enabled=health.get("hybrid_enabled", False),
            has_dense_field=health.get("has_dense_field", False),
            has_sparse_field=health.get("has_sparse_field", False)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Health check failed: {str(e)}"
        )

# helper to update conversation context/messages in MongoDB (used by /ask)
async def _update_conversation_context(conversation_id, user_id, user_query, assistant_answer, conversation_context):
    try:
        from services.mongodb_service import get_mongo_db
        from datetime import datetime

        db = get_mongo_db()

        now = datetime.utcnow()

        # Prepare message documents
        user_msg = {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "user",
            "text": user_query,
            "created_at": now
        }
        assistant_msg = {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": "assistant",
            "text": assistant_answer,
            "created_at": now
        }

        # Insert messages into messages collection if available
        try:
            if hasattr(db, "messages"):
                db.messages.insert_many([user_msg, assistant_msg])
            else:
                db.get_collection("messages").insert_many([user_msg, assistant_msg])
        except Exception as insert_err:
            # Non-fatal: log and continue to update conversation metadata
            logger.warning(f"Failed to insert messages for conversation {conversation_id}: {insert_err}")

        # Update conversation metadata: increment message_count and set updated_at
        try:
            db.conversations.update_one(
                {"conversation_id": conversation_id, "user_id": user_id},
                {"$inc": {"message_count": 2}, "$set": {"updated_at": now}}
            )
        except Exception as upd_err:
            logger.warning(f"Failed to update conversation metadata for {conversation_id}: {upd_err}")

    except Exception as e:
        # Catch-all so this helper never raises and breaks the main flow
        logger.warning(f"Could not update conversation context: {e}")

# Simplified approach - strict filtering when filters provided

@app.post("/ask", response_model=RAGResponse)
async def ask(request: RAGRequest, user: dict = Depends(verify_auth_token)):
    """RAG with hybrid retrieval and role-based parameters"""
    try:
        logger.info(f"\n" + "="*80)
        logger.info(f"📤 NEW RAG REQUEST")
        logger.info(f"="*80)
        logger.info(f"   Query: {request.query}")
        logger.info(f"   User: {user.get('email', 'unknown')}")
        logger.info(f"   Role: {user.get('role', 'user')}")
        
        # ✅ Check if ANY filter is provided
        has_filters = any([
            getattr(request, 'category', None),
            getattr(request, 'language', None),
            getattr(request, 'document_type', None),
            getattr(request, 'document_id', None),
            getattr(request, 'ministry', None),
            getattr(request, 'date_from', None),
            getattr(request, 'date_to', None)
        ])
        
        if has_filters:
            logger.info(f"\n🔍 FILTERED MODE: Applying metadata filters")
            
            # ✅ Build filter expression (INCLUDING document_id)
            filter_expr = build_filter_expression(
                category=getattr(request, 'category', None),
                language=getattr(request, 'language', None),
                document_type=getattr(request, 'document_type', None),
                document_id=getattr(request, 'document_id', None),  # ✅ Include in metadata filter
                date_from=getattr(request, 'date_from', None),
                date_to=getattr(request, 'date_to', None),
                ministry=getattr(request, 'ministry', None)
            )
            
            # ✅ Don't enhance query or use keyword filter
            # The metadata filter handles document_id
            search_query = request.query
            document_keyword = None  # ✅ No content-based keyword filtering
        else:
            logger.info(f"\n🔍 NORMAL MODE: Semantic search without filters")
            filter_expr = None
            search_query = request.query
            document_keyword = None
        
        # Get conversation context
        conversation_context = None
        if request.conversation_id:
            from services.mongodb_service import mongodb_service
            conv = mongodb_service.get_conversation(request.conversation_id, user["user_id"])
            if conv:
                conversation_context = conv.get("context", {})
        
        # Get RAG service
        langchain_rag = get_full_langchain_rag()
        total_start = time.time()
        
        # ✅ Execute RAG with metadata filter
        result = await langchain_rag.ask(
            query=search_query,
            user_id=user["user_id"],
            conversation_id=request.conversation_id,
            temperature=request.temperature,
            top_k=request.top_k,
            user=user,
            dense_weight=request.dense_weight,
            sparse_weight=request.sparse_weight,
            method=request.method,
            conversation_context=conversation_context,
            filter_expr=filter_expr,  # ✅ Metadata filter includes document_id
            document_keyword=document_keyword  # ✅ No keyword filtering
        )
        
        # ✅ SAFETY CHECK: Ensure result is valid
        if not result or not isinstance(result, dict):
            logger.warning(f"Invalid result from RAG: {type(result)}")
            result = {
                "answer": "I apologize, but I couldn't process your request. Please try again.",
                "sources": [],
                "conversation_id": request.conversation_id or "error",
                "model_used": "unknown",
                "method": request.method
            }
        
        # Ensure all required keys exist
        result.setdefault("answer", "No answer generated")
        result.setdefault("sources", [])
        result.setdefault("conversation_id", request.conversation_id or "error")
        result.setdefault("model_used", "unknown")
        result.setdefault("method", request.method)
        
        total_latency = (time.time() - total_start) * 1000
        
        # Update conversation context after response
        if request.conversation_id and result.get("answer"):
            await _update_conversation_context(
                request.conversation_id,
                user["user_id"],
                request.query,
                result["answer"],
                conversation_context
            )
        
        # Format sources for response
        formatted_sources = []
        for source in result.get("sources", []):
            try:
                # Use document_id directly as the source name
                source_name = source.get('document_id', '')
                
                formatted_sources.append(SearchResult(
                    text=source.get("text", ""),
                    source=source.get("source", ""),
                    page=source.get("page", 0),
                    score=source.get("score", 0.0),
                    document_id=source.get("document_id"),
                    chunk_id=source.get("chunk_id"),
                    global_chunk_id=source.get("global_chunk_id"),
                    chunk_index=source.get("chunk_index"),
                    section_hierarchy=source.get("section_hierarchy"),
                    heading_context=source.get("heading_context"),
                    char_count=source.get("char_count"),
                    word_count=source.get("word_count"),
                    # Use document_id directly as the name
                    source_file=source_name,
                    page_idx=source.get('page_idx') or source.get('page', 0),
                    document_name=source_name
                ))
            except Exception as e:
                logger.warning(f"Error formatting source: {e}")
                continue
        
        logger.info(f"\n✅ RAG COMPLETE")
        logger.info(f"   Mode: {'FILTERED' if has_filters else 'NORMAL'}")
        logger.info(f"   Sources: {len(formatted_sources)}")
        logger.info(f"   Latency: {total_latency:.0f}ms")
        logger.info(f"="*80)
        
        return RAGResponse(
            query=request.query,
            answer=result.get("answer", "No answer generated"),
            sources=formatted_sources,
            conversation_id=result.get("conversation_id"),
            model_used=result.get("model_used", "unknown"),
            total_latency_ms=round(total_latency, 2),
            method=request.method
        )
    
    except Exception as e:
        logger.error(f"\n❌ RAG ERROR: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG failed: {str(e)}"
        )

# Helper function to build filter expression
def build_filter_expression(
    category: Optional[str] = None,
    language: Optional[str] = None,
    document_type: Optional[str] = None,
    document_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    ministry: Optional[str] = None
) -> Optional[str]:
    """Build Milvus filter expression from filter parameters"""
    filters = []
    
    logger.info(f"\n🔍 BUILDING FILTER EXPRESSION")
    
    if category:
        filters.append(f'Category == "{category}"')
        logger.info(f"   🏷️ Filter: Category = '{category}'")
    
    if language:
        filters.append(f'language == "{language}"')
        logger.info(f"   🌐 Filter: Language = '{language}'")
    
    if document_type:
        filters.append(f'document_type == "{document_type}"')
        logger.info(f"   📄 Filter: Document Type = '{document_type}'")
    
    # ✅ FIX: Use document_id as metadata filter (Milvus LIKE for substring match)
    if document_id:
        # Milvus LIKE: searches for exact substring match (no % needed)
        filters.append(f'document_id like "{document_id}"')
        logger.info(f"   📝 Filter: Document ID contains '{document_id}'")
    
    if ministry:
        filters.append(f'ministry == "{ministry}"')
        logger.info(f"   🏛️ Filter: Ministry = '{ministry}'")
    
    if date_from and date_to:
        filters.append(f'published_date >= "{date_from}" && published_date <= "{date_to}"')
        logger.info(f"   📅 Filter: Date range {date_from} to {date_to}")
    elif date_from:
        filters.append(f'published_date >= "{date_from}"')
        logger.info(f"   📅 Filter: Date from {date_from}")
    elif date_to:
        filters.append(f'published_date <= "{date_to}"')
        logger.info(f"   📅 Filter: Date until {date_to}")
    
    filter_expr = ' && '.join(filters) if filters else None
    
    if filter_expr:
        logger.info(f"   ✅ Metadata filter: {filter_expr}")
    else:
        logger.info(f"   ℹ️ No metadata filters - using semantic search")
    
    return filter_expr

# Search endpoint (vector, BM25, or hybrid)
@app.post("/search", response_model=SearchResponse)
async def search(request: QueryRequest):
    """Search using vector, BM25, or hybrid method with filters"""
    try:
        logger.info(f"\n🔍 SEARCH ENDPOINT")
        logger.info(f"   Query: {request.query}")
        logger.info(f"   Method: {request.method}")
        logger.info(f"   Top-K: {request.top_k}")
        
        milvus_client = get_milvus_client()
        start_time = time.time()
        
        # Build filter expression using helper function
        filter_expr = build_filter_expression(
            category=request.category,
            language=request.language,
            document_type=request.document_type,
            document_id=request.document_id,
            date_from=request.date_from,
            date_to=request.date_to
        )
        
        # Use the method from request with filters
        results = milvus_client.search(
            query=request.query,
            top_k=request.top_k,
            method=request.method,  # ✅ hybrid/vector/sparse
            filter_expr=filter_expr  # ✅ Filters applied
        )
        
        search_latency = (time.time() - start_time) * 1000
        
        search_results = [
            SearchResult(
                text=result.get('text'),
                source=result.get('document_name'),
                page=result.get('page_idx'),
                score=result.get('score'),
                document_id=result.get('document_id'),
                chunk_id=result.get('chunk_id'),
                global_chunk_id=result.get('global_chunk_id'),
                chunk_index=result.get('chunk_index'),
                section_hierarchy=result.get('section_hierarchy'),
                heading_context=result.get('heading_context'),
                char_count=result.get('char_count'),
                word_count=result.get('word_count'),
                published_date=result.get('published_date'),
                language=result.get('language'),
                category=result.get('category'),
                document_type=result.get('document_type'),
                ministry=result.get('ministry'),
                source_reference=result.get('source_reference')
            ) for result in results
        ]
        
        logger.info(f"✅ Search complete | Method: {request.method} | Filters: {filter_expr or 'None'} | Results: {len(search_results)} | Latency: {search_latency:.0f}ms")
        
        return SearchResponse(
            query=request.query,
            results=search_results,
            count=len(search_results),
            latency_ms=round(search_latency, 2)
        )
    
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

# Advanced hybrid search endpoint with filtering
@app.post("/search/hybrid", response_model=SearchResponse)
async def hybrid_search(request: HybridSearchRequest):
    """Advanced hybrid search with filtering options"""
    try:
        logger.info(f"\n🔍 HYBRID SEARCH ENDPOINT")
        logger.info(f"   Query: {request.query}")
        logger.info(f"   Top-K: {request.top_k}")
        
        milvus_client = get_milvus_client()
        
        # Build filter expression using helper function
        filter_expr = build_filter_expression(
            category=request.category,
            language=request.language,
            document_type=request.document_type,
            document_id=request.document_id,
            date_from=request.date_from,
            date_to=request.date_to,
            ministry=request.ministry
        )
        
        # Measure search latency
        start_time = time.time()
        
        # Perform hybrid search with filters
        results = milvus_client.search(
            query=request.query,
            top_k=request.top_k,
            filter_expr=filter_expr,
            method="hybrid"  # ✅ Always hybrid
        )
        
        search_latency = (time.time() - start_time) * 1000
        
        # Format response
        search_results = [
            SearchResult(
                text=result.get('text'),
                source_file=result.get('document_name') or result.get('source_file'),
                page_idx=result.get('page_idx'),
                score=result.get('score'),
                global_chunk_id=result.get('global_chunk_id'),
                document_id=result.get('document_id'),
                document_name=result.get('document_name'),
                chunk_id=result.get('chunk_id'),
                chunk_index=result.get('chunk_index'),
                section_hierarchy=result.get('section_hierarchy'),
                heading_context=result.get('heading_context'),
                char_count=result.get('char_count'),
                word_count=result.get('word_count'),
                published_date=result.get('published_date'),
                language=result.get('language'),
                category=result.get('category'),
                document_type=result.get('document_type'),
                ministry=result.get('ministry'),
                source_reference=result.get('source_reference')
            ) for result in results
        ]
        
        logger.info(f"✅ Hybrid search complete | Filters: {filter_expr or 'None'} | Results: {len(search_results)} | Latency: {search_latency:.0f}ms")
        
        return SearchResponse(
            query=request.query,
            results=search_results,
            count=len(search_results),
            latency_ms=round(search_latency, 2)
        )
    
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.error(f"Hybrid search error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hybrid search failed: {str(e)}"
        )

@app.post("/conversations")
async def create_conversation(request: CreateConversationRequest, user: dict = Depends(verify_auth_token)):
    """Create new conversation for authenticated user using LangChain"""
    try:
        logger.info("\n" + "="*80)
        logger.info("🆕 CREATE CONVERSATION REQUEST")
        logger.info("="*80)
        logger.info(f"   User ID: {user['user_id']}")
        logger.info(f"   Title: {request.title}")
        logger.info(f"   Metadata: {request.metadata}")
        
        # Use LangChain service for conversation creation
        langchain_rag = get_full_langchain_rag()
        logger.info(f"🔵 Calling LangChain service to create conversation...")
        conversation_id = langchain_rag.create_new_conversation(
            title=request.title,
            user_id=user['user_id'],
            metadata=request.metadata
        )
        
        if not conversation_id:
            logger.warning(f"LangChain service returned None, falling back to conversation service")
            # Fallback to conversation service
            conv_service = get_conversation_service()
            conversation = conv_service.create_conversation(
                user_id=user['user_id'],
                title=request.title,
                metadata=request.metadata
            )
            conversation_id = conversation["conversation_id"]
        
        logger.info(f"✅ Conversation created: {conversation_id}")
        
        # Verify it's in MongoDB
        from services.mongodb_service import get_mongo_db
        db = get_mongo_db()
        verify = db.conversations.find_one({"conversation_id": conversation_id})
        if verify:
            logger.info(f"✅ VERIFIED: Conversation exists in MongoDB")
            logger.info(f"   Title: {verify.get('title')}")
            logger.info(f"   Messages: {len(verify.get('messages', []))}")
        else:
            logger.warning(f"Conversation NOT found in MongoDB after creation!")
        logger.info("="*80 + "\n")
        
        # Get the actual conversation data from MongoDB to return accurate timestamps
        from services.mongodb_service import get_mongo_db
        db = get_mongo_db()
        created_conv = db.conversations.find_one({"conversation_id": conversation_id})
        
        if created_conv:
            # Use actual timestamps from MongoDB
            created_at = created_conv.get("created_at")
            updated_at = created_conv.get("updated_at", created_at)
            
            # Convert datetime objects to ISO strings
            if hasattr(created_at, 'isoformat'):
                created_at = created_at.isoformat()
            elif not isinstance(created_at, str):
                created_at = str(created_at)
            
            if hasattr(updated_at, 'isoformat'):
                updated_at = updated_at.isoformat()
            elif not isinstance(updated_at, str):
                updated_at = str(updated_at)
        else:
            # Fallback to current time if not found
            from datetime import datetime
            created_at = datetime.utcnow().isoformat()
            updated_at = created_at
        
        return ConversationMetadata(
            conversation_id=conversation_id,
            user_id=user['user_id'],
            title=request.title,
            created_at=created_at,
            updated_at=updated_at,
            message_count=0
        )
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create conversation: {str(e)}"
        )

@app.get("/conversations")
async def list_conversations(user: dict = Depends(verify_auth_token)):
    """List conversations for authenticated user using LangChain"""
    try:
        logger.info(f"🔵 Listing conversations for user: {user['user_id']}")
        
        # Use LangChain service first
        langchain_rag = get_full_langchain_rag()
        conversations = langchain_rag.get_conversations(user['user_id'])
        
        if not conversations:
            # Fallback to conversation service
            conv_service = get_conversation_service()
            conversations = conv_service.get_user_conversations(user['user_id'])
        
        # Format response
        formatted_conversations = []
        for conv in conversations:
            try:
                # Handle datetime objects
                created_at = conv.get("created_at", "2023-01-01T00:00:00")
                if hasattr(created_at, 'isoformat'):
                    created_at = created_at.isoformat()
                elif not isinstance(created_at, str):
                    created_at = str(created_at)
                
                updated_at = conv.get("updated_at", created_at)
                if hasattr(updated_at, 'isoformat'):
                    updated_at = updated_at.isoformat()
                elif not isinstance(updated_at, str):
                    updated_at = str(updated_at)
                
                formatted_conversations.append(
                    ConversationMetadata(
                        conversation_id=conv.get("conversation_id", ""),
                        user_id=conv.get("user_id", user['user_id']),
                        title=conv.get("title", "Untitled"),
                        created_at=created_at,
                        updated_at=updated_at,
                        message_count=len(conv.get("messages", []))
                    )
                )
            except Exception as e:
                logger.warning(f"Error formatting conversation: {str(e)}")
                continue
        
        logger.info(f"✅ Found {len(formatted_conversations)} conversations")
        
        return ListConversationsResponse(
            conversations=formatted_conversations,
            count=len(formatted_conversations)
        )
    except Exception as e:
        logger.error(f"Error listing conversations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list conversations: {str(e)}"
        )

@app.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, user: dict = Depends(verify_auth_token)):
    """Get conversation messages for authenticated user only"""
    try:
        from services.mongodb_service import mongodb_service
        
        logger.info(f"📖 Retrieved conversation {conversation_id}")
        
        # ✅ Ensure user owns this conversation  
        conversation = mongodb_service.get_conversation(conversation_id, user['user_id'])
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or access denied"
            )
        
        # Get messages from separate messages collection
        messages = mongodb_service.get_last_messages(conversation_id, limit=100)
        
        return {
            "conversation_id": conversation_id,
            "user_id": user['user_id'],
            "messages": messages,
            "message_count": len(messages)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get messages: {str(e)}"
        )

# Voice transcription endpoint
@app.post("/voice/transcribe", response_model=TranscriptResponse)
async def transcribe_voice(
    audio: UploadFile = File(...),
    language: str = "en"
):
    """
    Transcribe audio to text using ElevenLabs STT.
    Use the returned transcript with /search or /ask endpoints.
    
    Supported formats: mp3, wav, webm, m4a, ogg, flac
    Supported languages: en, hi, ta, te, bn, mr, gu, kn, ml, pa, etc.
    """
    allowed_extensions = {'mp3', 'wav', 'webm', 'm4a', 'ogg', 'flac'}
    filename = audio.filename or "audio.webm"
    extension = filename.split('.')[-1].lower()
    
    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported audio format. Allowed: {', '.join(allowed_extensions)}"
        )
    
    try:
        audio_data = await audio.read()
        
        if len(audio_data) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty audio file"
            )
        
        speech_service = get_speech_service()
        result = await speech_service.transcribe_audio(audio_data, filename, language)
        
        logger.info(f"🎤 Transcribed ({language}): '{result['text'][:100]}...'")
        
        return TranscriptResponse(transcript=result["text"])
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}"
        )

# Root endpoint
@app.get("/")
async def root():
    """API root with system status"""
    try:
        llm_client = HybridLLMClient()
        status = await llm_client.get_status()
        
        return RootResponse(
            status="online",
            mode="HYBRID",
            message="VICTOR API - Hybrid Mode (Online + Offline Fallback)",
            version=settings.APP_VERSION,
            current_mode=status["current_mode"],
            services=status["services"],
            features={
                "chat": True,
                "rag": True,
                "document_upload": True,
                "vector_search": True,
                "auto_fallback": True,
                "speech": status["services"]["online"]["available"],
                "google_drive": status["services"]["online"]["available"]
            }
        )
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        return RootResponse(
            status="online",
            mode="HYBRID",
            message="VICTOR API - Hybrid Mode",
            version=settings.APP_VERSION,
            current_mode="unknown",
            services={},
            features={
                "chat": True,
                "rag": True,
                "document_upload": True,
                "vector_search": True,
                "auto_fallback": True,
                "speech": False,
                "google_drive": False
            }
        )

 # PDF serving endpoint
@app.get("/pdf/{filename}")
async def serve_pdf(filename: str):
    """Serve PDF files from the data directory"""
    try:
        # Get the project root directory (parent of api folder)
        api_dir = Path(__file__).parent
        project_root = api_dir.parent
        pdf_path = project_root / "data" / filename
        
        # Security check: ensure the file is in the data directory
        if not pdf_path.is_file() or not pdf_path.resolve().is_relative_to(project_root / "data"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF file not found"
            )
        
        return FileResponse(
            path=str(pdf_path),
            media_type="application/pdf",
            filename=filename
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to serve PDF: {str(e)}"
        )

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

@app.get("/filters/available")
async def get_available_filters():
    """Get all available filter values from the collection"""
    try:
        milvus_client = get_milvus_client()
        filters = milvus_client.get_available_filters()
        
        print(f"\n📊 Available Filters:")
        for key, values in filters.items():
            if isinstance(values, dict):
                print(f"   {key}: {values}")
            else:
                print(f"   {key}: {len(values)} options")
        
        return filters
        
    except Exception as e:
        print(f"❌ Error getting filters: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get filters: {str(e)}"
        )
   
# ===================== COMPARE ENDPOINT =====================
@app.post("/compare", response_model=CompareResponse)
async def compare_topics(request: CompareRequest, user: dict = Depends(verify_auth_token)):
    """Compare two topics/documents using parallel RAG searches"""
    import time
    print(f"\n" + "="*80)
    print(f"🔀 COMPARE REQUEST")
    print(f"="*80)
    print(f"   Topic 1: {request.topic1}")
    print(f"   Topic 2: {request.topic2}")
    print(f"   User: {user.get('email', 'unknown')}")
    start_time = time.time()
    langchain_rag = get_full_langchain_rag()

    async def query_topic(topic: str, topic_num: int):
        print(f"\n🔍 Querying Topic {topic_num}: {topic}")
        result = await langchain_rag.ask(
            query=topic,
            user_id=user["user_id"],
            conversation_id=None,
            temperature=request.temperature,
            top_k=request.top_k,
            user=user,
            dense_weight=request.dense_weight,
            sparse_weight=request.sparse_weight,
            method=request.method
        )
        return result

    results = await asyncio.gather(
        query_topic(request.topic1, 1),
        query_topic(request.topic2, 2)
    )
    result1, result2 = results

    comparison_prompt = f"""You are analyzing and comparing two topics from educational policy documents.

**Topic 1**: {request.topic1}
**Answer 1**: {result1.get('answer', 'No information found')}

**Topic 2**: {request.topic2}
**Answer 2**: {result2.get('answer', 'No information found')}

Provide a structured comparison analysis in the following format:

## COMPARISON TABLE

| Aspect | {request.topic1} | {request.topic2} |
|--------|------------------|------------------|
| Key Points | [List main points] | [List main points] |
| Approach | [Describe approach] | [Describe approach] |
| Coverage | [Scope/Coverage] | [Scope/Coverage] |
| Implementation | [How implemented] | [How implemented] |

## KEY SIMILARITIES
- [Common theme 1]
- [Common theme 2]
- [Common principle 3]

## KEY DIFFERENCES
- **{request.topic1}**: [Distinction 1]
  **{request.topic2}**: [Distinction 1]
- **{request.topic1}**: [Distinction 2]
  **{request.topic2}**: [Distinction 2]

## PRACTICAL IMPLICATIONS
[2-3 sentences on what these similarities and differences mean in practice]

## SUMMARY
[2-3 sentence concise summary of the overall comparison]

IMPORTANT:
- Use proper markdown formatting (headers, lists, tables, bold)
- Cite sources when making specific claims: [Topic 1] or [Topic 2]
- Keep analysis clear, concise, and based ONLY on provided information
- Format the table properly with aligned columns"""
    comparison_analysis = await langchain_rag.llm.generate(comparison_prompt, temperature=0.1)
    
    # Clean up formatting issues
    comparison_analysis = comparison_analysis.strip()

    def format_sources(sources):
        formatted = []
        for source in sources:
            try:
                formatted.append(source)
            except Exception as e:
                print(f"⚠ Error formatting source: {e}")
                continue
        return formatted

    topic1_sources = format_sources(result1.get("sources", []))
    topic2_sources = format_sources(result2.get("sources", []))
    total_latency = (time.time() - start_time) * 1000
    print(f"\n✅ COMPARISON COMPLETE")
    print(f"   Topic 1 sources: {len(topic1_sources)}")
    print(f"   Topic 2 sources: {len(topic2_sources)}")
    print(f"   Latency: {total_latency:.0f}ms")
    print(f"="*80)
    return CompareResponse(
        topic1=request.topic1,
        topic2=request.topic2,
        topic1_answer=result1.get("answer", "No information found"),
        topic2_answer=result2.get("answer", "No information found"),
        comparison_analysis=comparison_analysis,
        topic1_sources=topic1_sources,
        topic2_sources=topic2_sources,
        conversation_id=request.conversation_id or "comparison",
        model_used=langchain_rag.model_name,
        total_latency_ms=round(total_latency, 2)
    )

# ========== MILVUS MANAGEMENT ENDPOINTS (ADMIN ONLY) ==========

class CollectionInfo(BaseModel):
    name: str
    num_entities: int
    description: str

class SchemaField(BaseModel):
    name: str
    type: str
    is_primary: bool
    auto_id: bool
    params: Dict[str, Any]

class CollectionSchema(BaseModel):
    collection_name: str
    description: str
    fields: List[SchemaField]
    indexes: List[Dict[str, Any]]

class DeleteCollectionRequest(BaseModel):
    collection_name: str
    confirm: bool

# Helper to check admin role
async def verify_admin(authorization: str = Header(...)):
    """Verify user is admin"""
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user from MongoDB
        user = db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if admin
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        return user
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/admin/milvus/collections", response_model=List[CollectionInfo])
async def list_milvus_collections(user: dict = Depends(verify_admin)):
    """List all Milvus collections (Admin only)"""
    try:
        connections.connect("admin", host=MILVUS_HOST, port=MILVUS_PORT, timeout=10)
        collections = utility.list_collections()
        
        result = []
        for name in collections:
            try:
                collection = Collection(name)
                result.append({
                    "name": name,
                    "num_entities": collection.num_entities,
                    "description": collection.description or "No description"
                })
            except Exception as e:
                print(f"Error loading collection {name}: {e}")
        
        connections.disconnect("admin")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list collections: {str(e)}")

@app.get("/admin/milvus/collections/{collection_name}/schema", response_model=CollectionSchema)
async def get_collection_schema(collection_name: str, user: dict = Depends(verify_admin)):
    """Get collection schema (Admin only)"""
    try:
        connections.connect("admin", host=MILVUS_HOST, port=MILVUS_PORT, timeout=10)
        
        if not utility.has_collection(collection_name):
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        
        collection = Collection(collection_name)
        schema = collection.schema
        
        # Map DataType enums to readable names
        dtype_map = {
            DataType.BOOL: "BOOL",
            DataType.INT8: "INT8",
            DataType.INT16: "INT16",
            DataType.INT32: "INT32",
            DataType.INT64: "INT64",
            DataType.FLOAT: "FLOAT",
            DataType.DOUBLE: "DOUBLE",
            DataType.STRING: "STRING",
            DataType.VARCHAR: "VARCHAR",
            DataType.BINARY_VECTOR: "BINARY_VECTOR",
            DataType.FLOAT_VECTOR: "FLOAT_VECTOR",
        }
        
        fields = []
        for field in schema.fields:
            fields.append({
                "name": field.name,
                "type": dtype_map.get(field.dtype, str(field.dtype)),
                "is_primary": field.is_primary,
                "auto_id": field.auto_id,
                "params": field.params or {}
            })
        
        # Get indexes
        indexes = []
        try:
            for idx in collection.indexes:
                indexes.append({
                    "field_name": idx.field_name,
                    "index_type": idx.params.get('index_type', 'N/A'),
                    "metric_type": idx.params.get('metric_type', 'N/A'),
                    "params": idx.params.get('params', {})
                })
        except Exception as e:
            print(f"Error reading indexes: {e}")
        
        connections.disconnect("admin")
        
        return {
            "collection_name": collection_name,
            "description": schema.description or "No description",
            "fields": fields,
            "indexes": indexes
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get schema: {str(e)}")

@app.get("/admin/milvus/collections/{collection_name}/stats")
async def get_collection_stats(collection_name: str, user: dict = Depends(verify_admin)):
    """Get collection statistics (Admin only)"""
    try:
        connections.connect("admin", host=MILVUS_HOST, port=MILVUS_PORT, timeout=10)
        
        if not utility.has_collection(collection_name):
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        
        collection = Collection(collection_name)
        
        # Try to load collection
        is_loaded = False
        try:
            collection.load()
            is_loaded = True
        except:
            pass
        
        stats = {
            "collection_name": collection_name,
            "num_entities": collection.num_entities,
            "is_loaded": is_loaded,
            "description": collection.description or "No description"
        }
        
        connections.disconnect("admin")
        return stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@app.get("/admin/milvus/collections/{collection_name}/sample")
async def get_collection_sample(collection_name: str, limit: int = 5, user: dict = Depends(verify_admin)):
    """Get sample data from collection (Admin only)"""
    try:
        connections.connect("admin", host=MILVUS_HOST, port=MILVUS_PORT, timeout=10)
        
        if not utility.has_collection(collection_name):
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        
        collection = Collection(collection_name)
        collection.load()
        
        # Get schema to determine fields
        schema = collection.schema
        output_fields = [
            field.name for field in schema.fields 
            if field.name != "id" and field.dtype != DataType.FLOAT_VECTOR
        ]
        
        # Query data
        results = collection.query(
            expr="",
            limit=min(limit, 10),  # Max 10 samples
            output_fields=output_fields
        )
        
        # Truncate long strings
        for result in results:
            for key, value in result.items():
                if isinstance(value, str) and len(value) > 200:
                    result[key] = value[:200] + "..."
        
        connections.disconnect("admin")
        return {"samples": results, "count": len(results)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sample data: {str(e)}")

@app.delete("/admin/milvus/collections/{collection_name}")
async def delete_collection(collection_name: str, request: DeleteCollectionRequest, user: dict = Depends(verify_admin)):
    """Delete a collection (Admin only)"""
    if not request.confirm:
        raise HTTPException(status_code=400, detail="Confirmation required")
    
    try:
        connections.connect("admin", host=MILVUS_HOST, port=MILVUS_PORT, timeout=10)
        
        if not utility.has_collection(collection_name):
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        
        utility.drop_collection(collection_name)
        connections.disconnect("admin")
        
        return {"message": f"Collection '{collection_name}' deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete collection: {str(e)}")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Comprehensive health check"""
    try:
        llm_client = HybridLLMClient()
        llm_status = await llm_client.get_status()
        
        services = {
            "llm": {
                "online": llm_status["services"]["online"],
                "offline": llm_status["services"]["offline"]
            }
        }
        
        # Milvus
        try:
            from services.milvus_service import MilvusService
            milvus = MilvusService()
            services["milvus"] = {
                "status": "connected" if milvus.check_connection() else "disconnected"
            }
        except Exception as e:
            services["milvus"] = {"status": "error", "error": str(e)}
        
        # MongoDB
        try:
            from pymongo import MongoClient
            client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=3000)
            client.admin.command('ping')
            services["mongodb"] = {"status": "connected"}
            client.close()
        except Exception as e:
            services["mongodb"] = {"status": "error", "error": str(e)}
        
        return HealthResponse(
            status="healthy",
            mode="HYBRID",
            active_llm=llm_status["current_mode"],
            services=services
        )
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return HealthResponse(
            status="error",
            mode="HYBRID",
            active_llm="unknown",
            services={"error": str(e)}
        )

@app.post("/api/switch-mode")
async def switch_mode(force_mode: str):
    """Manually switch between online/offline mode"""
    if force_mode not in ["online", "offline"]:
        raise HTTPException(400, "Mode must be 'online' or 'offline'")
    
    llm_client = HybridLLMClient()
    llm_client.reset_mode()
    
    return {
        "message": f"Mode switched to {force_mode}",
        "note": "This will be auto-detected again on next request"
    }

# Import routers with error handling
from api.routers import auth, documents, upload, collections, processing

# Try to import optional routers
try:
    from api.routers import chat
    has_chat_router = True
except ImportError:
    logger.warning("⚠️  Chat router not available")
    has_chat_router = False

try:
    from api.routers import search
    has_search_router = True
except ImportError:
    logger.warning("⚠️  Search router not available")
    has_search_router = False

try:
    from api.routers import chat_history
    has_chat_history_router = True
except ImportError:
    logger.warning("⚠️  Chat history router not available")
    has_chat_history_router = False

try:
    from api.routers import sync
    has_sync_router = True
except ImportError:
    logger.warning("⚠️  Sync router not available")
    has_sync_router = False

try:
    from api.routers import scraper
    has_scraper_router = True
except ImportError:
    logger.warning("⚠️  Scraper router not available")
    has_scraper_router = False

try:
    from api.routers import parse_marker
    has_parse_router = True
except ImportError:
    logger.warning("⚠️  Parse marker router not available")
    has_parse_router = False

# Include routers - only if they exist
logger.info("📦 Loading API routers...")

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

if has_chat_router:
    app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
    logger.info("  ✅ Chat router loaded")

if has_search_router:
    app.include_router(search.router, prefix="/api/search", tags=["Search"])
    logger.info("  ✅ Search router loaded")

app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
logger.info("  ✅ Documents router loaded")

app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
logger.info("  ✅ Upload router loaded")

app.include_router(collections.router, prefix="/api/collections", tags=["Collections"])
logger.info("  ✅ Collections router loaded")

app.include_router(processing.router, prefix="/api/processing", tags=["Processing"])
logger.info("  ✅ Processing router loaded")

if has_chat_history_router:
    app.include_router(chat_history.router, prefix="/api/history", tags=["Chat History"])
    logger.info("  ✅ Chat history router loaded")

if has_sync_router:
    app.include_router(sync.router, prefix="/api/sync", tags=["Sync"])
    logger.info("  ✅ Sync router loaded")

if has_scraper_router:
    app.include_router(scraper.router, prefix="/api/scraper", tags=["Scraper"])
    logger.info("  ✅ Scraper router loaded")

if has_parse_router:
    app.include_router(parse_marker.router, prefix="/api/parse", tags=["Parser"])
    logger.info("  ✅ Parse marker router loaded")

logger.info("✅ All available routers loaded")

# Error handlers (keep existing)
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "mode": "hybrid"}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "mode": "hybrid",
            "error": str(exc) if settings.DEBUG else "An error occurred"
        }
    )