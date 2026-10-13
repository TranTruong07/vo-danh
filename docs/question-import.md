# Nhập câu hỏi từ Excel

Trong **Admin → Câu hỏi → Nhập từ Excel**:

1. Tải **Excel mẫu**. Trang `Câu hỏi` có 8 cột và một dòng minh họa; trang `Hướng dẫn` giải thích cách điền. Thay hoặc xóa dòng `[MẪU]` trước khi nhập.
2. Chọn nhân vật nhận câu hỏi. Nếu mở từ danh sách đang lọc theo nhân vật thì nhân vật đó được chọn sẵn.
3. Chọn file `.xlsx` tối đa 2 MB / 500 dòng. Giữ nguyên tên trang tính và 8 tiêu đề: **Câu hỏi, Đáp án A, Đáp án B, Đáp án C, Đáp án D, Đáp án đúng, Phản hồi đúng, Phản hồi sai**.
4. Bấm **Kiểm tra file**. Xem số dòng hợp lệ, trùng lặp, cần sửa và chi tiết lỗi theo số dòng Excel. Bước này chưa lưu dữ liệu.
5. Bấm **Nhập N câu hỏi hợp lệ**. Chỉ dòng hợp lệ được thêm. Dòng lỗi và trùng bị bỏ qua, câu hỏi cũ không bị ghi đè. Có thể sửa file và nhập lại để bổ sung các dòng còn thiếu.

Câu hỏi dài 10–500 ký tự; 4 đáp án khác nhau, mỗi đáp án 1–250 ký tự; đáp án đúng là A/B/C/D; hai phản hồi bắt buộc, mỗi phản hồi tối đa 1.200 ký tự. Chấp nhận văn bản và số, không nhận ô công thức, ngày tháng hoặc liên kết. Dòng trống được bỏ qua. File vượt giới hạn hoặc sai cấu trúc bị từ chối toàn bộ.

## Kiểm tra trùng

So sánh nội dung câu hỏi sau chuẩn hóa Unicode NFC, chữ thường tiếng Việt và gộp khoảng trắng. Giữ nguyên dấu tiếng Việt và dấu câu; đây là kiểm tra trùng nội dung, không phải so khớp ngữ nghĩa. Phạm vi là **cùng nhân vật**. Một câu giống nhau thuộc hai nhân vật khác nhau vẫn được phép.

- Kiểm tra cả câu hỏi đã lưu trước khi có tính năng import, và các dòng hợp lệ trước đó trong cùng file.
- Khi xác nhận nhập, máy chủ đọc và kiểm tra lại file gốc cùng dữ liệu mới nhất; không dùng dữ liệu xem trước gửi từ trình duyệt.
- Câu hỏi mới/cập nhật lưu `questionKey` là SHA-256 của nội dung chuẩn hóa. MongoDB có unique partial index `(characterId, questionKey)` để chống nhập đồng thời; không sửa/xóa các câu hỏi cũ khi tạo index.
- Nhập hàng loạt dùng insert-only upsert. Nhập lại file sau khi mất kết nối không ghi đè hay tạo thêm bản trùng.
- Tạo/cập nhật thủ công cũng kiểm tra trùng trong nhân vật, loại trừ chính câu đang chỉnh sửa.
- Tải mẫu, xem trước và nhập dữ liệu đều yêu cầu quyền admin. Giới hạn tổng dung lượng giải nén XLSX là 20 MB.

## Kiểm thử

```text
node --test tests/question-import.test.mjs tests/character-questions.test.mjs
node tests/question-import.browser.mjs
```

Browser test dùng `GAME_TEST_BASE_URL` (mặc định `http://localhost:3001`), tài khoản admin và MongoDB từ `.env.local`. Test tạo nhân vật/câu hỏi tạm với ID riêng và xóa đúng các dữ liệu đó sau khi chạy.
