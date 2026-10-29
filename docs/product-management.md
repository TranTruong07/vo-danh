# Quản trị sản phẩm

## Cách sử dụng

Đăng nhập tài khoản admin, chọn **Sản phẩm** ở thanh bên hoặc mở `/admin/products`.

1. Điền tên, giá bán, tiêu đề giới thiệu, mô tả ngắn và các đặc điểm nổi bật.
2. Chọn ảnh chính và tối đa 5 ảnh phụ. Hỗ trợ JPEG, PNG, WebP, tối đa 3 MB/ảnh. Mỗi ảnh phụ có mô tả riêng tối đa 500 ký tự. Có thể đổi thứ tự và bỏ ảnh phụ khỏi sản phẩm; mô tả luôn đi cùng ảnh.
3. Điền mô tả chi tiết, số người chơi, độ tuổi, thời gian chơi và thành phần bộ game nếu có.
4. Bấm **Lưu sản phẩm**, sau đó **Xem trên home** để kiểm tra.

Ảnh được xử lý bằng bộ giải mã ảnh hiện có, chuyển WebP và lưu vào R2 dưới `images/products/<uuid>.webp`. Chỉ lưu sản phẩm sau khi các ảnh cần dùng đã tải thành công. Cấu hình R2 hiện có được tái sử dụng, không thêm biến môi trường.

## Phạm vi và lưu trữ

- Quản lý một sản phẩm boardgame hiện có, không bổ sung giỏ hàng hay hệ thống nhiều sản phẩm.
- Dùng collection `settings`, document `_id: "shop"`: thêm trường `product`; giá vẫn là `productPrice`. Nội dung và giá được cập nhật nguyên tử trong một document.
- Cấu hình cũ chỉ có giá vẫn dùng được, nội dung mặc định được bổ sung khi đọc; không cần migration hoặc ghi dữ liệu tự động.
- Home đọc tên, tiêu đề, mô tả, đặc điểm, ảnh chính và giá từ cấu hình này. `/shop` cũng đọc cùng dữ liệu, thêm số người chơi, độ tuổi, thời gian chơi, mô tả chi tiết và thành phần bộ game. Trường chi tiết để trống sẽ ẩn.
- `/shop` chỉ hiển thị ảnh chính lúc đầu. Bấm ảnh chính mở khung xem ảnh: ảnh lớn, tối đa 5 thẻ ảnh phụ có mô tả, ảnh nhỏ để chọn và nút trước/sau. Hỗ trợ phím mũi tên, Escape, nút đóng và trả focus về ảnh chính. Các phần tiêu đề trang, FAQ, header/footer và luồng mua hàng được giữ lại.
- `product.gallery` hiện lưu `{ url, description }[]`. Catalog tự chuyển mảng URL cũ thành ảnh có mô tả rỗng khi đọc, không ghi migration. Nếu dữ liệu cũ có 6 ảnh, admin vẫn thấy đủ 6 và được yêu cầu bỏ bớt trước khi lưu; shop chỉ hiển thị tối đa 5 ảnh. Không tự xóa ảnh hoặc dữ liệu cũ.
- Checkout tiếp tục dùng catalog hiện có. Đơn hàng mới lấy giá/tên hiện tại; đơn hàng đã tạo giữ nguyên snapshot và logic kiểm tra giá cũ.
- Màn Thiết lập vẫn cập nhật được cùng giá bán; cập nhật riêng giá không xóa nội dung hoặc ảnh sản phẩm.
- Đọc và ghi màn quản trị, kể cả tải ảnh, đều kiểm tra quyền admin ở service. URL ảnh khi lưu chỉ chấp nhận đường dẫn sản phẩm từ R2 đã cấu hình hoặc ảnh mặc định nội bộ.
- Bỏ/thay ảnh chỉ thay tham chiếu trong sản phẩm, không xóa object R2 đang có để tránh hỏng cache/bản lưu cũ. Ảnh đã upload nhưng chưa lưu sản phẩm có thể tồn tại trên R2; chưa có tác vụ dọn ảnh không sử dụng.

## PWA

Offline pack bổ sung trường `product` tùy chọn, giữ schema 1 và tương thích pack cũ. Hash phiên bản thay đổi khi nội dung/giá sản phẩm thay đổi. Service worker lưu ảnh chính và snapshot sản phẩm cho home offline; nếu tải ảnh sản phẩm thất bại, dùng ảnh mặc định, không làm thất bại việc chuẩn bị quiz offline.

