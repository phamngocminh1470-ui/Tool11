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

from urllib.parse import quote_plus, unquote

def sanitize_database_url(url: str) -> str:
    if not url:
        return url
    # Convert postgres:// to postgresql:// for SQLAlchemy compatibility
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    
    if not url.startswith("postgresql://"):
        return url

    prefix = "postgresql://"
    url_part = url[len(prefix):]

    # Split username:password from the rest (host:port/database)
    # The last '@' symbol separates credentials from the host
    if "@" in url_part:
        creds_part, host_part = url_part.rsplit("@", 1)
        if ":" in creds_part:
            username, password = creds_part.split(":", 1)
            # URL encode the password to escape '@', ':', etc.
            decoded_password = unquote(password)
            encoded_password = quote_plus(decoded_password)
            return f"{prefix}{username}:{encoded_password}@{host_part}"
    
    return url

settings = Settings()

# Force load and validate DATABASE_URL from system environment
env_db_url = os.getenv("DATABASE_URL")
is_render = os.getenv("RENDER") == "true"
is_production = settings.ENV == "production"

if env_db_url:
    # Sanitize and url-encode database URL password
    env_db_url = sanitize_database_url(env_db_url)
    
    # Check if the database URL points to localhost when it shouldn't
    if (is_render or is_production) and ("localhost" in env_db_url or "127.0.0.1" in env_db_url):
        raise ValueError(
            "❌ [DATABASE ERROR] DATABASE_URL points to localhost, but the application is running on Render/Production! "
            "Please configure a valid production database URL in your Environment settings on Render."
        )
    settings.DATABASE_URL = env_db_url
else:
    # If we are on Render or production environment, we MUST have DATABASE_URL defined
    if is_render or is_production:
        raise ValueError(
            "❌ [DATABASE ERROR] DATABASE_URL is not set in the environment variables, "
            "but the application is running on Render/Production! Database connection is required."
        )
    settings.DATABASE_URL = sanitize_database_url(settings.DATABASE_URL)
    print("⚠️ [DATABASE WARNING] DATABASE_URL environment variable is missing. Falling back to local default.")

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
