# Nhân vật lịch sử & trò chơi QR

## Sử dụng

1. Đăng nhập admin, vào `/admin/characters` (hoặc chọn **Nhân vật & QR** trên dashboard).
2. Chọn **Tạo mới nhân vật**, nhập bốn thông tin: **tên**, **câu nói mở đầu** (1–1.000 ký tự), **ảnh nền**, **ảnh nhân vật**. Hai ảnh hỗ trợ URL HTTPS hoặc PNG/JPEG/WebP tối đa 3 MB mỗi ảnh, upload R2 độc lập.
3. Bấm **Lưu nhân vật** để chuyển tới chi tiết với mã QR hiển thị ngay ở đầu trang. Mọi nhân vật đã tạo đều có thể được người chơi quét, không cần đăng nhập. Phần QR cho đặt tên miền, tải PNG hoặc in thẻ. Từ danh sách có thể **Xem chi tiết**, **Chỉnh sửa** hoặc **Xóa** (có xác nhận). QR trỏ tới `/play/<MongoDB ObjectId>`; ID không đổi khi chỉnh sửa hồ sơ.
4. Người chơi quét bằng camera ngoài web để mở trang này, hoặc mở `/play` và dùng camera/chọn ảnh QR. Trang chỉ chọn câu hỏi đã lưu của đúng nhân vật trong tab **Câu hỏi**. Kho trống hiển thị thông báo. Mỗi câu hỏi có 4 lựa chọn, không cần tài khoản. Xem [quản lý câu hỏi](character-questions.md).
5. Mỗi lượt quét chỉ hiển thị một câu hỏi. Chọn một đáp án rồi **Chốt đáp án** để nhận kết quả và lời giải; một lượt chỉ được chốt một lần. Muốn nhận câu tiếp theo, bấm **Quét nhân vật tiếp** và quét lại mã QR (cùng thẻ hoặc thẻ khác). Không có nút đổi câu hỏi trực tiếp. Khi chưa tải được câu hỏi, người chơi có thể thử tải lại; lỗi gửi đáp án không làm đổi câu hỏi hiện tại.

QR cũ ngừng hoạt động khi xóa nhân vật, kể cả chốt câu hỏi đã tạo trước khi xóa. Trạng thái tạm ẩn cũ không còn được sử dụng. Quét mã không hợp lệ có thông báo và không điều hướng tới website ngoài. Dữ liệu ảnh QR chỉ được xử lý trong trình duyệt.

## Camera và tên miền

Mã QR lấy địa chỉ duy nhất từ `NEXT_PUBLIC_APP_URL` trong `.env.local` (hoặc môi trường deploy), không lấy địa chỉ trình duyệt và không tự fallback về localhost. Ô **Địa chỉ website** chỉ đọc. Mã QR, PNG tải xuống, bản in, liên kết sao chép và **Mở trang chơi** đều dùng origin của địa chỉ cấu hình này. Thiếu cấu hình hoặc URL không hợp lệ thì không tạo/xuất QR. Sau khi đổi biến môi trường, khởi động lại dev server; production cần build và deploy lại vì biến `NEXT_PUBLIC_` được nhúng lúc build. QR đã tải/in trước đó vẫn chứa địa chỉ cũ; cần tải/in lại sau khi đổi tên miền.

Camera cần HTTPS, ngoại trừ localhost trên chính thiết bị chạy trình duyệt. `http://192.168.x.x:3001` không phải secure context thông thường. Dùng tên miền HTTPS truy cập được trên điện thoại khi in QR; localhost của máy tính không dùng được từ điện thoại. Nếu camera bị từ chối hoặc không có camera, người chơi có thể chọn ảnh QR hoặc dán liên kết/ID. Camera được dừng khi quét thành công, bấm dừng, rời trang hoặc ẩn tab.

