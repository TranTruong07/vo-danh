# Tài khoản MongoDB

Home có nút **Đăng nhập** mở popup đăng nhập, đăng ký và quên mật khẩu. Đăng ký dùng email, password và confirmPassword. Email được trim/lowercase trước khi lưu; mật khẩu giữ nguyên, dài 6–32 ký tự. Kiểm tra dữ liệu ở cả giao diện và Server Action. Đăng ký xong tự đăng nhập; tài khoản thường ở lại trang hiện tại. Admin được chuyển đến `/admin` (dashboard), từ đó quản lý nhân vật và QR.

## Môi trường

- `MONGODB_URI`: chuỗi kết nối có sẵn, chỉ sử dụng trên server.
- `MONGODB_DB_NAME`: database tài khoản; local được đặt là `vo_danh`. Nếu không đặt, driver dùng database trong URI.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: tài khoản admin được quản lý bằng cấu hình server. Email này không được đăng ký công khai. Khi đăng nhập đúng hai giá trị này, ứng dụng tạo/cập nhật tài khoản admin trong MongoDB. Không có mật khẩu admin trong mã nguồn.
- `APP_URL` hoặc `NEXT_PUBLIC_APP_URL`: origin dùng xây dựng liên kết đặt lại mật khẩu. Production yêu cầu HTTPS.

Khởi động lại server sau khi đổi môi trường. Cookie admin cũ chỉ dùng mật khẩu không còn được chấp nhận.

## Model và phiên

`server/models/user.ts` định nghĩa model `UserModel`: `_id`, email, passwordHash, role (`user`/`admin`), authVersion, fullName, phone, address, avatarUrl, createdAt, updatedAt và token reset tùy chọn. Các trường hồ sơ có thể thiếu ở tài khoản cũ; service trả chuỗi rỗng và ảnh mặc định để tương thích, không cần migration. `confirmPassword` không lưu. Mật khẩu băm bằng scrypt và salt ngẫu nhiên; không lưu mật khẩu thô.

`lib/db/client.ts` dùng một pool MongoClient tái sử dụng qua hot reload. `server/repositories/users.ts` chịu trách nhiệm truy cập collection và tạo index: email unique, token reset, TTL phiên và giới hạn thử đăng nhập. `server/services` xử lý đăng nhập, phân quyền, đặt lại mật khẩu; `actions/account.ts` là biên Server Action.

Collection `auth_sessions` lưu hash của token phiên, userId, authVersion, ngày tạo/hết hạn; cookie chỉ chứa token ngẫu nhiên. Phiên sống 7 ngày, cookie HttpOnly/SameSite Lax/Secure ở production. Đăng xuất xóa phiên trên MongoDB. Reset mật khẩu tăng authVersion trong cùng thao tác atomic tiêu thụ token, nên các phiên cũ không còn hiệu lực. Quyền admin được kiểm tra trên server theo user và cấu hình hiện tại; client không tự chọn role.

Collection `auth_attempts` giới hạn thao tác theo email (hoặc hash token reset) trong cửa sổ 15 phút: tối đa 15 lần đăng nhập/đăng ký/reset, 3 yêu cầu quên mật khẩu. TTL chỉ dọn dữ liệu; logic vẫn kiểm tra expiresAt khi đọc phiên/token.

## Avatar và hồ sơ cá nhân

