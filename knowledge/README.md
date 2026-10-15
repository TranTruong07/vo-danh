# Dữ liệu tri thức chờ duyệt

Sinh các file local bằng `knowledge:extract`, `knowledge:drafts`, `knowledge:validate` từ DOCX do chủ dự án cung cấp. Hướng dẫn: [pipeline](../docs/knowledge-pipeline.md).

- `extraction-manifest.json`: nội dung gốc có thứ tự, locators và SHA-256.
- `draft-questions.json`: bộ nháp chưa phê duyệt; không đưa ra client.
- `review-report.md`: báo cáo để người quản trị đọc từng câu và tất cả lời đáp.
- `review-report.json`: lỗi/cảnh báo máy kiểm tra.
- `import-report.json`: kết quả xem trước, mặc định không ghi MongoDB.

Không có `approved-questions.json` được tự tạo. Import chỉ nhận draft; phê duyệt và công bố là các thao tác riêng ở giai đoạn sau. Các file chứa nội dung nguồn được gitignore; không tự công khai hoặc thêm vào offline pack hiện tại.

Phase 2 đã biên tập lời thoại trong các revision mới, giữ bản cũ:

- `draft-questions-phase-2.json`: nháp revision 2 để đối chiếu.
- **`draft-questions-phase-2-v3.json`: đề xuất mới nhất cần quản trị viên duyệt**; đủ 40 câu × 4 lời đáp, tất cả còn draft.
- `review-report-phase-2.md` / `.json`: báo cáo đối chiếu bản mới nhất, 18 cảnh báo cần đọc.
- `import-report-phase-2.json`: dry-run, 0 writes / 0 approved / 0 published.

Các lệnh và API: [báo cáo Phase 2](../docs/chatbot-phase-2.md). Không nhầm `draft-questions.json` mặc định của Phase 1 với bản biên tập mới nhất.
