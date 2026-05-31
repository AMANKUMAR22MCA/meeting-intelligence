from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": "Meeting Intelligence API",
        "timestamp":datetime.now(timezone.utc).isoformat()
    }

@router.get("/")
async def root():
    return {
        "message": "Meeting Intelligence API is running",
        "docs": "/docs",
        "health": "/health"
    }