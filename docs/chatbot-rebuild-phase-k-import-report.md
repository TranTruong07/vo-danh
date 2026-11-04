# BÁO CÁO KẾT QUẢ IMPORT 62 DRAFT KIẾN THỨC VÀO MONGODB (PHASE K)

> **Dự án:** Chatbot Lịch sử Dấu Chân Sử Ký  
> **Chủ đề:** Cách mạng Tháng Tám 1945 (`cach-mang-thang-tam-1945`)  
> **Tài liệu nguồn:** `docs/source/Tong-hop-kien-thuc-moi.docx` (SHA-256: `fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e`)  
> **Tệp dữ liệu import:** `knowledge/rebuild/questions-complete-draft.json`  
> **Thời điểm thực hiện:** 2026-11-04  
> **Môi trường Database:** Live MongoDB (`vo_danh`) — Không rò rỉ URI/credentials  

---

## 1. TỔNG QUAN VÀ MỤC TIÊU PHASE K

Mục tiêu của Phase K là nạp chính thức **62 câu hỏi lịch sử mới** (`cmtt45-q063` đến `cmtt45-q124`) từ bộ dữ liệu chuẩn hóa offline vào MongoDB hiện tại (`vo_danh`), phục vụ kiểm duyệt bởi Quản trị viên (Admin), đồng thời đảm bảo:
1. Tuyệt đối không dùng Gemini API, FPT TTS hay bất kỳ AI service bên thứ ba nào.
2. Tuyệt đối không trỏ sang `MONGODB_TEST_URI` hay tạo database thử nghiệm mới.
3. Không làm thay đổi, ghi đè hoặc xóa 2 câu hỏi pilot đã có (`cmtt45-q061`, `cmtt45-q062`).
4. Toàn bộ 62 câu hỏi mới đều ở trạng thái `draft`, revision `v1`, không tự ý `approved` hay `published`.
5. Đầy đủ 4 persona lịch sử (`pham-van-dong`, `hoang-quoc-viet`, `truong-chinh`, `vo-nguyen-giap`), không có `le-duan`.

---

## 2. KẾT QUẢ PREFLIGHT VÀ SAO LƯU (BASELINE & BACKUP)

### 2.1. Xác nhận Database mục tiêu
- Tên database: `vo_danh` (truy xuất an toàn từ cấu hình dự án, không hiển thị chuỗi kết nối).
- Bộ sưu tập đích: `knowledge_questions` và `knowledge_question_revisions`.

### 2.2. Kiểm tra xung đột trước khi ghi
- Dải ID mới: `cmtt45-q063` đến `cmtt45-q124` (62 ID).
- Số lượng bản ghi trùng ID trong DB trước khi import: **0** (không có xung đột).

### 2.3. Trạng thái Baseline & Sao lưu
- Đã xuất bản sao lưu đầy đủ ra thư mục `.local/knowledge-rebuild/backup-before-phase-k/`:
  - `knowledge_questions.json` (2 bản ghi cũ: `cmtt45-q061`, `cmtt45-q062`).
  - `knowledge_question_revisions.json` (2 revisions cũ: `cmtt45-q061:v1`, `cmtt45-q062:v1`).
  - `baseline_summary.json`:
    - `knowledge_questions`: 2
    - `knowledge_question_revisions`: 2

### 2.4. Kết quả Preflight Dry-run
- Lệnh: `node --conditions=react-server --import tsx scripts/import-knowledge.ts ... --dry-run`
- Kết quả dry-run:
  - `mode`: `"dry-run"`
  - `insertsPlanned`: **62**
  - `skips`: **2** (`cmtt45-q061`, `cmtt45-q062`)
  - `conflicts`: **0**
  - `writes`: **0**

---

## 3. THỰC HIỆN IMPORT CHÍNH THỨC (APPLY)

Lệnh thực thi:
```bash
node --conditions=react-server --import tsx scripts/import-knowledge.ts \
  --source docs/source/Tong-hop-kien-thuc-moi.docx \
  --manifest knowledge/new-source-manifest.json \
  --file knowledge/rebuild/questions-complete-draft.json \
  --apply \
  --report .local/knowledge-rebuild/import-apply-phase-k.json
```

Kết quả thực thi (CLI stdout):
```json
{
  "mode": "apply",
  "insertsPlanned": 62,
  "skips": 2,
  "writes": 62,
  "approved": 0,
  "published": 0,
  "report": ".local/knowledge-rebuild/import-apply-phase-k.json"
}
```

