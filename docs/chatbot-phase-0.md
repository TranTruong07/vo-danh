# Khảo sát chatbot — Phase 0

Ngày khảo sát: 14/10/2026. Phạm vi đợt này: Phase 0 và Phase 1 của `CODEX_IMPLEMENTATION_GUIDE.md`, bao gồm yêu cầu versioning tại mục 15. Chưa bật API chat, chưa công bố kiến thức.

**Cập nhật Phase 2:** backend và hai API đã triển khai; khảo sát mới đã có đủ bốn nhân vật. Xem [báo cáo Phase 2](chatbot-phase-2.md) cho mapping hiện tại, kiểm thử và nháp lời thoại revision 3. Phần khảo sát bên dưới giữ nguyên theo thời điểm Phase 0. Chưa duyệt/công bố dữ liệu hoặc nối popup.

## Kiến trúc và điểm tích hợp

- Next.js 16.3.6 App Router ở `app/`, React 19, TypeScript strict. Không có `src/`.
- UI → Server Action/Route → `server/services` → `server/repositories` → MongoDB driver 6.21. Dùng lại `lib/db/client.ts`, `MONGODB_URI`, `MONGODB_DB_NAME`.
- `server/services/admin-auth.ts` kiểm tra role từ account session server; cookie `vo_danh_session` gắn với session trong MongoDB, có kiểm tra hết hạn/authVersion/cấu hình admin. Có thể tái sử dụng cho review/publish ở giai đoạn sau.
- `features/game/character-chat.tsx` là popup đóng mặc định, input/send hiện disabled; chưa có backend. Giữ nguyên popup và trang chơi.
- Quiz, ngân hàng câu hỏi ABCD, TTS/R2, PWA, tài khoản và đơn hàng là các luồng hiện hữu độc lập. Không dùng ngân hàng quiz làm nguồn tri thức chat.
- Test hiện dùng `node:test` + loader TypeScript; tiếp tục convention này, không cài Vitest/Jest. Chưa cần Fuse.js/Zod trước Phase 2; validator offline dùng kiểm tra TypeScript theo convention hiện tại.

## Luồng QR và ranh giới tin cậy

```text
QR từ NEXT_PUBLIC_APP_URL/play/<Mongo ObjectId>
  → app/play/[id]/page.tsx → findCharacter(id) → publicCharacter
  → GamePlayer / QuestionRound
  → startQuizAction(character.id, UUID request)
  → playerSession(true): cookie history_player ngẫu nhiên, HttpOnly
  → quiz_attempts { _id: UUID, ownerHash, characterId, expiresAt: +20 phút }
  → PublicQuestion.id = quiz_attempts._id

Đề xuất Phase 2:
popup → {sessionId: PublicQuestion.id, message/questionId}
  → playerSession(false) → getQuiz(sessionId, ownerHash)
  → kiểm tra state, expiresAt, nhân vật còn tồn tại
  → adapter ObjectId → một trong 4 ID knowledge
  → publishedVersionId → revision approved → đúng characterAnswers
```

QR công khai chỉ là lựa chọn nhân vật, không chứng minh người dùng thực sự quét thẻ và không chống đổi URL. UUID do client tạo cũng không tự có giá trị xác thực. Ràng buộc đáng tin là bản ghi server có `ownerHash` khớp cookie và chưa hết hạn. Đề xuất tái sử dụng ràng buộc này cho chat; không tin `characterId` gửi trong payload. Cookie một mình không chứa nhân vật.

Chat có thể hoạt động cả trước/sau chốt đáp án, không đọc/sửa đáp án, điểm hay `selectedIndex`. Khi quét lại, trang keyed theo id + round, tạo lượt mới và reset chat. Phiên hết hạn cần quét lại. Offline dùng local question ID nên không giả làm phiên server; Phase 3 cần thông báo chat cần mạng, giữ quiz/PWA/TTS offline hoạt động. Nếu sau này cần chat độc lập với lượt quiz thì thiết kế riêng session server, không âm thầm mở rộng phạm vi này.

