# Kho câu hỏi theo nhân vật

Tab **Câu hỏi** trong sidebar quản trị mở `/admin/questions`. Có thể mở danh sách đã lọc từ nút **Danh sách câu hỏi** trên trang chi tiết nhân vật.

- Tìm nội dung câu hỏi bằng từ khóa, chọn một nhân vật hoặc tất cả nhân vật. Ô tìm nhanh tên nhân vật hỗ trợ gõ không dấu. Bấm **Áp dụng bộ lọc** để tìm; phân trang giữ nguyên bộ lọc.
- Mỗi thẻ hiển thị nhân vật, câu hỏi và đáp án đúng. Mở **Xem đáp án & phản hồi** để đọc đủ bốn lựa chọn và hai phản hồi.
- **Tạo câu hỏi** giữ sẵn nhân vật đang lọc. Trang tạo/chỉnh sửa gồm nhân vật, nội dung, bốn đáp án, một lựa chọn đúng và phản hồi đúng/sai. Xóa có xác nhận.
- Không cho xóa nhân vật đang có câu hỏi; cần chuyển câu hỏi sang nhân vật khác hoặc xóa câu hỏi trước.

MongoDB collection `character_questions` gồm `characterId` (chuỗi ObjectId), `question`, `answers` (4 chuỗi), `correctIndex` (0–3), `correctFeedback`, `incorrectFeedback`, `_id`, `createdAt`, `updatedAt`. Index theo `characterId, updatedAt`; danh sách phân trang 10 câu. Câu hỏi 10–500 ký tự, đáp án 1–250 ký tự, phản hồi 1–1.200 ký tự; các đáp án phải khác nhau. Service kiểm tra quyền admin, dữ liệu và nhân vật tồn tại; repository thực hiện truy vấn. UI không truy cập DB.

Lượt chơi chỉ lấy câu hỏi đã lưu của đúng nhân vật. Cơ chế rút câu chưa gặp theo từng trình duyệt/nhân vật hạn chế lặp: hết kho mới mở vòng mới, tránh lặp liền câu cuối nếu có ít nhất hai câu. Nhân vật chưa có câu hỏi hiển thị thông báo. Lịch sử rút được giữ tối đa 30 ngày từ lượt gần nhất. Lượt chơi lưu snapshot câu hỏi và hai phản hồi, nên chỉnh sửa sau đó không thay đổi đáp án/phản hồi của lượt đang chơi. Đáp án đúng và phản hồi không xuất hiện trong payload trước khi chốt; server chọn phản hồi theo kết quả đã lưu. Xóa câu hỏi chỉ ảnh hưởng các lượt mới.

Kiểm tra: `node tests/character-questions.test.mjs` và `node tests/character-questions.browser.mjs`. Bài browser cần server cổng 3001, Edge và MongoDB; tạo hai nhân vật cùng các câu hỏi tạm, kiểm tra CRUD/tìm kiếm/phân trang/mobile/feedback và dọn dữ liệu theo ID riêng. Không gửi email.
