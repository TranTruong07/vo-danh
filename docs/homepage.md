# Dấu Chân Sử Ký — Homepage

- `/`: giới thiệu tổ chức, câu hỏi nhân vật, QR, board game và liên hệ.
- `/shop`: sản phẩm, câu hỏi thường gặp và hộp đặt mua minh họa.
- `/qr`: chuyển hướng đến `/play` để quét thẻ nhân vật. Quản lý/tạo mã QR tại `/admin/characters`.

Giá 349.000 ₫, địa chỉ `hello@dauchansuky.example` và số `09xx xxx xxx` là dữ liệu mẫu theo yêu cầu. Hộp đặt mua không tạo đơn, thu thập thông tin hay thực hiện thanh toán.

Cấu hình thông tin thật bằng các biến môi trường sau, sau đó build lại:

```dotenv
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_CONTACT_PHONE=
NEXT_PUBLIC_PURCHASE_URL=
```

Đường dẫn đặt mua chỉ nhận HTTPS. Khi được cấu hình, nút mua chuyển đến kênh này. Thông tin mẫu sản phẩm được khai báo trong `lib/demo-product.ts`.

## Hình minh họa

Tạo bằng công cụ imagegen tích hợp; không phải ảnh sản phẩm thực tế. Bản gốc: `public/images/history-landscape.png`; bản WebP dùng trên website: `public/images/history-landscape.webp` (1536 × 1024, khoảng 595 KB).

Prompt đã dùng:

> Use case: illustration-story. Asset type: landscape hero illustration for Vietnamese history educational board game website Dấu Chân Sử Ký. Create a beautiful panoramic vintage Vietnamese woodblock engraving, entirely in deep vermilion red, burgundy, warm parchment cream and muted golden ochre. A winding cream-colored river/path from lower center toward distant layered mountains, a traditional Vietnamese temple gate/pavilion prominently on the right cliff, pine trees and intricate engraved mountains, swirling traditional clouds, small round gold sun in upper right. Premium intricate hand-carved etched texture, Đông Hồ print inspiration, vintage book cover feeling. Wide landscape 3:2 composition, the left half also illustrated but less detailed, no letters no words no typography no border no watermark. Rich dark red sky with cream clouds, cream mountains with red hatching. This will sit in the right side of a warm cream homepage next to a large red headline.

## Kiểm tra

`npm run build`, `npx tsc --noEmit`; chạy ESLint trên các tệp thay đổi.

Kiểm tra Home/Shop ở desktop và mobile, điều hướng quét thẻ và các ảnh minh họa.
