# Mua ngay, đơn hàng và payOS

## Cấu hình

Thêm vào `.env.local` rồi khởi động lại máy chủ:

```dotenv
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
APP_URL=https://your-domain.example
```

Giá bán được quản lý tại `/admin/settings` (Admin → Thiết lập → Cửa hàng) và lưu trong collection `settings`, document `_id: shop`. Giá là số nguyên VND từ 1.000 đến 100.000.000; tổng thanh toán bằng đơn giá nhân số lượng. Chỉ admin được sửa giá. Khi chưa lưu giá, checkout báo cửa hàng đang cập nhật. Khi chưa có đủ ba khóa payOS, COD vẫn dùng được và phương thức online được ghi rõ đang thiết lập.

Trong kênh thanh toán payOS, đăng ký webhook công khai HTTPS: `https://your-domain.example/api/payos/webhook`. Localhost không nhận được webhook từ Internet; khi thử kết nối thật cần domain HTTPS/tunnel trỏ đến máy chủ. Return URL và cancel URL đều quay về chi tiết đơn. Không dùng tham số URL để xác nhận thanh toán.

SDK chính thức: https://payos.vn/docs/sdks/back-end/node/
API và quy tắc chữ ký: https://payos.vn/docs/api/

## Luồng khách hàng

- Nút Mua ngay trên home/shop → `/checkout`. Khách chưa đăng nhập được đưa về popup đăng nhập ở home, rồi tự quay lại checkout sau đăng nhập/đăng ký.
- Email lấy từ phiên đăng nhập, không thể sửa thành email tài khoản khác. Nhập họ tên, số điện thoại Việt Nam, địa chỉ, ghi chú, số lượng 1–10 và phương thức thanh toán.
- Tính giá trên máy chủ; lưu ảnh chụp tên sản phẩm/đơn giá/tổng thanh toán trong đơn để thay đổi cấu hình sau này không ảnh hưởng đơn cũ.
- `/orders`: lịch sử mua hàng có phân trang. `/orders/[id]`: chi tiết, QR payOS và kiểm tra thanh toán. Mỗi tài khoản chỉ xem được đơn của mình.
- Khóa yêu cầu duy nhất theo tài khoản giúp gửi lại cùng checkout không tạo thêm đơn. Đơn được lưu trước khi gọi payOS; lỗi tạo QR có nút thử lại và dùng lại cùng mã đơn.

## Trạng thái

| Giá trị | Hiển thị | Chuyển tiếp hợp lệ |
| --- | --- | --- |
| `pending` | Chờ thanh toán online | Máy chủ xác nhận đủ tiền từ payOS → `paid` |
| `unpaid` | Chưa thanh toán | Đơn COD mới; admin → `completed` |
| `paid` | Đã thanh toán | payOS xác nhận; admin → `completed` |
| `completed` | Hoàn tất | Không cho thay đổi tiếp |

`pending` là trạng thái chờ riêng để không cho admin hoàn tất một đơn online chưa nhận tiền. Admin không có API sửa trạng thái tùy ý, không thể tự đánh dấu đã thanh toán. Hoàn tất COD là xác nhận đơn đã xử lý/giao xong và thu tiền; có hộp thoại xác nhận. Lưu thời điểm và tài khoản admin thực hiện.

Webhook xác thực chữ ký bằng SDK, đối chiếu mã đơn/link/số tiền với dữ liệu payOS phía máy chủ. Chỉ `PAID` + đã thu đủ tiền + số dư bằng 0 mới xác nhận. Chuyển thiếu tiền không đánh dấu đã trả. Lặp webhook không cập nhật lùi trạng thái đơn đã hoàn tất. Giao dịch không khớp hoặc webhook giả không được chấp nhận. Lỗi tạm thời khi xác minh với nhà cung cấp trả 503 để có thể thử lại.

QR ở chi tiết đơn được kiểm tra định kỳ 15 giây khi trang đang mở; máy chủ giới hạn kiểm tra một lần mỗi 10 giây/đơn. Liên kết đã hủy/hết hạn được ghi rõ, không coi là đã trả. Webhook vẫn hoạt động khi khách đóng trình duyệt.

