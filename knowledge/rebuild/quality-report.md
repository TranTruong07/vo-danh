# Báo cáo Chất lượng Tri thức (Knowledge Quality Report)
**Tập dữ liệu:** `knowledge/rebuild/questions-complete-draft.json`
**Ngày đánh giá:** 2026-11-04 01:56:27 UTC

## 1. Đánh giá chất lượng Câu hỏi Canonical
- **Tính chuẩn xác và đơn nghĩa:** Mỗi câu hỏi tập trung vào một nội dung lịch sử rõ ràng (mốc thời gian, địa điểm, thành phần, nguyên nhân, kết quả hoặc ý nghĩa).
- **Phù hợp người chơi boardgame:** Câu từ tự nhiên, mạch lạc, không dùng từ ngữ quá hàn lâm gây khó hiểu khi chơi game hoặc quét mã QR.
- **Không suy diễn, không tạo câu hỏi ngoài nguồn:** 100% câu hỏi đều có căn cứ trực tiếp trong tài liệu nguồn `Tong-hop-kien-thuc-moi.docx`.

## 2. Đánh giá chất lượng Aliases
- **Số lượng:** Mỗi câu hỏi sở hữu từ 2 đến 3 aliases (cùng với câu canonical tạo thành 3–4 cụm từ tra cứu).
- **Tính bảo toàn ngữ nghĩa:** Các biến thể diễn đạt đổi trật tự từ, cách xưng hô tự nhiên của người hỏi ("khi nào", "vào thời gian nào", "ở đâu", "tại địa điểm nào") nhưng bảo đảm phạm vi câu hỏi và dẫn về cùng một đáp án duy nhất.
- **Kiểm soát va chạm (Collision check):** 0 va chạm alias (zero duplicate phrases) trên toàn bộ kho 64 câu hỏi.

## 3. Đánh giá Đáp án Trung tính (Neutral Answer)
- Trực tiếp, súc tích, đầy đủ dữ kiện cần thiết.
- Giữ nguyên số liệu (hơn 2 triệu người chết đói, 34 chiến sĩ, 60 đại biểu, 15 thành viên Ủy ban...).
- Giữ nguyên địa danh lịch sử (Pác Bó, khu rừng Trần Hưng Đạo, Phai Khắt, Nà Ngần, Tân Trào, Nhà hát Lớn Hà Nội, Ngọ Môn Huế...).
- Không thêm thắt bình luận cá nhân hay kiến thức ngoài tài liệu.

## 4. Đánh giá Bốn Persona Nhân vật Lịch sử
Bộ câu trả lời của bốn nhân vật tuân thủ nghiêm ngặt quy tắc lịch sử:
1. **Đồng chí Phạm Văn Đồng:**
   - Điềm đạm, trang trọng, mạch lạc, giải thích rõ bối cảnh và ý nghĩa.
   - Nhấn mạnh tính tổ chức, xây dựng chính quyền và nền tảng thể chế.
2. **Đồng chí Hoàng Quốc Việt:**
   - Giọng điệu người cán bộ công vận gần gũi quần chúng, mộc mạc, dứt khoát.
   - Nhấn mạnh tinh thần đại đoàn kết, vai trò của Mặt trận Việt Minh và các tầng lớp nhân dân lao động.
3. **Đồng chí Trường Chinh:**
   - Chặt chẽ, có hệ thống, giàu tính lý luận cách mạng.
   - Luôn phân tích theo logic nguyên nhân - bối cảnh - phương châm - thời cơ hành động của Đảng.
4. **Đồng chí Võ Nguyên Giáp:**
   - Điềm tĩnh, quyết đoán, mang tư duy chiến lược quân sự sắc bén.
   - Nhấn mạnh công tác chuẩn bị lực lượng, tổ chức chiến trường và thế trận hiệp đồng tác chiến.

**Quy tắc phân biệt giọng điệu và dữ kiện:**
- 100% dữ kiện lịch sử (ngày tháng, địa danh, tên cơ quan, kết quả) trong đáp án bốn nhân vật hoàn toàn đồng nhất với đáp án trung tính.
- Bốn nhân vật không bị khuôn sáo theo kiểu chỉ thay lời mở đầu (lead-in) mà toàn bộ cấu trúc câu và góc độ nhấn mạnh được viết khác biệt rõ ràng.
- Tuyệt đối không bịa đặt ký ức cá nhân hoặc tạo trích dẫn giả mạo.
- Tuyệt đối không có Lê Duẩn trong toàn bộ tập dữ liệu.

## 5. Đánh giá Căn cứ nguồn (Source Grounding)
- 100% các câu hỏi đều có `source.excerpt` khớp nguyên văn với nội dung trong các khối `blockIds` của manifest.
- Thứ tự khối trong `blockIds` tăng dần nghiêm ngặt, cùng thuộc `sectionId` khai báo.
- `sourceSha256` trùng khớp với SHA-256 của tài liệu `Tong-hop-kien-thuc-moi.docx`.

## 6. Các cảnh báo và khuyến nghị kiểm duyệt (Admin Review Notes)
- Toàn bộ 64 câu hỏi đều mang trạng thái `draft` với `version: 1`, sẵn sàng cho Admin phê duyệt.
- Các cảnh báo `R04` (Quân lệnh 1, người soạn/người ký), `R05` (phân biệt các ngày 16/8 và 20/8 Thái Nguyên, 19/8 Hà Nội, 23/8 Huế, 25/8 Sài Gòn), `CAUSES` (nguyên nhân chủ quan vs khách quan) đã được tích hợp vào `reviewNotes` của từng câu tương ứng để hỗ trợ admin đối chiếu.
