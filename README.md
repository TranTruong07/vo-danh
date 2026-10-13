Quản lý nhân vật và QR: truy cập `/admin/characters`. Ảnh tải lên được tối ưu và lưu trên Cloudflare R2: [docs/r2-images.md](docs/r2-images.md). Luồng chơi: [docs/history-game.md](docs/history-game.md).

my-app/
├─ app/                          # App Router — nơi định nghĩa route + UI
│  ├─ layout.tsx                 # Root layout (bắt buộc, bọc toàn bộ app)
│  ├─ page.tsx                   # Trang chủ  →  route  /
│  ├─ globals.css                # CSS toàn cục (import trong root layout)
│  ├─ error.tsx                  # Error boundary cho toàn bộ nhánh bên dưới
│  ├─ not-found.tsx              # UI 404
│  │
│  ├─ (shop)/                    # Route group — KHÔNG xuất hiện trong URL
│  │  ├─ layout.tsx              # Layout riêng cho nhóm bán hàng
│  │  ├─ products/
│  │  │  ├─ page.tsx             #  →  /products
│  │  │  ├─ loading.tsx          # Skeleton khi chờ dữ liệu
│  │  │  └─ [id]/
│  │  │     ├─ page.tsx          #  →  /products/123
│  │  │     └─ not-found.tsx     # 404 riêng cho sản phẩm không tồn tại
│  │  └─ cart/
│  │     └─ page.tsx             #  →  /cart
│  │
│  ├─ (auth)/                    # Nhóm route không cần layout bán hàng
│  │  └─ login/
│  │     └─ page.tsx             #  →  /login
│  │
│  ├─ api/                       # Route Handlers — chỉ dùng cho webhook / API ngoài
│  │  └─ webhooks/
│  │     └─ stripe/
│  │        └─ route.ts          #  →  POST /api/webhooks/stripe
│  │
│  └─ _components/               # Private folder — KHÔNG thành route
│     ├─ product-card.tsx
│     └─ add-to-cart-button.tsx  # Client Component có "use client"
│
├─ actions/                      # Server Actions — lớp ghi dữ liệu
│  ├─ cart.ts                    # "use server" ở đầu file
│  └─ order.ts
│
├─ lib/                          # Lõi logic dùng chung, không phụ thuộc UI
│  ├─ db/
│  │  ├─ client.ts               # Khởi tạo Prisma / Drizzle / Neon client
│  │  └─ schema.ts               # Định nghĩa bảng, quan hệ
│  ├─ data/                      # Data Access Layer (đọc dữ liệu)
│  │  ├─ products.ts
│  │  └─ orders.ts
│  ├─ auth.ts                    # Kiểm tra session, quyền
│  ├─ validators/                # Zod schema dùng chung cho form + action
│  └─ utils.ts                   # Hàm thuần, format tiền, ngày…
│
├─ components/                   # UI dùng lại toàn cục, không gắn với 1 route
│  └─ ui/
│     ├─ button.tsx
│     └─ modal.tsx
│
├─ hooks/                        # Custom React hook phía client
├─ types/                        # Kiểu TypeScript dùng chung (DTO, model)
│
├─ public/                       # File tĩnh phục vụ nguyên trạng
│  ├─ favicon.ico
│  └─ images/logo.svg
│
├─ proxy.ts                      # Chạy trước mỗi request (chặn route, redirect, A/B…)
├─ next.config.ts                # Cấu hình Next.js
├─ tsconfig.json                 # TypeScript + alias "@/*"
├─ eslint.config.mjs             # Cấu hình lint
├─ package.json                  # Dependency + script
├─ .env.local                    # Biến môi trường bí mật (không commit)
└─ .gitignore