Sau khi admin lưu, thiết bị cần có mạng và đồng bộ lại trước khi thấy phiên bản mới ở chế độ offline. Chức năng mua hàng vẫn cần mạng. Quiz, audio, QR và cơ chế chấm đáp án không thay đổi.

Đồng thời sửa đường dẫn logo trong manifest PWA từ JPG cũ sang PNG hiện được SiteLogo sử dụng, tránh lỗi postbuild do file JPG đã được thay thế.

## File triển khai

- `app/admin/products/page.tsx`, `features/products/product-editor.tsx`, `features/products/products.css`: màn quản trị.
- `actions/products.ts`, `server/services/products.ts`, `server/domain/product.ts`: action, quyền, validation và upload.
- `server/models/settings.ts`, `server/repositories/settings.ts`, `server/repositories/images.ts`, `server/services/catalog.ts`: lưu cấu hình và ảnh, tái sử dụng catalog/giá.
- `features/admin/admin-frame.tsx`, `features/admin/settings-panel.tsx`, `actions/settings.ts`: điều hướng và đồng bộ cấu hình giá.
- `features/products/home-product.tsx`, `components/heritage/site.tsx`, `app/heritage.css`: phần sản phẩm trên home.
- `features/products/shop-product.tsx`, `features/products/product-gallery.tsx`, `features/products/shop-product.css`: dữ liệu shop và khung xem ảnh khi bấm ảnh chính.
- `server/domain/offline-game.ts`, `server/services/offline-game.ts`, `public/sw.js`, `scripts/pwa-assets.mjs`: dữ liệu và tài nguyên offline.
- `tests/products.test.mjs`, `tests/pwa.test.mjs`, `tests/quiz-audio-playback.test.mjs`: kiểm thử và mock catalog.

## Kết quả kiểm tra

- 23/23 tests đạt: products, settings, PWA, quiz audio playback; gồm tương thích gallery cũ, giới hạn 5 ảnh, kiểm tra mô tả và URL ảnh phụ. Lệnh: `node --test --test-isolation=none tests/products.test.mjs tests/settings.test.mjs tests/pwa.test.mjs tests/quiz-audio-playback.test.mjs`.
- TypeScript và ESLint phạm vi thay đổi đạt.
- Production build trong bản sao cô lập đạt, gồm bước tạo manifest PWA (101 tài nguyên sau khi bổ sung trang shop).
- Chrome desktop 1440×900 và mobile 390×844: form thực với action giả lập; kiểm tra tải ảnh chính/phụ, đổi thứ tự, bỏ ảnh, dữ liệu lưu, trạng thái chờ/lỗi, font admin và không tràn ngang. Báo cáo: `.local/product-editor/report.json`; ảnh `admin-1440.png`, `admin-390.png` cùng thư mục.
- Lượt kiểm thử shop bổ sung: form admin lưu mô tả và giữ mô tả theo ảnh sau khi đổi thứ tự/bỏ ảnh; shop 1440×900, 390×844, 375×667 đều đạt. Kiểm tra ảnh phụ ẩn trước khi bấm ảnh chính, 5 thẻ ảnh/mô tả, chọn ảnh nhỏ, phím mũi tên, Escape/nút đóng, khôi phục cuộn/focus, không tràn ngang và không có ảnh phụ. Dùng dữ liệu fixture trong bản sao Next.js, không gọi database hoặc R2. Báo cáo `.local/shop-product/report.json`; ảnh `gallery-<width>.png` và `shop-<width>.png` cùng thư mục.
- Build production + service worker thực, CacheStorage được nạp dữ liệu sản phẩm fixture: home offline hiển thị đúng tên/giá/ảnh; logo, font và slideshow vẫn hoạt động ở 1440×900, 390×844, 375×667. Ảnh kiểm chứng: `.local/home-branding/product-offline-<width>.png`.
- Không kết nối MongoDB thật, không upload R2 thật, không deploy. Browser test dùng action mock và cache fixture nên chưa thay thế kiểm tra upload/lưu với thông tin xác thực R2/MongoDB thật.

## Quay lại phiên bản trước

Hoàn tác các thay đổi code sản phẩm nêu trên bằng diff riêng của tính năng, giữ các thay đổi logo/font và dữ liệu người dùng. Trường `settings.product` là tùy chọn; code catalog cũ vẫn đọc được `productPrice`. Không cần xóa document, order hoặc ảnh R2 để rollback. Build lại manifest PWA khi phát hành phiên bản được duyệt.
