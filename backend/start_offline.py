"""
Start the backend in offline mode with all necessary services
"""
import asyncio
import sys
import subprocess
import time
from services.ollama_service import OllamaService
from core.config import get_settings

def check_ollama():
    """Check if Ollama is running"""
    try:
        ollama = OllamaService()
        return ollama.check_connection()
    except:
        return False

def check_milvus():
    """Check if Milvus is running"""
    try:
        from pymilvus import connections
        settings = get_settings()
        connections.connect(
            alias="check",
            host=settings.MILVUS_HOST,
            port=settings.MILVUS_PORT
        )
        connections.disconnect("check")
        return True
    except:
        return False

def check_mongodb():
    """Check if MongoDB is running"""
    try:
        from pymongo import MongoClient
        settings = get_settings()
        client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=3000)
        client.admin.command('ping')
        client.close()
        return True
    except:
        return False

def main():
    print("=" * 60)
    print("🚀 STARTING OFFLINE RAG SYSTEM")
    print("=" * 60)
    
    # Check services
    print("\n📋 Checking required services...")
    
    services_ok = True
    
    if check_ollama():
        print("✅ Ollama is running")
    else:
        print("❌ Ollama is not running")
        print("   Start it with: ollama serve")
        services_ok = False
    
    if check_milvus():
        print("✅ Milvus is running")
    else:
        print("⚠️  Milvus is not running (optional)")
        print("   Start it with: docker start milvus-standalone")
    
    if check_mongodb():
        print("✅ MongoDB is running")
    else:
        print("⚠️  MongoDB is not running (optional)")
        print("   Start it if needed")
    
    if not services_ok:
        print("\n❌ Critical services are missing!")
        return False
    
    print("\n" + "=" * 60)
    print("✅ All services ready!")
    print("=" * 60)
    print("\n🌐 Starting FastAPI server...")
    print("📍 API: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("\n💡 System is running OFFLINE - no internet needed!")
    print("\nPress Ctrl+C to stop\n")
    
    # Start the server
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_excludes=["data/*", "processed/*", "*.npy", "*.npz", "*.log", "*.bin", "*.onnx"]
    )

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down...")
        sys.exit(0)