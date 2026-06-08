from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    role = Column(String, default="user")  # admin, user
    tier = Column(String, default="free")  # free, pro, premium
    
    # Affiliate
    referral_code = Column(String, unique=True, index=True, nullable=False)
    referred_by = Column(String, nullable=True)  # Referrer code
    wallet_balance = Column(Float, default=0.0)  # Commission earned

    # Verification / OTP
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="user")
    transactions = relationship("PaymentTransaction", back_populates="user")
    system_logs = relationship("SystemLog", back_populates="user")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    size = Column(Integer, nullable=False)  # Size in bytes
    mime_type = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    content_text = Column(Text, nullable=True)  # Raw extracted text
    parsed_sections = Column(JSON, nullable=True)  # High-level section structure
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    user = relationship("User", back_populates="documents")
    chapters = relationship("Chapter", back_populates="document", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="document", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="document", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="document", cascade="all, delete-orphan")

class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    content_summary = Column(Text, nullable=False)
    key_points = Column(JSON, nullable=False)  # List[str]
    formulas = Column(JSON, nullable=False)  # List[str]
    keywords = Column(JSON, nullable=False)  # List[str]
    order = Column(Integer, default=0)

    # Relationships
    document = relationship("Document", back_populates="chapters")

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    definition = Column(Text, nullable=True)
    category = Column(String, default="general")
    box_level = Column(Integer, default=1)  # 1 to 5 Leitner level
    next_review_at = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    document = relationship("Document", back_populates="flashcards")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # multiple_choice, true_false, fill_blank, match, essay
    difficulty = Column(String, nullable=False)  # easy, medium, hard, expert
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=True)  # List[str] or key-value dict for match
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    document = relationship("Document", back_populates="quizzes")

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    quiz_ids = Column(JSON, nullable=False)  # List[int]
    user_answers = Column(JSON, nullable=False)  # dict {quiz_id: answer}
    score = Column(Float, nullable=False)  # Percentage score
    duration_seconds = Column(Integer, nullable=False)
    tab_switch_count = Column(Integer, default=0)
    completed_at = Column(DateTime, default=utc_now)

    # Relationships
    user = relationship("User", back_populates="exams")
    document = relationship("Document", back_populates="exams")

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    gateway = Column(String, nullable=False)  # stripe, momo, vnpay
    order_id = Column(String, unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, nullable=False)  # pending, success, failed
    tier_purchased = Column(String, nullable=False)  # pro, premium
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    user = relationship("User", back_populates="transactions")

class AffiliateReferral(Base):
    __tablename__ = "affiliate_referrals"

    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    referee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="joined")  # joined, active_paid
    commission_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)

class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    cost = Column(Float, default=0.0)
    service_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=utc_now)

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    user = relationship("User", back_populates="system_logs")