## Mapping nhân vật thực tế

Khảo sát MongoDB chỉ đọc `_id`, `name`; không sửa dữ liệu hoặc tạo indexes:

| ID knowledge | ID hiện có | Trạng thái |
| --- | --- | --- |
| vo-nguyen-giap | 6ac8e47d0ddc4ea27b45f7d4 | Tên DB: Võ Nguyên Giáp |
| truong-chinh | chưa có | Cần admin tạo và xác nhận mapping |
| le-duan | chưa có | Cần admin tạo và xác nhận mapping |
| pham-van-dong | chưa có | Cần admin tạo và xác nhận mapping |

Phase 2 dùng mapping server-side explicit; không suy đoán theo tên có thể sửa, không đổi ObjectId cũ. Các nhân vật khác ngoài mapping không được tự có persona chat.

## Nguồn và nội dung cần người duyệt

Đã đọc toàn bộ guide (mục 0–15) và nguồn `docs/source/Tong-hop-kien-thuc.docx`: 10 mục I–X, 1 bảng tổng hợp. Bản gốc có mô tả về Lê Duẩn ở V.2/V.5 và đính chính sau bảng cùng điểm IX.4; giữ toàn bộ, đưa vào báo cáo cảnh báo để admin đối chiếu, không sửa bằng nguồn ngoài.

Cần duyệt thủ công: canonicalQuestion, tất cả aliases, đáp án trung tính, bốn lời đáp mô phỏng, nguồn và các mốc ngày; đặc biệt Lê Duẩn, ban bố/đọc Quân lệnh số 1, 19/8–23/8–25/8–2/9, nguyên nhân chủ quan/khách quan và vai trò tập thể. Kiểm tra máy chỉ kiểm tra cấu trúc/nguồn, không phải phê duyệt lịch sử.

## Checklist triển khai

- [x] Phase 0: khảo sát, sơ đồ phiên/QR, mapping, nguồn, kiểm tra baseline.
- [x] Phase 1: extract cả bảng đúng thứ tự, manifest có hash/locator, 40 Q&A draft đủ I–X, validator và báo cáo review, import dry-run bảo vệ revisions. Xem `docs/knowledge-pipeline.md`.
- [x] Phase 2 backend exact/fuzzy, chỉ approved + published; rate limit MongoDB collection riêng. Dữ liệu lịch sử vẫn chờ duyệt; xem báo cáo Phase 2.
- [ ] Phase 3: nối popup hiện có, suggestions/nguồn/refusal; không can thiệp quiz.
- [ ] Phase 4: kiểm thử runtime, auth review/publish/audit và triển khai. Không coi chatbot hoàn tất trước khi bộ Q&A được người dùng duyệt.

Import chỉ tạo draft revision; `approved` không đồng nghĩa published. Không chạy `--apply`, approve hoặc publish trong đợt này. Không tự tạo ba nhân vật còn thiếu.

## Baseline trước khi triển khai

- `npx tsc --noEmit`: đạt.
- `node --test` trên 11 file `*.test.mjs`: 54/59 đạt. Năm lỗi đã tồn tại trong `tests/auth.test.mjs`, loader tìm sai đường dẫn `server/services/character.ts` khi đi qua dependency TTS. Không sửa luồng auth trong phạm vi chatbot.
- `npm run lint`: 5 lỗi `no-assign-module-variable` trong loader của các test auth-independent hiện hữu (`character-images`, `character-questions`, `history-game`, `orders`, `support/load-typescript`), 1 cảnh báo img trong `app/author/page.tsx`.
- Node máy hiện tại 20.13.1; dependencies TTS hiện hữu yêu cầu Node >=22. Ghi nhận cho deploy, chưa thay runtime hoặc package TTS.
- Repo có thay đổi TTS chưa commit trước tác vụ này; giữ nguyên.

Các lỗi baseline được lưu để so sánh sau Phase 1. Kết quả riêng pipeline phải đạt; không tuyên bố toàn bộ repo xanh nếu baseline vẫn lỗi.
