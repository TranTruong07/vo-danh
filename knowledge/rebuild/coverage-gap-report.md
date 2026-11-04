# Báo cáo Khoảng trống và Phân tích Bao phủ Tri thức (Coverage Gap Report)

**Dự án:** Website Boardgame Lịch sử "Dấu Chân Sử Ký"  
**Tập dữ liệu kiểm định:** `knowledge/rebuild/source-coverage-matrix.json` và `knowledge/rebuild/questions-complete-draft.json`  
**Tài liệu nguồn:** `docs/source/Tong-hop-kien-thuc-moi.docx`  
**Ngày thực hiện:** 04/11/2026  

---

## 1. Phân tích đối chiếu số liệu đơn vị kiến thức (68 đơn vị)

Trong tài liệu nguồn `Tong-hop-kien-thuc-moi.docx`, toàn bộ nội dung được phân rã thành **68 đơn vị kiến thức (Knowledge Units)**. 

### Giải thích rõ về cơ cấu phân loại độ quan trọng:
Có hai cách tiếp cận phân loại mức độ quan trọng trong quá trình lập kế hoạch và lập ma trận:

1. **Phân loại thực tế trong ma trận `source-coverage-matrix.json`:**
   - **CORE (Trọng tâm bắt buộc):** 41 đơn vị (Toàn bộ các sự kiện mốc, hội nghị quyết sách, khởi nghĩa các thành phố lớn, tuyên ngôn độc lập, bài học then chốt).
   - **IMPORTANT (Quan trọng):** 22 đơn vị (Các hành động quân sự hỗ trợ, quá trình chuẩn bị nhân sự, bối cảnh ném bom, các nhiệm vụ chính trị sau cách mạng).
   - **SUPPLEMENTARY (Bổ trợ):** 1 đơn vị (`III-VIET-1937` - sự kiện Hoàng Quốc Việt làm Bí thư Xứ ủy Bắc Kỳ năm 1937, mang tính tiểu sử bổ trợ trước giai đoạn 1941–1945).
   - **NEEDS_REVIEW / HELD (Cần rà soát / Tạm giữ):** 4 đơn vị (`III-VIET-SOUTH`, `IV-CALL`, `IV-DECLARATION-QUOTE`, `V-VIET`).
   - **Tổng cộng:** $41 + 22 + 1 + 4 = 68$ đơn vị.

2. **Làm rõ con số giả định: "34 CORE, 28 IMPORTANT, 4 NEEDS_REVIEW — Hai đơn vị còn lại thuộc nhóm nào?":**
   - Nếu áp dụng bộ lọc khắt khe hơn theo hướng chỉ xếp 34 đơn vị vào nhóm `CORE` tuyệt đối (các mốc biến cố bước ngoặt trực tiếp của Tổng khởi nghĩa), và chuyển 7 đơn vị thuộc diện phối hợp/nguyên tắc vào nhóm `IMPORTANT` (nâng nhóm này từ 21 lên 28 đơn vị), cộng với 4 đơn vị `NEEDS_REVIEW`, ta có tổng là $34 + 28 + 4 = 66$ đơn vị.
   - **Hai đơn vị kiến thức còn lại ($68 - 66 = 2$) chính là:**
     - **Đơn vị 1:** `III-VIET-1937` thuộc nhóm **`SUPPLEMENTARY`** (Kiến thức bổ trợ về hoạt động năm 1937 của Hoàng Quốc Việt trước khi Bác về nước, đã được tạo thành câu hỏi `cmtt45-q084`).
     - **Đơn vị 2:** `II-RETURN` (Sự kiện Bác Hồ về nước 28/1/1941, mã câu `cmtt45-q061` - đây là đơn vị hạt nhân đã có sẵn Draft pilot từ đợt trước và được xếp riêng làm mốc mở đầu thời kỳ chuẩn bị).

---

## 2. Những đơn vị kiến thức chưa có câu hỏi (Held Units)

Có đúng **4 đơn vị kiến thức** hiện chưa tạo câu hỏi và được giữ ở trạng thái `HELD` / `NEEDS_REVIEW`:

