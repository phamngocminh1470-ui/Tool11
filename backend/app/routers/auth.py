import random
import string
from typing import Dict
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.models.models import User, SystemLog
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserProfile, PasswordResetRequest, PasswordResetVerify, OTPVerifyRequest, UserProfileUpdate, UserChangePassword
from app.services.email_service import send_otp_email

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

def generate_random_code(length: int = 6) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    token = credentials.credentials
    email = decode_access_token(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ hoặc đã hết hạn",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return user


@router.post("/register", response_model=UserProfile)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký sử dụng")
    
    # Check referrer code
    if user_data.referred_by:
        referrer = db.query(User).filter(User.referral_code == user_data.referred_by).first()
        if not referrer:
            user_data.referred_by = None  # Reset if invalid
            
    # Generate user properties
    otp = str(random.randint(100000, 999999))
    referral_code = f"STUDY_{generate_random_code(5)}"
    
    # Create User
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        referral_code=referral_code,
        referred_by=user_data.referred_by,
        otp_code=otp,
        otp_expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        is_verified=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Send OTP
    send_otp_email(new_user.email, otp, purpose="register")
    
    # Write system log
    log = SystemLog(user_id=new_user.id, action="Register", details=f"Người dùng {new_user.email} đăng ký tài khoản.")
    db.add(log)
    db.commit()
    
    return new_user


@router.post("/verify-otp", response_model=UserProfile)
def verify_otp(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
        
    if user.is_verified:
        return user
        
    if user.otp_code != data.otp:
        raise HTTPException(status_code=400, detail="Mã OTP không chính xác")
        
    if user.otp_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn sử dụng")
        
    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()
    db.refresh(user)
    
    # Log audit
    log = SystemLog(user_id=user.id, action="Verify OTP", details=f"Xác thực OTP thành công cho tài khoản {user.email}.")
    db.add(log)
    db.commit()
    
    return user


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Email hoặc mật khẩu không chính xác")
        
    if not user.is_verified:
        # Re-send OTP if not verified yet
        otp = str(random.randint(100000, 999999))
        user.otp_code = otp
        user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
        db.commit()
        send_otp_email(user.email, otp, purpose="register")
        raise HTTPException(status_code=403, detail="Tài khoản chưa được kích hoạt. Một mã OTP mới đã được gửi tới email của bạn.")

    access_token = create_access_token(subject=user.email)
    
    # Log audit
    log = SystemLog(user_id=user.id, action="Login", details="Đăng nhập tài khoản bằng email/mật khẩu.")
    db.add(log)
    db.commit()
    
    return TokenResponse(access_token=access_token, user=user)


@router.post("/login-google", response_model=TokenResponse)
def login_google(data: Dict[str, str], db: Session = Depends(get_db)):
    """
    Mock Google Login callback.
    Registers user if they don't exist and issues JWT.
    """
    email = data.get("email")
    name = data.get("name", "Google User")
    avatar = data.get("avatar_url")
    
    if not email:
        raise HTTPException(status_code=400, detail="Thiếu thông tin email từ Google")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Register new verified user
        referral_code = f"STUDY_{generate_random_code(5)}"
        user = User(
            email=email,
            password_hash=get_password_hash(generate_random_code(16)), # random pw
            full_name=name,
            avatar_url=avatar,
            referral_code=referral_code,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    access_token = create_access_token(subject=user.email)
    
    log = SystemLog(user_id=user.id, action="OAuth Login (Google)", details="Đăng nhập bằng tài khoản Google.")
    db.add(log)
    db.commit()
    
    return TokenResponse(access_token=access_token, user=user)


@router.post("/login-github", response_model=TokenResponse)
def login_github(data: Dict[str, str], db: Session = Depends(get_db)):
    """
    Mock Github Login callback.
    """
    email = data.get("email")
    name = data.get("name", "Github User")
    avatar = data.get("avatar_url")
    
    if not email:
        raise HTTPException(status_code=400, detail="Thiếu thông tin email từ Github")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        referral_code = f"STUDY_{generate_random_code(5)}"
        user = User(
            email=email,
            password_hash=get_password_hash(generate_random_code(16)),
            full_name=name,
            avatar_url=avatar,
            referral_code=referral_code,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    access_token = create_access_token(subject=user.email)
    
    log = SystemLog(user_id=user.id, action="OAuth Login (Github)", details="Đăng nhập bằng tài khoản Github.")
    db.add(log)
    db.commit()
    
    return TokenResponse(access_token=access_token, user=user)


@router.post("/forgot-password")
def forgot_password(data: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email không tồn tại trong hệ thống")
        
    otp = str(random.randint(100000, 999999))
    user.otp_code = otp
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    db.commit()
    
    send_otp_email(user.email, otp, purpose="reset_password")
    
    log = SystemLog(user_id=user.id, action="Forgot Password", details="Yêu cầu mã OTP khôi phục mật khẩu.")
    db.add(log)
    db.commit()
    
    return {"message": "Mã xác thực OTP đã được gửi tới email của bạn."}


@router.post("/reset-password")
def reset_password(data: PasswordResetVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản")
        
    if user.otp_code != data.otp:
        raise HTTPException(status_code=400, detail="Mã OTP không chính xác")
        
    if user.otp_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Mã OTP đã hết hạn sử dụng")
        
    user.password_hash = get_password_hash(data.new_password)
    user.otp_code = None
    user.otp_expires_at = None
    db.commit()
    
    log = SystemLog(user_id=user.id, action="Reset Password", details="Thay đổi mật khẩu thành công bằng OTP.")
    db.add(log)
    db.commit()
    
    return {"message": "Mật khẩu của bạn đã được thay đổi thành công."}


@router.put("/profile", response_model=UserProfile)
def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.full_name is not None:
        current_user.full_name = data.full_name.strip()
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url.strip()
        
    db.commit()
    db.refresh(current_user)
    
    log = SystemLog(user_id=current_user.id, action="Update Profile", details="Cập nhật hồ sơ cá nhân.")
    db.add(log)
    db.commit()
    
    return current_user


@router.put("/change-password")
def change_password(
    data: UserChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không chính xác")
        
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    
    log = SystemLog(user_id=current_user.id, action="Change Password", details="Thay đổi mật khẩu tài khoản thành công.")
    db.add(log)
    db.commit()
    
    return {"message": "Đổi mật khẩu thành công!"}
