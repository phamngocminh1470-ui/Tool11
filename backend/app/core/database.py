import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import QueuePool
from app.core.config import settings

# 1 & 2. Đọc database URL từ biến môi trường, fallback về settings.DATABASE_URL
db_url = os.environ.get("DATABASE_URL") or settings.DATABASE_URL

# 3. Tự động chuyển đổi postgres:// thành postgresql:// để tương thích với SQLAlchemy mới
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Kiểm tra schema và hỗ trợ SQLite làm fallback nếu cần thiết
if db_url and "sqlite" in db_url:
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        db_url,
        poolclass=QueuePool,
        pool_size=20,
        max_overflow=30,
        pool_timeout=60,
        pool_recycle=3600,
        pool_pre_ping=True   # Tự động verify các kết nối trước khi sử dụng để tránh lỗi stale connection
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
