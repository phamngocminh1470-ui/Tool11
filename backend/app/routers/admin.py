from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.models import User, Document, PaymentTransaction, AIUsageLog, SystemLog
from app.schemas.schemas import AdminUserUpdate, AdminSystemLog, UserProfile, DocumentResponse

router = APIRouter(prefix="/admin", tags=["admin"])

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Quyền truy cập bị từ chối. Chỉ dành cho Quản trị viên."
        )
    return current_user


@router.get("/users", response_model=List[UserProfile])
def list_users(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.put("/users/{user_id}", response_model=UserProfile)
def update_user_status(
    user_id: int, 
    update_data: AdminUserUpdate, 
    admin: User = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
    if update_data.role is not None:
        user.role = update_data.role
    if update_data.tier is not None:
        user.tier = update_data.tier
    if update_data.is_verified is not None:
        user.is_verified = update_data.is_verified
        
    db.commit()
    db.refresh(user)
    
    # Log update
    log = SystemLog(user_id=admin.id, action="Admin Update User", details=f"Cập nhật tài khoản ID {user_id}. Role: {user.role}, Tier: {user.tier}")
    db.add(log)
    db.commit()
    
    return user


@router.get("/documents", response_model=List[DocumentResponse])
def list_all_documents(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.created_at.desc()).all()


@router.get("/stats")
def get_admin_dashboard_stats(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_docs = db.query(func.count(Document.id)).scalar() or 0
    
    # AI usage aggregate
    ai_stats = db.query(
        func.sum(AIUsageLog.prompt_tokens),
        func.sum(AIUsageLog.completion_tokens),
        func.sum(AIUsageLog.cost)
    ).first()
    
    total_prompt_tokens = ai_stats[0] or 0
    total_completion_tokens = ai_stats[1] or 0
    total_ai_cost = ai_stats[2] or 0.0

    # Revenue aggregate
    total_revenue = db.query(func.sum(PaymentTransaction.amount)).filter(
        PaymentTransaction.status == "success"
    ).scalar() or 0.0
    
    # User tier counts
    free_users = db.query(func.count(User.id)).filter(User.tier == "free").scalar() or 0
    pro_users = db.query(func.count(User.id)).filter(User.tier == "pro").scalar() or 0
    premium_users = db.query(func.count(User.id)).filter(User.tier == "premium").scalar() or 0

    return {
        "total_users": total_users,
        "total_documents": total_docs,
        "ai_usage": {
            "prompt_tokens": total_prompt_tokens,
            "completion_tokens": total_completion_tokens,
            "estimated_cost_usd": round(total_ai_cost, 4)
        },
        "revenue": {
            "total_revenue_vnd": total_revenue
        },
        "tiers": {
            "free": free_users,
            "pro": pro_users,
            "premium": premium_users
        }
    }


@router.get("/system-logs", response_model=List[AdminSystemLog])
def list_system_logs(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    # Query system logs with user email join
    results = db.query(SystemLog, User.email).outerjoin(User, SystemLog.user_id == User.id).order_by(SystemLog.created_at.desc()).limit(100).all()
    
    logs = []
    for log, email in results:
        logs.append(
            AdminSystemLog(
                id=log.id,
                user_email=email,
                action=log.action,
                details=log.details,
                ip_address=log.ip_address,
                created_at=log.created_at
            )
        )
    return logs
