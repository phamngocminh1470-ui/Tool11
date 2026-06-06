from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.models import User, PaymentTransaction, SystemLog
from app.schemas.schemas import CheckoutRequest, CheckoutResponse
from app.services.payment_service import create_checkout_session, handle_payment_success

router = APIRouter(prefix="/payment", tags=["payment"])

@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout(request: CheckoutRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if request.tier not in ["pro", "premium"]:
        raise HTTPException(status_code=400, detail="Gói cước nâng cấp không hợp lệ")
    if request.gateway not in ["stripe", "momo", "vnpay"]:
        raise HTTPException(status_code=400, detail="Cổng thanh toán không hỗ trợ")
        
    return create_checkout_session(db, current_user.id, request.tier, request.gateway)


@router.post("/callback/{order_id}")
def payment_callback(order_id: str, db: Session = Depends(get_db)):
    """
    Webhook/Callback endpoint that marks payment success and unlocks paid tier features.
    """
    success = handle_payment_success(db, order_id)
    if not success:
        # Check if already processed or order not found
        tx = db.query(PaymentTransaction).filter(PaymentTransaction.order_id == order_id).first()
        if tx and tx.status == "success":
            return {"status": "success", "message": "Giao dịch đã được xử lý thành công trước đó."}
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin đơn hàng này.")
        
    # Log successful billing
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.order_id == order_id).first()
    log = SystemLog(user_id=tx.user_id, action="Payment Success", details=f"Giao dịch {order_id} thành công qua {tx.gateway.upper()}. Nâng cấp gói lên: {tx.tier_purchased.upper()}")
    db.add(log)
    db.commit()
    
    return {"status": "success", "message": "Nâng cấp tài khoản thành công!"}
