import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    APP_NAME: str = "StudyOS AI"
    ENV: str = "development"
    SECRET_KEY: str = "super-secret-jwt-key-studyos-ai-2026-development"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/studyos"

    # Redis Cache
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI Keys
    OPENAI_API_KEY: str = "mock-openai-key"
    GEMINI_API_KEY: str = "mock-gemini-key"

    # Supabase Storage
    SUPABASE_URL: str = "https://your-supabase-project.supabase.co"
    SUPABASE_KEY: str = "your-supabase-anon-key"
    SUPABASE_BUCKET: str = "studyos-docs"

    # SMTP Config
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@studyos.ai"

    # Local storage fallback directory
    LOCAL_STORAGE_DIR: str = "storage_uploads"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure local storage dir exists
os.makedirs(settings.LOCAL_STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.LOCAL_STORAGE_DIR, "documents"), exist_ok=True)
