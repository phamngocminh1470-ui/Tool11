import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base

# Import models to register them with metadata
from app.models import models

# Import routers
from app.routers import auth, dashboard, files, ai_services, payment, admin, affiliate

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for StudyOS AI study assistance SaaS platform.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,   # Bearer token auth — cookies not needed, wildcard origins OK
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local storage folder for uploads fallback
os.makedirs(settings.LOCAL_STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.LOCAL_STORAGE_DIR, "documents"), exist_ok=True)
app.mount("/api/static", StaticFiles(directory=settings.LOCAL_STORAGE_DIR), name="static")

# Register routes
app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(ai_services.router, prefix="/api")
app.include_router(payment.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(affiliate.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENV
    }