Tham khảo: [getUserMedia và secure context](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [jsQR](https://github.com/cozmo/jsQR).

## Dữ liệu và lượt chơi

- MongoDB `characters`: `name`, `openingLine`, `backgroundImage`, `image` (ảnh nhân vật), cùng ID và thời điểm tạo/sửa. Ảnh tải lên được tối ưu WebP trên R2; MongoDB lưu URL. Xem [cấu hình ảnh R2](r2-images.md). Danh sách có tìm kiếm và phân trang 12 mục. Hồ sơ cũ dùng nền mặc định nếu thiếu; giữ nguyên ObjectId nên QR đã in vẫn hoạt động.
- Ảnh nền phủ toàn màn chơi, ảnh nhân vật chuyển động nhẹ và có hiệu ứng khi trả lời đúng. Câu hỏi nằm trong ô thoại, bốn lựa chọn A–D bên dưới. Có nút tắt chuyển động và hỗ trợ `prefers-reduced-motion`. Ảnh và lời mở đầu cũng xuất hiện trên thẻ in QR. File PNG tải xuống vẫn là mã QR thuần, không phụ thuộc CORS ảnh.
- Câu hỏi dùng cơ chế shuffle bag theo từng trình duyệt/nhân vật: rút câu chưa gặp, hết kho mới bắt đầu vòng mới và tránh lặp ngay câu cuối khi có ít nhất hai câu. `question_cycles` giữ lịch sử tối đa 30 ngày từ lượt gần nhất; cập nhật theo version để các tab đồng thời không rút cùng vị trí. Danh sách luôn kiểm tra lại câu mới thêm, câu bị xóa/chuyển nhân vật. Đổi thiết bị/xóa cookie có lịch sử riêng; kho một câu bắt buộc lặp lại câu đó.
- Không đưa đáp án đúng/lời giải vào payload trước khi chốt. Collection `quiz_attempts` giữ snapshot câu hỏi, `sourceQuestionId`, đáp án, người chơi ẩn danh (hash cookie), lựa chọn đầu tiên, hết hạn sau 20 phút; TTL dọn tự động. Cookie HttpOnly, SameSite Lax, Secure ở production, thời hạn 30 ngày. Không cần và không sử dụng phiên đăng nhập người dùng.
- Chốt đáp án atomic trên server, ràng buộc người chơi và hạn sử dụng. Gửi lại chỉ nhận kết quả của lựa chọn đầu tiên. Request ID chống tạo trùng cùng lượt; UI chống gọi đôi do Strict Mode.
- Collection `quiz_limits` giới hạn 10 lần tạo/phút/phiên và 120 lần/phút toàn hệ thống, kể cả khi tạo thất bại. Đây là giới hạn cơ bản cho tính năng công khai; production đông người cần chọn quota theo ngân sách thực tế.


## Kiểm tra

`node tests/character-management.browser.mjs` kiểm tra riêng các màn danh sách/tạo mới/chi tiết/chỉnh sửa, hủy thao tác, xác nhận xóa, upload R2, xuất QR, tìm kiếm và mobile. Cần Edge, MongoDB, R2 và dev server; dữ liệu và ảnh thử được dọn theo marker, không gửi email.

`node --test tests/history-game.test.mjs` kiểm tra validation, dữ liệu QR, phân quyền, đáp án không lộ, lượt chốt một lần, timeout/phiên và giới hạn tạo câu hỏi.

`node tests/history-game.browser.mjs` cần dev server cổng 3001, Edge, MongoDB và R2. Tạo/xóa duy nhất nhân vật và câu hỏi thử có marker riêng; kiểm tra quản lý nhân vật, xuất QR, quét ảnh, camera mô phỏng và câu hỏi đã lưu. Không gửi email.


`node --test tests/character-scene.test.mjs` kiểm tra chu kỳ câu hỏi và cập nhật song song. Với dev server ở cổng 3001, chạy `node tests/character-scene.browser.mjs` để kiểm tra desktop/mobile, lịch sử qua tải lại, quét lại QR, đổi nhân vật và animation; dữ liệu thử được tự dọn.

## Bong bóng trò chuyện nhân vật

Màn câu hỏi giữ bong bóng trò chuyện ở góc dưới, mặc định đóng. Khi mở, hiển thị ảnh, tên và câu nói mở đầu của nhân vật. Đây chỉ là giao diện chờ kết nối model riêng: ô nhập và nút gửi tạm khóa, không gửi request, không tạo phản hồi giả và không lưu hội thoại. Không có SDK, API, dữ liệu PDF hay biến môi trường Gemini. Khi có hợp đồng API mới, tích hợp qua lớp action/service theo kiến trúc dự án; hiện chưa giả định định dạng input.
