import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.core.config import settings

logger = logging.getLogger("studyos.email")

def send_otp_email(to_email: str, otp_code: str, purpose: str = "register") -> bool:
    subject = f"Mã OTP xác thực StudyOS AI - {purpose.upper()}"
    body = f"""
    Xin chào,
    
    Bạn nhận được email này vì đã yêu cầu mã OTP trên hệ thống StudyOS AI.
    Mã OTP của bạn là: {otp_code}
    
    Mã này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.
    
    Trân trọng,
    Đội ngũ StudyOS AI.
    """
    
    # Check if SMTP configuration is available
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # MOCK OTP LOGGING (For local runs / sandbox)
        print(f"\n==========================================")
        print(f"[MOCK EMAIL SERVICE] Gửi OTP tới: {to_email}")
        print(f"Mục đích: {purpose}")
        print(f"MÃ OTP CỦA BẠN LÀ: {otp_code}")
        print(f"==========================================\n")
        return True
        
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_FROM
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        # Print fallback to console so application doesn't crash
        print(f"\n======================== ERROR SMTP ==================")
        print(f"[FALLBACK] OTP gửi tới {to_email}: {otp_code} (SMTP Error: {str(e)})")
        print(f"======================================================\n")
        return True