## Quản trị và Excel

`/admin/orders`: tổng đơn, doanh thu đã xác nhận, số đơn chờ xử lý; lọc theo trạng thái, tìm theo mã đơn/tên/email/điện thoại, phân trang 15 đơn. Chi tiết gồm thông tin nhận hàng, đơn giá/số lượng/tổng tiền, phương thức, thời điểm và nút hoàn tất khi hợp lệ.

`/admin/orders/export`: tệp `.xlsx` có tất cả đơn theo bộ lọc hiện tại. Kiểm tra quyền admin trên route và service, no-store. Email/điện thoại/mã đơn/ghi chú là ô văn bản; chuỗi bắt đầu bằng `=` không được diễn giải thành công thức. Cột số tiền là số VND, thời gian hiển thị GMT+7.

Thống kê doanh thu gồm online đã thanh toán (kể cả hoàn tất) và COD đã hoàn tất, dựa trên tổng tiền lưu trong đơn. COD chưa xử lý và online chờ thanh toán không tính doanh thu.

Collection `orders` có unique index `orderCode`, `(userId, requestKey)`, cùng index lọc trạng thái và lịch sử tài khoản. Hoàn tất và ghi nhận thanh toán dùng cập nhật có điều kiện nguyên tử để tránh đua trạng thái.

## Kiểm thử

```powershell
rtk proxy node --test tests/orders.test.mjs
rtk proxy node tests/orders-dev.mjs
# Chạy ở terminal khác khi test server đã sẵn sàng:
rtk proxy node tests/orders.browser.mjs
```

Test server dùng localhost:3012 và database riêng có hậu tố `_orders_test`, giá mẫu 349000 lưu trong collection `settings`, ba khóa payOS giả, nhà cung cấp mô phỏng localhost:3099. Không sửa `.env.local`, không gọi ngân hàng, không tạo giao dịch thật. Cần dừng next dev hiện tại trước vì Next chỉ cho một dev server cho thư mục dự án. Browser test tự tạo rồi xóa tài khoản/đơn thử riêng; admin dùng cấu hình sẵn có. Khi xong dừng test server và chạy lại `rtk npm run dev` để sử dụng cấu hình thật.

## Thiết lập và chẩn đoán payOS

`/admin/settings` có hai nhóm Cửa hàng và Thanh toán, có thể bổ sung thêm nhóm sau này. Đổi giá làm mới Home, Shop và Checkout; đơn hàng đã tạo giữ nguyên đơn giá và tổng tiền. Nếu khách đang mở checkout với giá cũ, hệ thống yêu cầu tải lại để xác nhận giá mới trước khi tạo đơn. Trình duyệt không được tự quyết định giá. Giá không còn lấy từ biến môi trường. Script `scripts/migrate-shop-price.mjs` dùng một lần để chuyển giá cũ sang MongoDB, xác minh bản ghi rồi mới xóa biến giá khỏi `.env.local`; không ghi đè giá đã có trong thiết lập.

Nút kiểm tra payOS chỉ gọi GET thông tin thanh toán. Nếu có đơn đã tạo link, dùng mã đó để SDK xác minh cả chữ ký phản hồi. Nếu chưa có, dùng mã kiểm tra; phản hồi 101 (mã không tồn tại) chỉ cho biết API phản hồi, không chứng minh Checksum Key, webhook hoặc nhận tiền đầu cuối. Không tạo/hủy link và không thay đổi trạng thái đơn. Khóa luôn nằm ở máy chủ, UI chỉ hiện đã/chưa cấu hình. Cần APP_URL HTTPS công khai và đăng ký webhook trong payOS; localhost không nhận được webhook từ Internet.

Kiểm thử: `node --test tests/settings.test.mjs tests/orders.test.mjs`; `node tests/settings.browser.mjs` kiểm tra màn admin trên localhost:3001, lưu lại cùng giá hiện có và gọi GET chẩn đoán.
