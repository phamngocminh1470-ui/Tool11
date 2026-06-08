from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from starlette.background import BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import os
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.models import User, Document, Chapter, Flashcard, Quiz, SystemLog
from app.schemas.schemas import DocumentResponse, DocumentAnalysisResponse
from app.services.supabase_service import upload_file_to_storage, delete_file_from_storage
from app.services.ai_service import (
    extract_text_from_bytes,
    analyze_document_content,
    generate_knowledge_map,
    generate_flashcards_ai,
    generate_quizzes_ai
)

router = APIRouter(prefix="/files", tags=["files"])

def run_background_ai_analysis(doc_id: int, file_bytes: bytes, filename: str, mime_type: str, db_session_factory):
    """
    Background worker that runs full AI processing on uploaded file.
    """
    db: Session = db_session_factory()
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            return
            
        # 1. Parse text from document bytes
        text_content = extract_text_from_bytes(file_bytes, filename, mime_type)
        doc.content_text = text_content
        db.commit()
        
        # 2. Run LLM Analysis to split chapters & summarize
        analysis_data = analyze_document_content(text_content, filename)
        
        # Cache summaries in document JSON field
        doc.parsed_sections = {
            "short_summary": analysis_data.get("short_summary", ""),
            "detailed_summary": analysis_data.get("detailed_summary", ""),
            "bullet_points": analysis_data.get("bullet_points", [])
        }
        db.commit()
        
        # 3. Create Chapters in database
        chapters_data = analysis_data.get("chapters", [])
        for idx, ch in enumerate(chapters_data):
            db_chapter = Chapter(
                document_id=doc.id,
                title=ch.get("title", f"Chương {idx+1}"),
                content_summary=ch.get("content_summary", ""),
                key_points=ch.get("key_points", []),
                formulas=ch.get("formulas", []),
                keywords=ch.get("keywords", []),
                order=ch.get("order", idx)
            )
            db.add(db_chapter)
        db.commit()
        
        # 3.5 Generate & Cache Knowledge Map
        try:
            chapters_list = [{
                "title": ch.get("title", f"Chương {idx+1}"),
                "content_summary": ch.get("content_summary", ""),
                "keywords": ch.get("keywords", [])
            } for idx, ch in enumerate(chapters_data)]
            
            map_data = generate_knowledge_map(chapters_list, doc.name)
            
            # Cập nhật parsed_sections với map_data
            doc.parsed_sections = {
                "short_summary": analysis_data.get("short_summary", ""),
                "detailed_summary": analysis_data.get("detailed_summary", ""),
                "bullet_points": analysis_data.get("bullet_points", []),
                "knowledge_map": map_data
            }
            db.commit()
        except Exception as map_err:
            import logging
            logging.getLogger("studyos.ai").error(f"Error generating background knowledge map: {str(map_err)}")
        
        # 4. Generate & save Flashcards
        flashcards_data = generate_flashcards_ai(text_content, filename)
        for card in flashcards_data:
            db_card = Flashcard(
                document_id=doc.id,
                question=card.get("question", ""),
                answer=card.get("answer", ""),
                definition=card.get("definition", ""),
                category=card.get("category", "General")
            )
            db.add(db_card)
        db.commit()
        
        # 5. Generate & save Quizzes
        quizzes_data = generate_quizzes_ai(text_content, filename, difficulty="medium")
        for quiz in quizzes_data:
            db_quiz = Quiz(
                document_id=doc.id,
                type=quiz.get("type", "multiple_choice"),
                difficulty=quiz.get("difficulty", "medium"),
                question=quiz.get("question", ""),
                options=quiz.get("options", []),
                correct_answer=quiz.get("correct_answer", ""),
                explanation=quiz.get("explanation", "")
            )
            db.add(db_quiz)
        db.commit()
        
        # Log system success
        log = SystemLog(user_id=doc.user_id, action="AI Analysis Success", details=f"Phân tích AI hoàn tất cho file {filename}.")
        db.add(log)
        db.commit()
        
    except Exception as e:
        db.rollback()
        # Log error in system audit
        user_id = doc.user_id if doc else None
        log = SystemLog(user_id=user_id, action="AI Analysis Error", details=f"Lỗi phân tích file {filename}: {str(e)}")
        db.add(log)
        db.commit()
    finally:
        db.close()


