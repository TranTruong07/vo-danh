# Chơi offline (PWA)

## Cách chạy và sử dụng

Chạy `npm run build`, sau đó `npm start -- --port 3001` (dừng dev server đang dùng cùng cổng trước). Build tạo `public/pwa-assets.json` theo các file JS/CSS/font thực tế; phải deploy cả thư mục `public` và kết quả build cùng phiên bản. Nếu hệ thống deploy đang chạy trực tiếp `next build`, đổi build command thành `npm run build`.

PWA chỉ đăng ký trong production, tránh lưu các chunk HMR thay đổi liên tục của `npm run dev`. Khi sử dụng trên điện thoại hoặc domain thật cần **HTTPS**; localhost được phép để kiểm thử trên máy tính. Camera vẫn cần người dùng cấp quyền.

1. Vào Home hoặc `/play` khi có mạng. Ứng dụng tự tải bộ dữ liệu công khai gồm tất cả nhân vật, ảnh chân dung, ảnh nền, câu hỏi, bốn đáp án và hai phản hồi.
2. Thanh trạng thái chỉ xuất hiện khi offline: **Chuẩn bị chơi offline** trong lúc chưa đọc được bộ dữ liệu hoàn chỉnh; **Đang chơi offline** khi bộ dữ liệu đã sẵn sàng. Service worker chỉ công bố bộ dữ liệu sau khi tải đủ cả tài nguyên và ảnh. Đóng trang hoặc mất mạng trước khi tải đủ lần đầu có thể khiến offline chưa sử dụng được.
3. Khi mất mạng: Home, `/play`, `/play/<id>` vẫn mở/tải lại được. Home giữ nội dung bình thường, không chèn mục “Nhân vật đã lưu trên máy”. Màn quét vẫn cho phép quét camera, chọn ảnh QR, dán liên kết hoặc chọn nhân vật trong danh sách đã lưu.
4. Câu hỏi được chọn và chấm tại máy. Mỗi chu kỳ dùng hết câu hỏi trước khi lặp, tránh lặp ngay ở ranh giới chu kỳ; lịch sử lưu riêng theo nhân vật trong trình duyệt, khóa giữa các tab khi Web Locks khả dụng.
5. Khi có mạng trở lại, ứng dụng tự kiểm tra cập nhật. Cập nhật chỉ có hiệu lực sau khi tải đủ. Mất mạng/lỗi tải/hết dung lượng giữ nguyên bộ dữ liệu hoàn chỉnh trước đó.
6. Cài ứng dụng từ menu trình duyệt trên Android/máy tính; iPhone dùng Safari → Chia sẻ → Thêm vào Màn hình chính. Không bắt buộc cài mới có thể chơi offline.

## Phạm vi và dữ liệu

- `app/manifest.ts`: tên, icon, màu, chế độ standalone.
- `public/sw.js`: cache chỉ tài nguyên đã khai báo, hai shell HTML công khai `/offline-home`, `/offline`, và bộ dữ liệu đã tải. Home đã đăng nhập, nội dung quản trị, tài khoản, đơn hàng, checkout, request RSC và POST/Server Actions không được cache.
- `/api/offline/pack`: route → service → repository; hai truy vấn lấy toàn bộ nhân vật và câu hỏi, lọc câu hỏi không còn nhân vật, hash nội dung làm phiên bản. Không truy vấn tài khoản/đơn hàng.
- `features/pwa`: trạng thái kết nối, danh sách offline, chọn và chấm câu hỏi cục bộ. Giao diện nhân vật/camera dùng lại component hiện có, kể cả chunk giải mã QR tải sẵn.
- Đăng nhập, mua hàng, thanh toán và quản trị cần mạng. Các liên kết không hỗ trợ offline hiển thị thông báo thay vì chuyển tới trang lỗi.
- Bộ câu hỏi **cố ý bao gồm đáp án đúng** để thiết bị tự chấm offline. Đây là dữ liệu học tập công khai, không phù hợp giữ bí mật đáp án cho thi có thưởng. Kết quả offline không ghi thành điểm tin cậy trên server và không đồng bộ vào tài khoản.
- Chỉ dữ liệu tải thành công trước lúc mất mạng mới có thể dùng. Nhân vật mới tạo sau đó cần cập nhật khi có mạng. Nếu người dùng xóa dữ liệu trang hoặc trình duyệt thu hồi bộ nhớ thì phải tải lại. Bản dữ liệu lưu được dùng cho tới lần cập nhật hoàn chỉnh tiếp theo.
- Ảnh R2 được lưu trực tiếp bằng request không mang cookie. Ảnh khác domain dùng opaque response vì không phải bucket nào cũng bật CORS; trình duyệt vẫn hiển thị ảnh đã cache. File ảnh R2 nên có URL bất biến khi sửa ảnh (luồng upload hiện tại tạo key mới).

## Kiểm thử

`node --test tests/pwa.test.mjs tests/character-scene.test.mjs tests/history-game.test.mjs tests/character-questions.test.mjs`

`npm start -- --port 3014`, rồi `node tests/pwa.browser.mjs`: Edge headless, dữ liệu test riêng trong MongoDB và dọn sau test. Kiểm tra tải lần đầu, mất mạng giữa lượt, đúng/sai, chống lặp, tải lại Home và nhân vật, QR ảnh thật chưa từng mở, ảnh/font, QR chưa lưu, đồng bộ sau kết nối và loại trừ trang riêng tư khỏi cache. Ảnh kiểm thử được ghi vào `test-results/pwa-*.png`.

Service worker sử dụng [Cache.put](https://developer.mozilla.org/en-US/docs/Web/API/Cache/put) để lưu cả ảnh opaque; dữ liệu mới chỉ được chọn làm bản hoạt động sau khi tất cả lượt tải hoàn tất.
