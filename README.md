# 🎓 StudyOS AI - Hệ Thống Học Tập Thông Minh Bằng AI

StudyOS AI là một nền tảng SaaS hiện đại được thiết kế để biến mọi tài liệu học tập (PDF, DOCX, PPTX, TXT, hình ảnh) thành hệ thống học tập hoàn chỉnh được cá nhân hóa hoàn toàn nhờ trí tuệ nhân tạo (Gemini và OpenAI).

Dự án này tích hợp đầy đủ 15 module tính năng từ thiết lập xác thực, bảng điều khiển thống kê, trích xuất tài liệu, tóm tắt thông tin, xây dựng mindmap, thẻ ghi nhớ Leitner, thi thử áp suất chống chuyển tab, đến tích hợp cổng thanh toán giả lập và hệ thống tiếp thị liên kết (Affiliate).

---

## 🚀 Hướng Dẫn Chạy Dự Án (How to Run)

Dự án có thể được khởi chạy bằng 2 cách: sử dụng **Docker** hoặc chạy **Local** từng phần.

### CÁCH 1: KHỞI CHẠY BẰNG DOCKER (Khuyên Dùng)

Yêu cầu máy tính đã cài đặt **Docker** và **Docker Compose**. Chạy lệnh sau ở thư mục gốc để khởi động toàn bộ hệ thống (PostgreSQL, Redis, FastAPI Backend, Next.js Frontend):

```bash
docker-compose up --build
```

- **Frontend** sẽ chạy ở địa chỉ: `http://localhost:3000`
- **Backend API** sẽ chạy ở địa chỉ: `http://localhost:8000`
- **PostgreSQL Database** cổng: `5432`
- **Redis Cache** cổng: `6379`

---

### CÁCH 2: CHẠY THỦ CÔNG TRÊN MÁY LOCAL

#### 1. Chạy Backend FastAPI:
Yêu cầu Python 3.10 trở lên. Mở cửa sổ terminal thứ nhất và di chuyển vào thư mục `/backend`:

```bash
cd backend
# Tạo môi trường ảo (khuyến nghị)
python -m venv venv
venv\Scripts\activate

# Cài đặt thư viện phụ thuộc
pip install -r requirements.txt

# Khởi chạy server FastAPI
uvicorn app.main:app --reload --port 8000
```
*Lưu ý: Backend tự động khởi tạo cơ sở dữ liệu SQLite cục bộ (hoặc Postgres nếu cấu hình trong `.env`) và tự động tạo bảng dữ liệu khi start.*

#### 2. Chạy Frontend Next.js:
Yêu cầu Node.js v18+. Mở cửa sóc terminal thứ hai và di chuyển vào thư mục `/frontend`:

```bash
cd frontend
# Cài đặt thư viện dependencies
npm install --legacy-peer-deps

# Chạy server ở chế độ phát triển
npm run dev
```
Truy cập vào địa chỉ: `http://localhost:3000` để trải nghiệm.

---

## 🛠️ Chi Tiết Các Module & Cách Kiểm Tra Chức Năng

### Module 1 - Xác Thực (Auth)
- **Tính năng**: Đăng ký, đăng nhập JWT, đổi mật khẩu, đăng nhập Google & Github (giả lập liên kết).
- **Kích hoạt tài khoản**: Khi đăng ký, một mã OTP sẽ được sinh ra. Nếu chưa cấu hình SMTP, bạn hãy mở log của terminal chạy backend để xem mã OTP hiển thị trực tiếp tại đó.

### Module 2 - Bảng Điều Khiển (Dashboard)
- **Tính năng**: Xem thống kê số lượng tài liệu học tập, câu hỏi, flashcard, tỉ lệ thuộc bài, và các biểu đồ tiến độ, phổ điểm, tần suất học tập theo chủ đề.

### Module 3 - Tải Lên Tài Liệu (Upload File)
- **Tính năng**: Hỗ trợ kéo thả PDF, DOCX, PPTX, TXT, JPG, PNG với thanh tiến trình tải lên.
- **Lưu trữ**: Tệp tin tự động lưu trữ tại Supabase Bucket. Nếu chưa cài đặt Key, tệp tin sẽ tự động lưu cục bộ trong thư mục `backend/storage_uploads` để bảo đảm hệ thống luôn hoạt động bình thường.

