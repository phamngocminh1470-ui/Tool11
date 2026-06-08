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

# Force load and validate DATABASE_URL from system environment
env_db_url = os.getenv("DATABASE_URL")
if env_db_url:
    # Convert postgres:// to postgresql:// for SQLAlchemy compatibility
    if env_db_url.startswith("postgres://"):
        env_db_url = env_db_url.replace("postgres://", "postgresql://", 1)
    settings.DATABASE_URL = env_db_url

# Print log configuration for Render debugging
from urllib.parse import urlparse
try:
    parsed = urlparse(settings.DATABASE_URL)
    masked_host = parsed.hostname or "localhost"
    masked_port = parsed.port or "5432"
    masked_db = parsed.path or "/studyos"
    print(f"🔌 [DATABASE INITIALIZATION] Successfully read DATABASE_URL. Host: {masked_host}:{masked_port}, DB: {masked_db} (Password hidden)")
except Exception as e:
    print(f"🔌 [DATABASE INITIALIZATION] Error parsing URL: {str(e)}")

# Ensure local storage dir exists
os.makedirs(settings.LOCAL_STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.LOCAL_STORAGE_DIR, "documents"), exist_ok=True)
