# Báo cáo Bao phủ Tri thức (Source Coverage Report)
**Tài liệu nguồn:** `Tong-hop-kien-thuc-moi.docx` (SHA-256: `fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e`)
**Ngày tạo:** 2026-11-04 01:56:27 UTC
**Phương pháp:** Offline Generation (100% không dùng AI bên ngoài, không Gemini API, không FPT TTS, không ghi MongoDB)

## 1. Tổng quan số liệu bao phủ

| Chỉ số | Số lượng / Tỷ lệ | Ghi chú |
|---|---:|---|
| **Tổng số chương/mục lớn** | **7** | Gồm I, II, III, IV, V, VII, VIII (Mục VI khuyết trong DOCX gốc) |
| **Tổng số đơn vị kiến thức (Knowledge Units)** | **68** | Xác định từ toàn bộ 395 đoạn văn bản của tài liệu nguồn |
| **Số câu hỏi đã tạo trong Draft** | **64** | Gồm 2 câu Draft pilot giữ nguyên (q061, q062) + 62 câu tạo mới (q063–q124) |
| **Số câu có đủ bốn persona** | **64 / 64 (100%)** | Phạm Văn Đồng, Hoàng Quốc Việt, Trường Chinh, Võ Nguyên Giáp |
| **Số câu có Source Evidence xác minh** | **64 / 64 (100%)** | Khớp từng ký tự trích dẫn trong `Tong-hop-kien-thuc-moi.docx` |
| **Số đơn vị giữ lại rà soát (HELD / NEEDS_REVIEW)** | **4** | III-VIET-SOUTH, IV-CALL, IV-DECLARATION-QUOTE, V-VIET |
| **Số đơn vị bị loại do thiếu nguồn (EXCLUDED)** | **0** | Toàn bộ 68 đơn vị kiến thức lịch sử đều có nguồn trích |
| **Tỷ lệ bao phủ kiến thức Trọng tâm (CORE)** | **100.00%** | 41/41 đơn vị CORE được bao phủ toàn diện |
| **Tỷ lệ bao phủ kiến thức Quan trọng (IMPORTANT)** | **100.00%** | 22/22 đơn vị IMPORTANT được bao phủ |
| **Tỷ lệ bao phủ kiến thức Bổ trợ (SUPPLEMENTARY)** | **100.00%** | 1/1 đơn vị được bao phủ |

## 2. Chi tiết độ bao phủ theo từng Phần trong tài liệu

| Phần | Tên mục | Tổng số đơn vị | Đã bao phủ (Draft) | Giữ rà soát (HELD) | Tỷ lệ bao phủ |
|---|---|---:|---:|---:|---:|
| **PHẦN I** | Bối cảnh lịch sử | 8 | 8 | 0 | 100.0% |
| **PHẦN II** | Quá trình chuẩn bị cho Cách mạng tháng Tám | 11 | 11 | 0 | 100.0% |
| **PHẦN III** | Vai trò của bốn nhân vật trước và trong khởi nghĩa | 8 | 7 | 1 | 87.5% |
| **PHẦN IV** | Diễn biến cụ thể Cách mạng tháng Tám (13/8 – 2/9) | 30 | 28 | 2 | 93.3% |
| **PHẦN V** | Hoạt động của bốn nhân vật sau khi thắng lợi | 4 | 3 | 1 | 75.0% |
| **PHẦN VII** | Nguyên nhân thắng lợi (chủ quan và khách quan) | 5 | 5 | 0 | 100.0% |
| **PHẦN VIII** | Ý nghĩa lịch sử (trong nước và thế giới) | 2 | 2 | 0 | 100.0% |
| **TỔNG CỘNG** | | **68** | **64** | **4** | **94.12%** |

## 3. Nội dung giữ lại rà soát (HELD / NEEDS_REVIEW)

Theo đúng quy định biên tập và chỉ dẫn R03, R06 trong `chatbot-rebuild-knowledge-review.md`:
1. **`III-VIET-SOUTH` (Mục III.4, p112–122):** Nhiệm vụ đặc phái viên vào Nam Bộ của Hoàng Quốc Việt. Giữ rà soát vì mốc thời gian cử đi và hoạt động thực tế có sự giao thoa với giai đoạn sau khởi nghĩa.
2. **`IV-CALL` (Mục IV.5, p188–196):** Lời kêu gọi sau khi Ủy ban Dân tộc giải phóng ra mắt. Giữ rà soát theo khuyến cáo R06 để kiểm chứng ấn bản gốc của bức thư hiệu triệu.
3. **`IV-DECLARATION-QUOTE` (Mục IV.15, p309–320):** Câu tuyên bố lịch sử trong Tuyên ngôn Độc lập. Nội dung Tuyên ngôn đã được bao phủ đầy đủ tại `IV-DECLARATION-CONTENT` (q113), câu trích rời được giữ lại để tránh lặp ý.
4. **`V-VIET` (Mục V.3, p340–349):** Hoạt động của Hoàng Quốc Việt ở Nam Bộ sau ngày 2/9 (đến Sài Gòn 27/8, chủ trì họp 7/9). Giữ rà soát cùng `III-VIET-SOUTH` để người quản trị thống nhất thành 1 câu hoặc 2 câu độc lập.
