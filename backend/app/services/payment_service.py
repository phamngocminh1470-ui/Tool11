import uuid
from sqlalchemy.orm import Session
from app.models.models import PaymentTransaction, User
from app.schemas.schemas import CheckoutResponse

def create_checkout_session(db: Session, user_id: int, tier: str, gateway: str) -> CheckoutResponse:
    """
    Creates a pending payment transaction and returns a mock payment redirect URL.
    Tiers pricing:
    - pro: 99,000 VND / month (~4.99 USD)
    - premium: 199,000 VND / month (~8.99 USD)
    """
    amount = 99000.0 if tier == "pro" else 199000.0
    if gateway == "stripe":
        amount = 4.99 if tier == "pro" else 8.99

    order_id = f"ORDER_{uuid.uuid4().hex[:12].upper()}"
    
    # Register pending transaction
    db_tx = PaymentTransaction(
        user_id=user_id,
        gateway=gateway,
        order_id=order_id,
        amount=amount,
        status="pending",
        tier_purchased=tier
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)

    # Redirect to standard frontend payment mockup simulator URL
    payment_url = f"/payment/checkout-simulation?gateway={gateway}&tier={tier}&order_id={order_id}&amount={amount}"
    
    return CheckoutResponse(
        payment_url=payment_url,
        order_id=order_id
    )

def handle_payment_success(db: Session, order_id: str) -> bool:
    """
    Handles payment transaction callbacks. Upgrades user tier and calculates affiliate commissions.
    """
    tx = db.query(PaymentTransaction).filter(PaymentTransaction.order_id == order_id).first()
    if not tx or tx.status == "success":
        return False
        
    # Update transaction status
    tx.status = "success"
    
    # Upgrade User Tier
    user = db.query(User).filter(User.id == tx.user_id).first()
    if user:
        user.tier = tx.tier_purchased
        
        # Affiliate referral payout logic:
        # If the user was referred by another user, award 20% commission to the referrer
        if user.referred_by:
            referrer = db.query(User).filter(User.referral_code == user.referred_by).first()
            if referrer:
                commission = tx.amount * 0.20
                referrer.wallet_balance += commission
                
                # Add to affiliate log
                from app.models.models import AffiliateReferral
                referral_log = AffiliateReferral(
                    referrer_id=referrer.id,
                    referee_id=user.id,
                    status="active_paid",
                    commission_amount=commission
                )
                db.add(referral_log)
                
    db.commit()
    return True
