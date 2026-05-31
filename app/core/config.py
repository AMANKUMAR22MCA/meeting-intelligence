from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseModel):
    APP_NAME: str = "Meeting Intelligence API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Groq — handles both Whisper transcription AND LLM summarization
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # Gemini — backup LLM, we'll use this in Phase 2
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    DATABASE_URL: str = os.getenv("DATABASE_URL","") 
    REDIS_URL: str = os.getenv("REDIS_URL","")
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    SENDGRID_FROM_EMAIL: str = os.getenv("SENDGRID_FROM_EMAIL", "")


settings = Settings()