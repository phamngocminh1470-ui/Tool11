import sys
import os
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

# Ensure app is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import User, Document, Chapter, Flashcard, Quiz, Exam, SystemLog, AIUsageLog

def seed_data():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        print("Running seed script for StudyOS AI...")
        
        # 1. Check or create default tester user
        test_email = "phamngocminh1470@gmail.com"
        
        # Check by new email, old email, or referral code
        user = db.query(User).filter((User.email == test_email) | (User.email == "test@studyos.ai") | (User.referral_code == "STUDY_TESTER")).first()
        if user:
            # Update the account to matching email, password, full name and premium details
            user.email = test_email
            user.password_hash = get_password_hash("Tuananhstudio@")
            user.full_name = "TUAN ANH STUDIO"
            user.avatar_url = f"https://api.dicebear.com/7.x/bottts/svg?seed={test_email}"
            user.tier = "premium"
            user.wallet_balance = 250000.0
            user.is_verified = True
            db.commit()
            db.refresh(user)
            print(f"-> Updated test account: {test_email} / Tuananhstudio@ (Premium Tier)")
        else:
            user = User(
                email=test_email,
                password_hash=get_password_hash("Tuananhstudio@"),
                full_name="TUAN ANH STUDIO",
                avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={test_email}",
                role="user",
                tier="premium",
                referral_code="STUDY_TESTER",
                is_verified=True,
                wallet_balance=250000.0
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"-> Created test account: {test_email} / Tuananhstudio@ (Premium Tier)")

        # 2. Check or create default admin user
        admin_email = "admin@studyos.ai"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                password_hash=get_password_hash("admin123"),
                full_name="Quan Tri Vien",
                avatar_url="https://api.dicebear.com/7.x/bottts/svg?seed=admin@studyos.ai",
                role="admin",
                tier="premium",
                referral_code="STUDY_ADMIN",
                is_verified=True
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"-> Created admin account: {admin_email} / admin123")

        # Remove old docs, logs, and exams for this test user to keep it clean
        db.query(AIUsageLog).filter(AIUsageLog.user_id == user.id).delete()
        db.query(Exam).filter(Exam.user_id == user.id).delete()
        old_docs = db.query(Document).filter(Document.user_id == user.id).all()
        for doc in old_docs:
            db.delete(doc)
        db.commit()

        # 3. Create Document
        doc = Document(
            user_id=user.id,
            name="GiaoTrinhMarketing.pdf",
            size=1254300,
            mime_type="application/pdf",
            file_url="/api/static/documents/mock_marketing.pdf",
            content_text="Marketing Mix la tap hop cac cong cu tiep thi ma doanh nghiep su dung de dat duoc cong viec tiep thi trong thi truong. 4P gom: Product, Price, Place, Promotion. STP la Segmentation, Targeting va Positioning. Quy trinh nay giup doanh nghiep phan phoi nguon luc va tang suc canh tranh.",
            parsed_sections={
                "short_summary": "Tai lieu nay cung cap kien thuc nen tang ve Marketing Mix (4P) va quy trinh STP.",
                "detailed_summary": "Giao trinh Marketing phan tich cac lap ke hoach tiep thi, chia nho thi truong, dinh vi thuong hieu va toi uu hoa ROI tiep thi.",
                "bullet_points": [
                    "Marketing 4P bao gom Product, Price, Place, Promotion",
                    "STP gom Phan khuc, Nham muc tieu va Dinh vi",
                    "Do luong ROI tiep thi giup toi uu ngan sach"
                ]
            }
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        print("-> Created document 'GiaoTrinhMarketing.pdf'")

        # 4. Create Chapters
        ch1 = Chapter(
            document_id=doc.id,
            title="Chuong 1: Tong quan ve Marketing Mix (4P)",
            content_summary="Gioi thieu mo hinh 4P: Product, Price, Place, Promotion. Day la nen tang cua moi chien luoc tiep thi.",
            key_points=[
                "Product: Thiet ke, tinh nang, chat luong san pham.",
                "Price: Chien luoc dinh gia ban, chiet khau.",
                "Place: Kenh phan phoi, logictics va bao phu.",
                "Promotion: Quang cao, PR, khuyen mai."
            ],
            formulas=["ROI = (Doanh thu - Chi phi) / Chi phi"],
            keywords=["Marketing Mix", "San pham", "Gia ca"],
            order=0
        )
        ch2 = Chapter(
            document_id=doc.id,
            title="Chuong 2: Quy trinh dinh vi STP",
            content_summary="Ky thuat chia nho thi truong dua tren nhan khau hoc de chon thi truong muc tieu phu hop.",
            key_points=[
                "Segmentation: Phan doan thi truong.",
                "Targeting: Chon phan khuc muc tieu.",
                "Positioning: Dinh vi thuong hieu, USP."
            ],
            formulas=["LTV = Chi tieu * Tan suat * Thoi gian"],
            keywords=["STP", "Phan khuc", "Dinh vi"],
            order=1
        )
        db.add(ch1)
        db.add(ch2)
        db.commit()
        print("-> Created chapters")

        # 5. Create Flashcards
        cards = [
            Flashcard(document_id=doc.id, question="Marketing Mix la gi?", answer="Tap hop cac cong cu tiep thi ma doanh nghiep su dung de dat muc tieu.", definition="Mo hinh ket hop Product, Price, Place, Promotion.", category="Marketing", box_level=1, next_review_at=datetime.now(timezone.utc)),
            Flashcard(document_id=doc.id, question="USP la gi?", answer="Unique Selling Proposition", definition="Diem ban hang doc nhat giup phan biet voi doi thu.", category="Thuong hieu", box_level=2, next_review_at=datetime.now(timezone.utc) + timedelta(days=3)),
            Flashcard(document_id=doc.id, question="Quy trinh STP gom nhung gi?", answer="Segmentation, Targeting, Positioning", definition="Quy trinh ba buoc kinh dien de thiet ke chien luoc tiep thi.", category="Chien luoc", box_level=3, next_review_at=datetime.now(timezone.utc) + timedelta(days=7)),
            Flashcard(document_id=doc.id, question="Promotion trong 4P la gi?", answer="Hoat dong truyen thong, quang ba san pham.", definition="Bao gom quang cao, khuyen mai, PR.", category="Truyen thong", box_level=1, next_review_at=datetime.now(timezone.utc)),
            Flashcard(document_id=doc.id, question="Cong thu tinh ROI tiep thi?", answer="ROI = (Doanh thu - Chi phi) / Chi phi", definition="Do luong loi nhuan so voi ngan sach dau tu.", category="Tai chinh", box_level=4, next_review_at=datetime.now(timezone.utc) + timedelta(days=14))
        ]
        db.bulk_save_objects(cards)
        db.commit()
        print("-> Created flashcard deck")

        # 6. Create Quizzes
        quizzes = [
            Quiz(document_id=doc.id, type="multiple_choice", difficulty="medium", question="Chu P nao lien quan den kenh phan phoi trong 4P?", options=["Product", "Price", "Place", "Promotion"], correct_answer="Place", explanation="Place dai dien cho dia diem, cac kenh phan phoi dua san pham tiep can khach hang."),
            Quiz(document_id=doc.id, type="true_false", difficulty="easy", question="Cong thuc tinh ROI phan anh ty suat hoan von dau tu.", options=["Dung", "Sai"], correct_answer="Dung", explanation="ROI = Return on Investment do luong loi nhuan thu duoc so voi chi phi bo ra."),
            Quiz(document_id=doc.id, type="fill_blank", difficulty="hard", question="Quy trinh STP gom Phan khuc, Nham muc tieu va ______.", options=[], correct_answer="Dinh vi", explanation="Dinh vi (Positioning) la buoc cuoi cung trong quy trinh STP."),
            Quiz(document_id=doc.id, type="multiple_choice", difficulty="medium", question="Cong thuc ROI dung de tinh chi so nao sau đây?", options=["Ty le giu chan khach hang", "Ty suat hoan von dau tu", "Gia tri vong doi khach hang", "Chi phi thu hut khach hang"], correct_answer="Ty suat hoan von dau tu", explanation="ROI = Return on Investment.")
        ]
        db.bulk_save_objects(quizzes)
        db.commit()
        print("-> Created quizzes")

        # 7. Create Exams (past exams for dashboard charts)
        now = datetime.now(timezone.utc)
        ex1 = Exam(
            user_id=user.id,
            document_id=doc.id,
            quiz_ids=[1, 2],
            user_answers={"1": "Place", "2": "Dung"},
            score=50.0,
            duration_seconds=110,
            tab_switch_count=1,
            completed_at=now - timedelta(days=3)
        )
        ex2 = Exam(
            user_id=user.id,
            document_id=doc.id,
            quiz_ids=[1, 2, 3],
            user_answers={"1": "Place", "2": "Sai", "3": "Dinh vi"},
            score=100.0,
            duration_seconds=190,
            tab_switch_count=0,
            completed_at=now - timedelta(days=2)
        )
        ex3 = Exam(
            user_id=user.id,
            document_id=doc.id,
            quiz_ids=[1, 2, 4],
            user_answers={"1": "Place", "2": "Sai", "4": "Chi phi thu hut khach hang"},
            score=66.7,
            duration_seconds=145,
            tab_switch_count=0,
            completed_at=now - timedelta(days=1)
        )
        db.add(ex1)
        db.add(ex2)
        db.add(ex3)
        db.commit()
        print("-> Created exam history")

        # 8. Create System Logs
        log1 = SystemLog(user_id=user.id, action="Register", details="Registered default user phamngocminh1470@gmail.com", ip_address="127.0.0.1")
        log2 = SystemLog(user_id=user.id, action="Upload File", details="Uploaded document GiaoTrinhMarketing.pdf", ip_address="127.0.0.1")
        log3 = SystemLog(user_id=user.id, action="Payment Success", details="Upgraded subscription tier to Premium via MOMO", ip_address="127.0.0.1")
        db.add(log1)
        db.add(log2)
        db.add(log3)
        db.commit()
        print("-> Created system logs")
        
        print("Success! Database seeded successfully.")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