@router.post("/upload", response_model=DocumentResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Enforce file extensions
    allowed_extensions = {".pdf", ".docx", ".pptx", ".txt", ".jpg", ".jpeg", ".png"}
    _, ext = os.path.splitext(file.filename)
    if ext.lower() not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Định dạng file {ext} không được hỗ trợ. Chỉ nhận PDF, DOCX, PPTX, TXT, JPG, PNG."
        )

    # Validate file size (250MB limit) before reading to prevent memory issues
    file_size_on_disk = file.size if file.size is not None else 0
    if file_size_on_disk > 250 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Kích thước tệp vượt quá giới hạn cho phép (250MB)."
        )
        
    # Read file bytes
    file_bytes = await file.read()
    file_size = len(file_bytes)
    
    # Restrict Free Tier file uploads
    if current_user.tier == "free":
        # Check max size (e.g. 5MB)
        if file_size > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=403, 
                detail="Tài khoản Free chỉ được upload file dưới 5MB. Vui lòng nâng cấp lên gói Pro/Premium."
            )
        # Check total documents upload limit
        user_docs_count = db.query(Document).filter(Document.user_id == current_user.id).count()
        if user_docs_count >= 3:
            raise HTTPException(
                status_code=403,
                detail="Tài khoản Free chỉ được upload tối đa 3 tài liệu. Vui lòng nâng cấp lên gói Pro/Premium."
            )
            
    # Upload to storage (Supabase or local path fallback)
    file_url = upload_file_to_storage(file_bytes, file.filename, file.content_type)
    
    # Save to PostgreSQL
    db_doc = Document(
        user_id=current_user.id,
        name=file.filename,
        size=file_size,
        mime_type=file.content_type,
        file_url=file_url,
        content_text="" # populated in background
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    # Log upload action
    log = SystemLog(user_id=current_user.id, action="Upload File", details=f"Tải lên tài liệu: {file.filename} ({file_size} bytes).")
    db.add(log)
    db.commit()
    
    # Trigger AI parser in background
    from app.core.database import SessionLocal
    background_tasks.add_task(
        run_background_ai_analysis,
        db_doc.id,
        file_bytes,
        file.filename,
        file.content_type,
        SessionLocal
    )
    
    return db_doc


@router.get("/list", response_model=List[DocumentResponse])
def list_documents(
    q: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    if q:
        query = query.filter(Document.name.ilike(f"%{q}%"))
    return query.order_by(Document.created_at.desc()).all()


class RenameDocumentRequest(BaseModel):
    name: str


@router.put("/{doc_id}/rename", response_model=DocumentResponse)
def rename_document(
    doc_id: int,
    request_data: RenameDocumentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        
    if not request_data.name.strip():
        raise HTTPException(status_code=400, detail="Tên tài liệu không được để trống")
        
    doc.name = request_data.name.strip()
    db.commit()
    db.refresh(doc)
    
    log = SystemLog(user_id=current_user.id, action="Rename File", details=f"Đổi tên tài liệu ID: {doc_id} thành {doc.name}.")
    db.add(log)
    db.commit()
    
    return doc


@router.delete("/{doc_id}")
def delete_document(doc_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        
    # Xóa file vật lý trước
    try:
        delete_file_from_storage(doc.file_url)
    except Exception as e:
        # Ghi log lỗi xóa file vật lý nhưng vẫn tiến hành xóa record DB
        import logging
        logging.getLogger("studyos.files").error(f"Lỗi khi xóa file vật lý {doc.file_url}: {str(e)}")
        
    db.delete(doc)
    db.commit()
    
    log = SystemLog(user_id=current_user.id, action="Delete File", details=f"Xóa tài liệu ID: {doc_id} và các tài nguyên liên quan.")
    db.add(log)
    db.commit()
    
    return {"message": "Xóa tài liệu thành công"}


@router.get("/{doc_id}/status")
def get_analysis_status(doc_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Checks if background AI processing is completed.
    Returns status: 'processing' or 'completed'.
    """
    doc = db.query(Document).filter(Document.id == doc_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        
    # Check if chapters/flashcards exist yet
    chapters_count = db.query(Chapter).filter(Chapter.document_id == doc_id).count()
    if chapters_count > 0:
        return {"status": "completed"}
    return {"status": "processing"}
