from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.models import User, AffiliateReferral
from app.schemas.schemas import AffiliateStatsResponse

router = APIRouter(prefix="/affiliate", tags=["affiliate"])

@router.get("/stats", response_model=AffiliateStatsResponse)
def get_affiliate_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    code = current_user.referral_code
    
    # 1. Get referee count
    referees = db.query(User).filter(User.referred_by == code).all()
    total_referred = len(referees)
    
    # 2. Get total commissions earned
    total_earnings = db.query(func.sum(AffiliateReferral.commission_amount)).filter(
        AffiliateReferral.referrer_id == current_user.id
    ).scalar() or 0.0
    
    # 3. Compile referral list detail
    referral_list = []
    for ref in referees:
        # Check if they completed any payments
        referral_list.append({
            "email": ref.email,
            "full_name": ref.full_name,
            "tier": ref.tier,
            "joined_at": ref.created_at
        })
        
    return AffiliateStatsResponse(
        referral_code=code,
        total_referred=total_referred,
        total_earnings=total_earnings,
        current_balance=current_user.wallet_balance,
        referrals=referral_list
    )


@router.post("/withdraw")
def request_commission_withdrawal(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Simulates request to transfer affiliate balance to banking or momo info.
    """
    if current_user.wallet_balance < 50000.0:
        raise HTTPException(
            status_code=400, 
            detail="Số dư tối thiểu để rút tiền là 50,000 VND. Vui lòng giới thiệu thêm người dùng nâng cấp gói."
        )
        
    requested_amount = current_user.wallet_balance
    current_user.wallet_balance = 0.0
    db.commit()
    
    # Insert system log for payout tracking
    from app.models.models import SystemLog
    log = SystemLog(
        user_id=current_user.id,
        action="Withdrawal Request",
        details=f"Yêu cầu rút tiền hoa hồng: {requested_amount} VND."
    )
    db.add(log)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Yêu cầu rút tiền {requested_amount} VND của bạn đã được tiếp nhận và sẽ được xử lý trong vòng 24h."
    }
