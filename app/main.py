from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.health import router as health_router
from app.api.audio import router as audio_router 
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # runs once on startup
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    yield
    # runs once on shutdown
    print("Shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered meeting transcription and summarization API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://50.19.61.16:8000","http://50.19.61.16:80","http://50.19.61.16"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, tags=["Health"])
app.include_router(audio_router, prefix="/api/v1", tags=["Audio"]) 
