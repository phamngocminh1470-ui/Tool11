from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.models import User, Document, Chapter, Flashcard, Quiz, Exam, AIUsageLog
from app.schemas.schemas import (
    DocumentAnalysisResponse, ChapterSummaryResponse, KnowledgeMapResponse,
    FlashcardResponse, FlashcardReview, QuizResponse,
    ExamStartRequest, ExamStartResponse, ExamSubmitRequest, ExamResultResponse,
    IncorrectAnswerDetail, ChatQueryRequest, ChatQueryResponse
)
from app.services.ai_service import generate_knowledge_map, ask_ai_tutor, generate_flashcards_ai, generate_quizzes_ai

router = APIRouter(prefix="/ai-services", tags=["ai-services"])


# =====================================================================
# 1. AI SUMMARY & CHAPTERS
# =====================================================================

@router.get("/summary/{doc_id}", response_model=DocumentAnalysisResponse)
def get_document_summary(doc_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        
    chapters = db.query(Chapter).filter(Chapter.document_id == doc_id).order_by(Chapter.order.asc()).all()
    if not chapters:
        raise HTTPException(
            status_code=400,
            detail="Tài liệu đang trong quá trình phân tích AI. Vui lòng thử lại sau vài giây."
        )
        
    # Read cached main summary fields
    summary_data = doc.parsed_sections or {}
    
    return DocumentAnalysisResponse(
        short_summary=summary_data.get("short_summary", ""),
        detailed_summary=summary_data.get("detailed_summary", ""),
        bullet_points=summary_data.get("bullet_points", []),
        chapters=[ChapterSummaryResponse.model_validate(c) for c in chapters]
    )


# =====================================================================
# 2. KNOWLEDGE MAP
# =====================================================================

@router.get("/knowledge-map/{doc_id}", response_model=KnowledgeMapResponse)
def get_knowledge_map(doc_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        
    chapters = db.query(Chapter).filter(Chapter.document_id == doc_id).all()
    if not chapters:
        raise HTTPException(status_code=400, detail="Vui lòng chờ tài liệu được phân tích xong")
        
    chapters_list = []
    for c in chapters:
        chapters_list.append({
            "title": c.title,
            "content_summary": c.content_summary,
            "keywords": c.keywords
        })
        
    # Generate Mindmap & Timeline using LLM or Mock fallback
    map_data = generate_knowledge_map(chapters_list, doc.name)
    
    # Log AI Usage
    usage = AIUsageLog(user_id=current_user.id, document_id=doc_id, prompt_tokens=150, completion_tokens=300, cost=0.0009, service_name="generate_knowledge_map")
    db.add(usage)
    db.commit()
    
    return KnowledgeMapResponse(**map_data)


# =====================================================================
# 3. FLASHCARDS AI
# =====================================================================

@router.get("/flashcards/{doc_id}", response_model=List[FlashcardResponse])
def get_flashcards(doc_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check document ownership
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        
    cards = db.query(Flashcard).filter(Flashcard.document_id == doc_id).all()
    return cards


@router.post("/flashcards/review", response_model=FlashcardResponse)
def review_flashcard(review: FlashcardReview, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    card = db.query(Flashcard).filter(Flashcard.id == review.flashcard_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Không tìm thấy Flashcard")
        
    # Verify owner
    doc = db.query(Document).filter(Document.id == card.document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=403, detail="Không có quyền chỉnh sửa")
        
    # Leitner Spaced Repetition calculation
    # Box level 1 to 5 determines review interval
    box = review.box_level
    if box < 1: box = 1
    if box > 5: box = 5
    
    days_map = {1: 1, 2: 3, 3: 7, 4: 14, 5: 30}
    days = days_map.get(box, 1)
    
    card.box_level = box
    card.next_review_at = datetime.now(timezone.utc) + timedelta(days=days)
    
    db.commit()
    db.refresh(card)
    return card


# =====================================================================
# 4. QUIZZES AI
# =====================================================================

@router.get("/quizzes/{doc_id}", response_model=List[QuizResponse])
def get_quizzes(doc_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        
    quizzes = db.query(Quiz).filter(Quiz.document_id == doc_id).all()
    return quizzes


# =====================================================================
# 5. EXAM MODE
# =====================================================================

@router.post("/exam/start", response_model=ExamStartResponse)
def start_exam(request: ExamStartRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == request.document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        
    # Select quizzes from DB.
    # If not enough, generate new quizzes of specific type/difficulty
    quizzes = db.query(Quiz).filter(
        Quiz.document_id == request.document_id,
        Quiz.difficulty == request.difficulty
    ).limit(request.num_questions).all()
    
    if len(quizzes) < request.num_questions:
        # Fallback to taking any available quizzes for this document
        quizzes = db.query(Quiz).filter(Quiz.document_id == request.document_id).limit(request.num_questions).all()
        
    # If still none, trigger real-time AI quizzes generation
    if not quizzes:
        try:
            new_quizzes = generate_quizzes_ai(doc.content_text or "", doc.name, difficulty=request.difficulty)
            for q in new_quizzes:
                db_q = Quiz(
                    document_id=doc.id,
                    type=q.get("type", "multiple_choice"),
                    difficulty=q.get("difficulty", request.difficulty),
                    question=q.get("question", ""),
                    options=q.get("options", []),
                    correct_answer=q.get("correct_answer", ""),
                    explanation=q.get("explanation", "")
                )
                db.add(db_q)
            db.commit()
            quizzes = db.query(Quiz).filter(Quiz.document_id == request.document_id).limit(request.num_questions).all()
        except Exception:
            raise HTTPException(status_code=500, detail="Không có đủ dữ liệu câu hỏi ôn tập")

    # Create dummy/tracker Exam record
    db_exam = Exam(
        user_id=current_user.id,
        document_id=doc.id,
        quiz_ids=[q.id for q in quizzes],
        user_answers={},
        score=0.0,
        duration_seconds=0
    )
    db.add(db_exam)
    db.commit()
    db.refresh(db_exam)
    
    # 45 seconds per question
    allocated_time = len(quizzes) * 45 

    return ExamStartResponse(
        exam_id=db_exam.id,
        document_id=doc.id,
        duration_seconds=allocated_time,
        questions=[QuizResponse.model_validate(q) for q in quizzes]
    )


@router.post("/exam/submit", response_model=ExamResultResponse)
def submit_exam(request: ExamSubmitRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == request.exam_id, Exam.user_id == current_user.id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài thi")
        
    # Compare answers
    correct_count = 0
    total_count = len(exam.quiz_ids)
    incorrect_details = []
    
    # Parse incoming answers
    answer_map = {ans.quiz_id: ans.answer for ans in request.answers}
    
    quizzes = db.query(Quiz).filter(Quiz.id.in_(exam.quiz_ids)).all()
    
    for q in quizzes:
        user_ans = answer_map.get(q.id, "").strip()
        correct_ans = q.correct_answer.strip()
        
        # Check matching answers (case insensitive)
        if user_ans.lower() == correct_ans.lower():
            correct_count += 1
        else:
            incorrect_details.append(
                IncorrectAnswerDetail(
                    quiz_id=q.id,
                    question=q.question,
                    correct_answer=q.correct_answer,
                    user_answer=user_ans if user_ans else "[Không trả lời]",
                    explanation=q.explanation or "Đối chiếu từ khóa chính xác trong nội dung tài liệu học."
                )
            )
            
    # Calculate score percentage
    score = (correct_count / total_count) * 100.0 if total_count > 0 else 0.0
    
    # Save statistics back to database
    exam.user_answers = {str(k): v for k, v in answer_map.items()}
    exam.score = score
    exam.duration_seconds = request.duration_seconds
    exam.tab_switch_count = request.tab_switch_count
    exam.completed_at = datetime.now(timezone.utc)
    
    db.commit()
    
    return ExamResultResponse(
        exam_id=exam.id,
        score=score,
        duration_seconds=request.duration_seconds,
        tab_switch_count=request.tab_switch_count,
        correct_count=correct_count,
        total_count=total_count,
        incorrect_details=incorrect_details
    )


# =====================================================================
# 6. AI TUTOR (CHAT RAG)
# =====================================================================

@router.post("/tutor/chat", response_model=ChatQueryResponse)
def tutor_chat(request: ChatQueryRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == request.document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        
    chat_hist = [{"role": msg.role, "content": msg.content} for msg in request.history]
    
    # Call chat service
    ans_data = ask_ai_tutor(doc.content_text or "", request.message, chat_hist)
    
    # Record AI tokens usage
    usage = AIUsageLog(
        user_id=current_user.id,
        document_id=request.document_id,
        prompt_tokens=250,
        completion_tokens=400,
        cost=0.001,
        service_name="tutor_chat"
    )
    db.add(usage)
    db.commit()
    
    return ChatQueryResponse(**ans_data)