- Đăng ký cho phép chọn ảnh hoặc bỏ trống. Ảnh mặc định nằm ở `public/images/default-avatar.svg`, cũng được dùng cho tài khoản cũ và khi URL ảnh không tải được.
- Ảnh PNG/JPEG/WebP tối đa 3 MB được kiểm tra nội dung bằng Sharp, loại metadata, chuyển sang WebP rồi upload server-side vào `images/avatars/<uuid>.webp` trên R2. Dùng cùng cấu hình R2 với ảnh nhân vật. Không có endpoint upload ẩn danh độc lập; upload đăng ký chỉ chạy sau kiểm tra email, mật khẩu, trùng tài khoản và giới hạn số lần thử.
- Header hiển thị avatar. Menu avatar có Thông tin cá nhân, Đơn mua, Đổi mật khẩu và Đăng xuất; admin có thêm Dashboard quản trị.
- `/account`: cập nhật ảnh, họ tên (tối đa 100 ký tự), điện thoại (6–20 ký tự khi nhập), địa chỉ (tối đa 500 ký tự), hoặc trở lại ảnh mặc định. Email đăng nhập chỉ đọc. Server lấy ID từ phiên, không nhận ID/role/email/avatar URL do client tùy ý truyền lên.
- `/account/password`: kiểm tra mật khẩu hiện tại, mật khẩu mới 6–32 ký tự và xác nhận trùng khớp. Thao tác atomic đối chiếu hash/authVersion cũ, tăng authVersion và xóa token reset. Các phiên cũ mất hiệu lực, trình duyệt hiện tại nhận phiên mới. Mật khẩu admin vẫn được quản lý bằng `ADMIN_PASSWORD`.
- Cả hai màn yêu cầu đăng nhập. Mỗi loại thao tác hồ sơ/đổi mật khẩu giới hạn 15 lần trong 15 phút theo tài khoản. Luồng đi qua `actions/profile.ts` → `server/services/profile.ts` → repository.
- Khi lưu DB thất bại, chỉ xóa ảnh vừa upload nếu xác nhận không tài khoản nào đang tham chiếu. Ảnh cũ đã thay thế được giữ lại trên R2, không tự xóa trong yêu cầu cập nhật hồ sơ.

## Email quên mật khẩu

Liên kết dùng token ngẫu nhiên 32 byte, database chỉ lưu hash, hết hạn sau 30 phút và dùng một lần. Phản hồi quên mật khẩu không tiết lộ email có tài khoản hay không. Tài khoản admin cấu hình bằng môi trường đổi mật khẩu qua `ADMIN_PASSWORD`, không qua email reset.

Khi chưa có SMTP, đặt `MAIL_TRANSPORT=preview` trong môi trường development. Email được lưu dưới `.local/mail/*.json` (đã gitignore, không nằm trong public), chứa người nhận và liên kết để kiểm tra thủ công. Đây là hộp thư local, **không gửi email thật**. Không công khai thư mục này. Production không cho dùng preview.

Để gửi thật, đổi `MAIL_TRANSPORT=smtp` và cấu hình `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`. Ví dụ cổng 587 dùng `SMTP_SECURE=false` (STARTTLS); cổng 465 dùng `SMTP_SECURE=true`. Các giá trị mẫu nằm trong `.env.example`; điền thông tin nhà cung cấp mail vào `.env.local`.

## Kiểm tra

Chạy `node --test tests/auth.test.mjs tests/profile.test.mjs`, `npx tsc --noEmit`, `npm run build`. Kiểm tra đăng ký trùng email/khác hoa thường, xác nhận mật khẩu sai, ranh giới 6/32 ký tự, đăng xuất, reset hết hạn/dùng lại, quyền tài khoản thường, ảnh không hợp lệ, hồ sơ và đổi mật khẩu.

Chạy `node tests/profile.browser.mjs` với dev server cổng 3001, MongoDB và R2 đã cấu hình để kiểm tra đăng ký có/không ảnh, upload thật, hồ sơ, menu mobile, đổi mật khẩu, thu hồi phiên và tương thích tài khoản cũ. Bài kiểm tra tự dọn tài khoản, phiên và các ảnh thử do nó tạo; không gửi email. Ảnh chụp giao diện nằm trong `test-results/`.

Với dev server đang chạy tại cổng 3001 và `MAIL_TRANSPORT=preview`, chạy `node tests/auth.browser.mjs` để kiểm tra trình duyệt với MongoDB thật. Bài kiểm tra tạo email thử duy nhất, kiểm tra đăng ký/đăng nhập/reset, cookie bị thu hồi, dashboard admin và bố cục mobile; sau đó xóa tài khoản thử, phiên và email preview tương ứng. Không gửi email thật. Cần Microsoft Edge có sẵn.