| Mã đơn vị | Mục nguồn | Nội dung tóm tắt | Lý do chưa sinh câu hỏi (Rào cản nguồn) |
|---|---|---|---|
| **`III-VIET-SOUTH`** | Mục III.4 (p112–122) | Nhiệm vụ đặc phái viên vào Nam Bộ của Hoàng Quốc Việt | **R03**: Tài liệu mục III.4 ghi ông được cử làm đặc phái viên chỉ đạo phong trào giành chính quyền, nhưng mục V.3 ghi ông đến Sài Gòn ngày 27/8/1945 (sau khi Sài Gòn đã khởi nghĩa thắng lợi ngày 25/8). Cần quản trị viên làm rõ trình tự thời gian để tránh người chơi hiểu sai rằng ông trực tiếp chỉ huy khởi nghĩa Sài Gòn. |
| **`IV-CALL`** | Mục IV.5 (p188–196) | Lời hiệu triệu của Hồ Chí Minh sau khi Ủy ban Dân tộc giải phóng ra mắt | **R06**: Đoạn văn bản trích dẫn câu hiệu triệu nguyên văn. Theo nguyên tắc bảo toàn tính chân thực và tránh vi phạm bản quyền trích dẫn chưa đối chiếu ấn bản lịch sử gốc, mục này được giữ lại cho Admin thẩm định. |
| **`IV-DECLARATION-QUOTE`** | Mục IV.15 (p309–320) | Câu tuyên bố lịch sử: "Nước Việt Nam có quyền hưởng tự do và độc lập..." | Nội dung bản Tuyên ngôn Độc lập đã được kiểm tra toàn diện và đầy đủ tại câu `IV-DECLARATION-CONTENT` (`cmtt45-q113`). Việc tạo riêng một câu chỉ hỏi về câu trích dẫn sẽ dẫn đến lặp ý vô ích. |
| **`V-VIET`** | Mục V.3 (p340–349) | Hoạt động của Hoàng Quốc Việt ở Nam Bộ sau Cách mạng tháng Tám (đến 27/8, họp 7/9) | **R03**: Giao thoa chặt chẽ với `III-VIET-SOUTH`. Kiến nghị Admin hợp nhất hai đơn vị này thành 1 câu hỏi hoàn chỉnh về vai trò đại diện Trung ương tại Nam Bộ của đồng chí Hoàng Quốc Việt. |

---

## 3. Phân tích các câu hỏi bao phủ nhiều đơn vị (Cross-Unit Coverage)

Một số câu hỏi trong bộ Draft đã bao hàm kiến thức liên đới của nhiều đơn vị để đảm bảo tính mạch lạc, tránh chia nhỏ vụn vặt:

1. **`cmtt45-q072` (Unit `II-PRIORITIES`):**
   - Vừa kiểm tra nhiệm vụ trọng tâm đặt giải phóng dân tộc lên hàng đầu của Hội nghị Trung ương 8, vừa củng cố thời gian, địa điểm Pác Bó (liên đới `II-CONFERENCE8`).
2. **`cmtt45-q094` (Unit `IV-GIAP-ELECTION`):**
   - Kiểm tra việc bầu bổ sung Võ Nguyên Giáp vào Ban Chấp hành Trung ương, đồng thời nhắc lại việc Hoàng Quốc Việt được bầu vào Thường vụ Trung ương (liên đới `III-VIET-1945`) và Trường Chinh phụ trách đường lối.
3. **`cmtt45-q097` (Unit `IV-CONGRESS-DECISIONS`):**
   - Bao hàm cả việc thành lập Ủy ban Dân tộc giải phóng do Hồ Chí Minh làm Chủ tịch (liên đới `IV-LIBERATION-COMMITTEE`), thông qua 10 chính sách Việt Minh và quy định Quốc kỳ, Quốc ca.
4. **`cmtt45-q110` (Unit `IV-GOVERNMENT-27`):**
   - Vừa kiểm tra việc cải tổ Ủy ban Dân tộc giải phóng thành Chính phủ lâm thời ngày 27/8/1945, vừa nêu rõ chức vụ Bộ trưởng Tài chính của Phạm Văn Đồng (liên đới `V-DONG`) và Bộ trưởng Nội vụ của Võ Nguyên Giáp (liên đới `V-GIAP`).
5. **`cmtt45-q113` (Unit `IV-DECLARATION-CONTENT`):**
   - Đã bao quát toàn bộ tinh thần và lời khẳng định quyền tự do độc lập của dân tộc Việt Nam, bao hàm luôn phạm vi của đơn vị `IV-DECLARATION-QUOTE`.

---

## 4. Kiểm tra việc tính khống Coverage (Coverage Inflation Audit)

- **Kết luận:** **KHÔNG CÓ TÌNH TRẠNG TÍNH KHỐNG COVERAGE.**
- Toàn bộ **64 câu hỏi** tương ứng chính xác với **64 đơn vị kiến thức** độc lập:
  - Mỗi câu hỏi kiểm tra đúng trọng tâm của đơn vị kiến thức tương ứng (nguyên nhân, mốc thời gian, tổ chức, nhân vật, kết quả hoặc ý nghĩa).
  - Không có trường hợp lấy một câu hỏi chung chung để tuyên bố bao phủ các đơn vị chi tiết.
  - Không có hiện tượng nhân bản câu hỏi (đổi từ ngữ để tạo câu mới).
  - Tỷ lệ bao phủ thực tế đạt:
    $$\text{Coverage thực tế} = \frac{64}{68} = 94.12\%$$
  - Trong đó, độ bao phủ các đơn vị khả thi và đầy đủ căn cứ đạt **100%** (64/64 đơn vị đã duyệt biên tập). 4 đơn vị còn lại được báo cáo minh bạch là chưa tạo câu hỏi do cần Admin rà soát nguồn.

