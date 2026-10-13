# Dashboard quản trị

`/admin` dùng giao diện sáng với sidebar cố định trên desktop và menu dạng drawer trên điện thoại. Sidebar có Tổng quan, Nhân vật & QR, liên kết quét mã và về website. Đơn hàng, Sản phẩm, Khách hàng được ghi rõ **Sắp có**; chưa triển khai nghiệp vụ bán hàng.

Số liệu hiện tại lấy từ MongoDB: tổng nhân vật và mã QR sẵn sàng, tổng tài khoản người dùng (không tính admin), đăng ký theo ngày trong 7 hoặc 30 ngày và 5 hồ sơ nhân vật cập nhật gần đây. Mọi nhân vật tự có QR sau khi tạo, không còn trạng thái bản nháp/tạm ẩn. Mốc ngày dùng UTC+7. Không dùng collection lượt chơi có TTL để giả lập thống kê lịch sử.

Doanh thu/đơn hàng hiện dấu `—` và thông báo chưa kết nối dữ liệu. Không có doanh thu minh họa. Khi bổ sung bán hàng, cần model đơn hàng/sản phẩm và truy vấn riêng tại repository, rồi bổ sung metric vào service dashboard.

`server/repositories/dashboard.ts` truy vấn dữ liệu; `server/services/dashboard.ts` kiểm tra quyền admin, chuẩn hóa chuỗi ngày; `features/admin` hiển thị layout, sidebar và biểu đồ. Trang nhân vật và các Server Action vẫn kiểm tra quyền độc lập.

Header dùng chung của Home, Shop và Chat có mục **Quét mã** đi tới `/play`, nơi người chơi mở camera hoặc chọn ảnh QR mà không cần đăng nhập.

Mục **Nhân vật & QR** mở danh sách tại `/admin/characters`, với tìm kiếm và phân trang 12 hồ sơ. Các màn riêng: `/admin/characters/new` để tạo, `/admin/characters/[id]` để xem hồ sơ và tải/in QR, `/admin/characters/[id]/edit` để chỉnh sửa. Xóa dùng hộp xác nhận; sau khi lưu chuyển tới chi tiết. Các trang và thao tác đều kiểm tra quyền admin.

Kiểm tra: `node tests/admin-dashboard.browser.mjs` (dev server cổng 3001, Edge, MongoDB); bài kiểm tra chỉ đọc dữ liệu quản trị và tạo/đóng phiên admin, không tạo đơn hàng, nhân vật hay gửi mail.