- **Batch ID:** `8218692e300f2f5eb5931dc9968ba03cf743899438e869a3970ac414ce70bcd9`
- **Số câu hỏi nạp mới thành công:** 62
- **Số câu hỏi giữ nguyên (skip do đã có trong DB):** 2 (`cmtt45-q061`, `cmtt45-q062`)
- **Số câu approved:** 0
- **Số câu published:** 0

---

## 4. KẾT QUẢ HẬU KIỂM DATABASE (POSTFLIGHT VERIFICATION)

Script hậu kiểm chuyên sâu `.local/knowledge-rebuild/verify_phase_k.ts` đã kết nối trực tiếp `vo_danh` và xác nhận chi tiết từng bản ghi:

| Tiêu chí | Trước Import | Sau Import | Trạng thái đối soát |
| :--- | :---: | :---: | :--- |
| **Số lượng `knowledge_questions`** | 2 | **64** | ĐÚNG (+62 documents) |
| **Số lượng `knowledge_question_revisions`** | 2 | **64** | ĐÚNG (+62 documents) |
| **Bản ghi cũ `cmtt45-q061`** | draft v1 | **draft v1** | BẢO TOÀN (không sửa, không xóa) |
| **Bản ghi cũ `cmtt45-q062`** | draft v1 | **draft v1** | BẢO TOÀN (không sửa, không xóa) |
| **Dải ID nạp mới** | Không có | `cmtt45-q063` → `cmtt45-q124` | ĐỦ 62 câu hỏi |
| **Trạng thái (status) 62 câu mới** | - | `draft` | 100% draft (0 approved, 0 published) |
| **Phiên bản (version) 62 câu mới** | - | `1` | 100% version 1 |
| **Canonical Question & Approved Answer** | - | Đầy đủ, chuẩn ngữ nghĩa | 62/62 |
| **Aliases & Normalized Phrases** | - | Đầy đủ mảng từ khóa | 62/62 |
| **Persona: Phạm Văn Đồng** | - | 62 câu trả lời | ĐỦ (không rỗng) |
| **Persona: Hoàng Quốc Việt** | - | 62 câu trả lời | ĐỦ (không rỗng) |
| **Persona: Trường Chinh** | - | 62 câu trả lời | ĐỦ (không rỗng) |
| **Persona: Võ Nguyên Giáp** | - | 62 câu trả lời | ĐỦ (không rỗng) |
| **Nhân vật Lê Duẩn** | 0 | 0 | TUYỆT ĐỐI KHÔNG XUẤT HIỆN |
| **Bản ghi đã Approved/Published** | 0 | **0** | ĐÚNG NGUYÊN TẮC QUẢN TRỊ |

---

## 5. KẾT QUẢ KIỂM THỬ VÀ BẢO TOÀN HỆ THỐNG

1. **Validator chính thức (`validate-knowledge.ts`):**
   ```json
   {"records":64,"errors":0,"warnings":19,"report":"knowledge/review-report.md","approvedByTool":0}
   ```
   - 0 errors, 19 cảnh báo lịch sử được gắn cờ rõ ràng cho quản trị viên đối soát (3 QUAN_LENH, 15 DATES_REVIEW, 1 CAUSES).
2. **Bộ Unit Test cốt lõi (`tests/knowledge*.test.mjs`):**
   - Chạy 4 file test hệ thống kiến thức: `knowledge.test.mjs`, `knowledge-rebuild.test.mjs`, `knowledge-v4-import.test.mjs`, `knowledge-admin.test.mjs`.
   - **Kết quả: 39 passed, 0 failed.**
3. **Kiểm tra kiểu dữ liệu TypeScript (`tsc --noEmit`):**
   - **0 errors** (sạch hoàn toàn).

---

## 6. KẾT LUẬN VÀ TRẠNG THÁI HIỆN TẠI

- Giai đoạn **Phase K — Import 62 Drafts vào MongoDB** đã hoàn thành trọn vẹn và chuẩn xác 100%.
- Cơ sở dữ liệu `vo_danh` hiện có tổng cộng **64 câu hỏi** (đều ở trạng thái `draft`, revision `v1`):
  - 2 câu pilot trước đây: `cmtt45-q061`, `cmtt45-q062`.
  - 62 câu mới: `cmtt45-q063` đến `cmtt45-q124`.
- **Dừng lại theo quy định:** Không tự động phê duyệt (approve), không publish. Hệ thống sẵn sàng cho Admin truy cập giao diện quản trị để bắt đầu quy trình đánh giá và kiểm duyệt.

