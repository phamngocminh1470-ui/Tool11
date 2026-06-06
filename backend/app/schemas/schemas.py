from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

# --- AUTH SCHEMAS ---

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    referred_by: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    avatar_url: Optional[str] = None
    role: str
    tier: str
    referral_code: str
    wallet_balance: float
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetVerify(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

# --- DOCUMENT SCHEMAS ---

class DocumentResponse(BaseModel):
    id: int
    name: str
    size: int
    mime_type: str
    file_url: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- AI ANALYSIS & SUMMARY ---

class ChapterSummaryResponse(BaseModel):
    id: int
    title: str
    content_summary: str
    key_points: List[str]
    formulas: List[str]
    keywords: List[str]
    order: int

    class Config:
        from_attributes = True

class DocumentAnalysisResponse(BaseModel):
    short_summary: str
    detailed_summary: str
    bullet_points: List[str]
    chapters: List[ChapterSummaryResponse]

# --- KNOWLEDGE MAP ---

class MindmapNode(BaseModel):
    id: str
    label: str
    type: str  # topic, chapter, subtopic
    parent_id: Optional[str] = None

class TimelineItem(BaseModel):
    event: str
    time: str
    description: str

class RelationshipItem(BaseModel):
    source: str
    target: str
    relation: str

class KnowledgeMapResponse(BaseModel):
    nodes: List[MindmapNode]
    timeline: List[TimelineItem]
    relationships: List[RelationshipItem]
    mermaid_code: str

# --- FLASHCARD SCHEMAS ---

class FlashcardCreate(BaseModel):
    question: str
    answer: str
    definition: Optional[str] = None
    category: Optional[str] = "general"

class FlashcardResponse(BaseModel):
    id: int
    document_id: int
    question: str
    answer: str
    definition: Optional[str] = None
    category: str
    box_level: int
    next_review_at: datetime

    class Config:
        from_attributes = True

class FlashcardReview(BaseModel):
    flashcard_id: int
    box_level: int  # Updated level (1-5)

# --- QUIZ SCHEMAS ---

class QuizResponse(BaseModel):
    id: int
    document_id: int
    type: str  # multiple_choice, true_false, fill_blank, match, essay
    difficulty: str
    question: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None

    class Config:
        from_attributes = True

# --- EXAM SCHEMAS ---

class ExamStartRequest(BaseModel):
    document_id: int
    num_questions: int = 10
    difficulty: str = "medium"  # easy, medium, hard, expert
    type: Optional[str] = "mixed"  # mixed, multiple_choice, true_false, fill_blank

class ExamStartResponse(BaseModel):
    exam_id: int
    document_id: int
    duration_seconds: int
    questions: List[QuizResponse]

class ExamAnswer(BaseModel):
    quiz_id: int
    answer: str

class ExamSubmitRequest(BaseModel):
    exam_id: int
    answers: List[ExamAnswer]
    duration_seconds: int
    tab_switch_count: int

class IncorrectAnswerDetail(BaseModel):
    quiz_id: int
    question: str
    correct_answer: str
    user_answer: str
    explanation: str

class ExamResultResponse(BaseModel):
    exam_id: int
    score: float
    duration_seconds: int
    tab_switch_count: int
    correct_count: int
    total_count: int
    incorrect_details: List[IncorrectAnswerDetail]

# --- AI TUTOR (CHAT) ---

class ChatMessage(BaseModel):
    role: str  # user, assistant
    content: str

class ChatQueryRequest(BaseModel):
    document_id: int
    message: str
    history: List[ChatMessage] = []

class ChatCitation(BaseModel):
    source: str
    page: Optional[int] = None
    context: str

class ChatQueryResponse(BaseModel):
    answer: str
    citations: List[ChatCitation]

# --- DASHBOARD & ANALYTICS ---

class DashboardStatsResponse(BaseModel):
    total_documents: int
    total_subjects: int
    total_questions: int
    total_flashcards: int
    total_study_hours: float
    completion_rate: float
    average_score: float

class DashboardChartData(BaseModel):
    learning_progress: List[Dict[str, Any]]  # date, hours
    scores: List[Dict[str, Any]]             # exam_name, score
    frequency: List[Dict[str, Any]]          # subject, count

# --- PAYMENT & AFFILIATE ---

class CheckoutRequest(BaseModel):
    tier: str  # pro, premium
    gateway: str  # stripe, momo, vnpay

class CheckoutResponse(BaseModel):
    payment_url: str
    order_id: str

class AffiliateStatsResponse(BaseModel):
    referral_code: str
    total_referred: int
    total_earnings: float
    current_balance: float
    referrals: List[Dict[str, Any]]

# --- ADMIN PANEL ---

class AdminUserUpdate(BaseModel):
    role: Optional[str] = None
    tier: Optional[str] = None
    is_verified: Optional[bool] = None

class AdminSystemLog(BaseModel):
    id: int
    user_email: Optional[str]
    action: str
    details: str
    ip_address: Optional[str]
    created_at: datetime


# --- PROFILE UPGRADE SCHEMAS ---

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserChangePassword(BaseModel):
    current_password: str
    new_password: str