### Module 4 & 5 - Phân Tích & Tóm Tắt AI
- **Tính năng**: Khi file tải lên thành công, một Background Task trong FastAPI sẽ chạy ngầm để bóc tách văn bản thô, chia chương học, trích xuất từ khóa, công thức toán học và tạo tóm tắt (ngắn, chi tiết, gạch đầu dòng).
- **Lưu ý**: Nếu chưa cấu hình Key OpenAI/Gemini trong `.env`, hệ thống sẽ tự động sinh dữ liệu phân tích học thuật mẫu cực kỳ chi tiết theo tên file được tải lên (ví dụ: bóc tách công thức $ROI = \frac{Revenue - Cost}{Cost}$ nếu tên tệp chứa chữ 'marketing', hoặc cấu trúc giải thuật Quick Sort nếu tên tệp chứa chữ 'code').

### Module 6 - Bản Đồ Kiến Thức (Knowledge Map)
- **Tính năng**: Dựng sơ đồ Mindmap dạng cây thư mục phân cấp, dòng thời gian lộ trình học tập, và lập bảng phân tích mối quan hệ giữa các khái niệm.

### Module 7 - Flashcard AI
- **Tính năng**: Tự động sinh bộ thẻ ghi nhớ tương tác. Hỗ trợ hệ thống lặp lại ngắt quãng Leitner 5 hộp. Chọn "Đã thuộc" để tăng cấp hộp thẻ (gia tăng khoảng thời gian gặp lại), chọn "Chưa thuộc" để đưa thẻ về hộp ban đầu nhằm tăng tần suất ôn tập.

### Module 8 & 9 - Trắc Nghiệm AI & Chế Độ Thi Thử
- **Tính năng**: Làm câu hỏi trắc nghiệm ngay lập tức kèm đáp án và giải thích chi tiết.
- **Chế độ thi thử**: Làm bài kiểm tra tính giờ. Hệ thống tích hợp khả năng chống gian lận - giám sát sự kiện mất focus của màn hình. Rời tab hoặc chuyển app quá 3 lần sẽ bị hệ thống ép buộc tự động nộp bài ngay lập tức. Sau khi nộp, điểm số và chi tiết các câu sai sẽ hiển thị rõ ràng.

### Module 10 - AI Tutor Chat
- **Tính năng**: Hỏi đáp trực tiếp RAG với tài liệu của bạn. Hệ thống trả lời kèm hộp trích dẫn chi tiết (Citations) chỉ ra trang tham chiếu và ngữ cảnh chính xác trong văn bản gốc.

### Module 11 - AI Generator (Tạo Nhanh 1-Click)
- **Tính năng**: Các nút bấm tạo nhanh tích hợp sẵn ở từng màn hình giúp khởi tạo tức thì tài liệu học tương thích.

### Module 12 - Admin Panel (Quản Trị)
- **Tính năng**: Truy cập `/admin` bằng tài khoản có role `admin` (hoặc chuyển đổi role trực tiếp trong bảng). Xem tổng chi phí token AI, quản lý người dùng, thay đổi gói cước tài khoản của thành viên, và xem nhật ký audit log.

### Module 13 - Cổng Thanh Toán (Payment)
- **Tính năng**: Nâng cấp tài khoản lên Pro/Premium. Giả lập cổng thanh toán Stripe (Form thẻ tín dụng), MoMo (Quét mã QR), và VNPay (Danh sách ngân hàng) trong sandbox để người dùng trải nghiệm trọn vẹn quy trình nâng cấp tài khoản, nâng cấp hạn ngạch.

### Module 14 - Tiếp Thị Liên Kết (Affiliate)
- **Tính năng**: Tạo link chia sẻ định dạng `register?ref=STUDY_XXXXX`. Người dùng đăng ký qua link và nâng cấp tài khoản, bạn sẽ nhận được 20% tiền hoa hồng ghi nhận vào ví. Có sẵn nút yêu cầu rút tiền về tài khoản ngân hàng khi số dư lớn hơn 50,000 VND.

### Module 15 - UI/UX
- **Thiết kế**: Tone màu chủ đạo Tím, Xanh dương và Trắng tinh tế. Hỗ trợ Dark/Light Mode đồng bộ, hiệu ứng glassmorphism mượt mà và responsive trên mọi thiết bị di động.
