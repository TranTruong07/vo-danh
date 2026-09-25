Quy định kiến trúc Full-stack Serverless / Modern Monolith:
app/
components/
features/
server/
├── domain/
├── services/
├── repositories/
└── infrastructure/
lib/

Quy định rõ:

Business logic không đặt trong UI
Component không truy cập MongoDB trực tiếp
Repository chịu trách nhiệm data access
Service chịu business logic
Server Component/Server Action/Route Handler dùng đúng mục đích
Không tạo API layer trung gian nếu không cần thiết

→ Activation: Always On