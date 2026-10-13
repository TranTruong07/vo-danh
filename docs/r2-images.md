# Ảnh nhân vật trên Cloudflare R2

Vào `/admin/characters`, tạo hoặc chỉnh sửa nhân vật. Chọn **Ảnh nền — tải lên R2** và **Ảnh nhân vật — tải lên R2**, điền tên/câu nói mở đầu rồi bấm **Lưu nhân vật**. Mỗi ảnh có URL và xem trước riêng; chọn file được ưu tiên hơn URL.

- Nhận ảnh tĩnh PNG/JPEG/WebP, tối đa 3 MB và 20 triệu điểm ảnh. Server giải mã ảnh, loại metadata, tự xoay, thu nhỏ tối đa 1600×1600 và xuất WebP.
- Browser gửi form cùng origin tới Server Action có kiểm tra quyền admin. Server upload bằng AWS SDK tới `images/characters/<uuid>.webp`. MongoDB chỉ lưu URL công khai, không lưu base64 cho ảnh mới.
- Không cần CORS PUT trên R2 vì browser không upload trực tiếp tới R2; không bị ràng buộc riêng cổng 3001 của cấu hình CORS cũ. Next.js vẫn kiểm tra same-origin cho Server Actions.
- `next.config.ts`: giới hạn body 7 MB để chứa hai ảnh tối đa 3 MB mỗi ảnh, nội dung hồ sơ và multipart overhead. UI và server đều kiểm tra giới hạn từng file.
- Chỉ upload khi hồ sơ đã hợp lệ. Nếu ảnh thứ hai upload lỗi hoặc MongoDB lưu thất bại, hệ thống kiểm tra object mới chưa được tham chiếu ở cả trường ảnh nhân vật và ảnh nền rồi dọn. Nếu không xác nhận được trạng thái MongoDB, giữ object để tránh xóa ảnh có thể đã được lưu.
- Khi chỉnh sửa mà không chọn ảnh mới, giữ URL hiện tại. Ảnh base64 từ phiên bản cũ vẫn hiển thị; lần lưu tiếp theo sẽ chuyển ảnh đó lên R2. URL ảnh HTTPS nhập thủ công vẫn được hỗ trợ.
- Ảnh đã lưu không tự xóa khi đổi/xóa nhân vật, để không làm hỏng URL đang được dùng lại ở hồ sơ khác. Dọn ảnh không sử dụng theo quy trình riêng khi cần.

## Cấu hình

Điền `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` trong `.env.local`. API token cần quyền ghi object đúng bucket; quyền xóa cần cho thao tác rollback. `R2_PUBLIC_BASE_URL` là HTTPS public bucket URL hoặc custom domain, không phải S3 API endpoint. Bật public access/custom domain để người chơi xem ảnh.

Không cần `AUTH_SECRET` hay presigned upload token cho ảnh. Module quản lý video, player, multipart upload và route `/admin/videos` đã được gỡ; thao tác này không xóa các object cũ trên bucket.

Tham khảo: [Cloudflare R2 AWS SDK v3](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/), [Sharp](https://sharp.pixelplumbing.com/api-constructor/).

## Kiểm tra

`node --test tests/character-images.test.mjs tests/history-game.test.mjs tests/auth.test.mjs`

`node tests/history-game.browser.mjs`: dùng admin, MongoDB và R2 thật. Xác nhận ảnh mới được lưu thành URL, đọc public ảnh thành công, QR và câu hỏi vẫn hoạt động. Cleanup chỉ xóa ảnh R2 và nhân vật được tạo bởi chính bài kiểm tra.
