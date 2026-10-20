# Phase 5E.2 — Chat History to Knowledge

Ngày: 19/10/2026. Phạm vi: code và kiểm thử trong database **vo_danh_phase5e1_test**. Không gọi Gemini live, không deploy hoặc bật production generation.

## Khảo sát và triển khai

Đã đọc guide, rules, báo cáo Phase 5E/5E.1 và live evaluation; kiểm tra service/repository/generator/admin/history và hướng dẫn Next.js 16.3.6 cài tại repository. Tái sử dụng luồng nguồn → proposal → Draft và auth/audit hiện có.

Trước phase này đã có upload/extraction/GridFS, xác nhận nguồn, Gemini generation, proposal editor, duplicate theo câu hỏi/alias, conversion transaction và history group link. Thiếu nhập thủ công, lựa chọn hai phương thức, lọc số lượt hỏi, quota UI, max-per-request, xác nhận generation phía server và đối chiếu factual core trùng.

Đã thêm:

- `/admin/chat-questions`: lọc số lượt tối thiểu/tối đa sau aggregation và trong phạm vi ngày/nhân vật; action mở hai phương thức soạn. Nhóm câu hỏi chuẩn hóa vẫn theo cơ chế cũ. Nếu admin đã liên kết nhóm tương đương, backend đọc thêm context của nhóm đó để truy vết; không tự kết luận ngữ nghĩa hoặc gộp lịch sử.
- `/admin/knowledge/manual`: tạo độc lập hoặc theo groupId; canonical, aliases có thêm/xóa/sửa, neutral, bốn persona, evidence thật và notes. Lưu proposal trước, không bypass review, không gọi AI và không tiêu hao application budget.
- Backend resolve originalQuestion và nhóm tương đương từ MongoDB, từ chối payload giả originalQuestion/status/actor. Chỉ lưu groupId/câu hỏi đã được lọc; không sao chép sessionRef, cookie, requestHash hoặc thông tin định danh người chơi.
- Proposal lưu `creationMethod`, fingerprint request và provenance; Draft nối ngược bằng importBatchId, proposal giữ draftId/revisionId. Audit lấy actor admin thực tế từ server. Lịch sử chat có TTL, provenance đã chụp vẫn còn để rà soát.
- Max-per-request cấu hình 1–5, mặc định 1; quota còn lại theo ngày UTC hiển thị cho admin. Xác nhận bắt buộc cả UI lẫn backend. Nguồn phải confirmed trước generation và manual creation, không chờ đến conversion mới kiểm tra.
- Chống double-submit UI bằng ref; requestId/fingerprint và transaction bảo vệ replay. Cùng ID khác payload bị 409. Không retry provider; giữ timeout 30 giây. Lỗi provider được lưu kèm status/errorCode và hiển thị thân thiện, phân biệt 429/503/504.
- Duplicate detector vẫn không dùng LLM: exact canonical/alias; possible theo word overlap cũ hoặc neutral core giống nhau. Đối chiếu Draft/Pending/Approved (bao gồm Published) và proposal còn chờ. UI có link nội dung hiện hữu, nút chọn target tạo revision, mở proposal khác và bỏ qua. Không có candidate được hiểu là mới trong phạm vi detector, không phải chứng minh không trùng ngữ nghĩa.
- Sửa tràn ngang trên mobile ở editor: cột grid dùng `minmax(0,1fr)`, phần tử con có `min-width:0`, nút và tiêu đề nguồn được xuống dòng. Browser phát hiện lỗi này sau khi conversion thủ công đã thành công; kiểm tra lại trên record đã lưu, không tạo proposal/revision lần nữa.

Published pointer, schema knowledge revision, matching runtime, 59 câu Published và các module quiz/QR/TTS/PWA/payment không bị sửa trong phase này. Không đọc hoặc ghi database `vo_danh` khi chạy tests. Không thay `.env.local` hay ledger các phase trước; fixture và quota reservation test được giữ lại.

## API

| Endpoint | Thay đổi |
|---|---|
| `POST /api/admin/knowledge/manual` | Mới. `{requestId,sourceId,chunkId,content,notes?,groupId?}` → `{proposalId,reused}`. |
| `GET /api/admin/knowledge/generate?groupId=…` | Thêm model, maxPerRequest, quota ứng dụng, relatedChatGroups. Không trả key. |
| `POST /api/admin/knowledge/generate` | Bắt buộc `confirmed:true`, kiểm tra cap/confirmed source; kết quả có status/errorCode. |
| `POST /api/admin/chat-questions` | Thêm `minCount`, `maxCount`: số nguyên 1–1.000.000. |
| Proposal detail/edit/convert | Tái sử dụng, thêm thông tin provenance và duplicate core. |

Tất cả qua admin authorization và same-origin cho mutation. Provider failure đã được lưu thành proposal vẫn trả HTTP 200 của thao tác persistence, kèm `status=failed`/`errorCode`; UI đọc status này. Lỗi quyền/input/quota ứng dụng vẫn là HTTP error. Không coi HTTP 200 persistence là generation thành công. Client cũ gọi generation thiếu `confirmed` phải được cập nhật; API chat không đổi.

## File trong phạm vi

- `server/domain/knowledge-generation.ts`, `server/domain/chat-history.ts`
- `server/services/knowledge-generation.ts`, `knowledge-generation-validation.ts`, `chat-history-admin.ts`
- `server/repositories/knowledge-generation.ts`, `chat-history.ts`
- `server/infrastructure/gemini-knowledge-generator.ts`
- `app/api/admin/knowledge/manual/route.ts`, `app/admin/knowledge/manual/page.tsx`
- `features/knowledge/knowledge-generation.tsx`, `.css`, `proposal-fields.tsx`
- `features/admin/chat-history-admin.tsx`
- `.env.knowledge-generation.example`
- `tests/knowledge-generation.test.mjs`
- `scripts/check-knowledge-generation-5e2.mjs`; các harness preflight/mongo/browser hiện có hỗ trợ `--phase5e2` để không ghi đè artifact phase trước.
- Ba báo cáo `docs/chatbot-phase-5e2*.md/json`.

Working tree có nhiều thay đổi các phase trước; danh sách trên chỉ phạm vi lần này, không reset thay đổi ngoài phạm vi.

## Kiểm thử

Kết quả máy đọc: [chatbot-phase-5e2-test-report.json](chatbot-phase-5e2-test-report.json). Trạng thái **COMPLETED_PENDING_OWNER_REVIEW**. Browser E2E đạt **10/10 nhóm kiểm tra**.

- Regression **203/203**: thêm manual/auth/source/forged history, cap/confirmation, config, quota metadata, duplicate core, provider 429/503/504/timeout và bộ lọc số lượt. Test tại boundary SDK xác nhận v1beta, timeout 30 giây và một attempt. Không gọi provider/database thật trong unit.
- Extraction **11/11**; cảnh báo standard font PDF vẫn còn, text tests đạt.
- MongoDB integration **15/15**: GridFS/metadata/chunks/confirmation/audit; manual và history server-side; replay, thay payload, concurrent manual, conversion, rollback; duplicate exact → revision; indexes; Published pointers giữ nguyên. Guard chặn mọi tên DB khác test target.
- TypeScript và ESLint phạm vi thay đổi đạt.
- Production build trong workspace riêng, không copy env, đạt exit 0, 44 static pages và có cả route manual mới. Có cảnh báo multiple lockfiles/experimental JSON và network retries của dependency build; guard chặn fetch/Mongo, không phải firewall toàn bộ socket. Không có Gemini generation.
- Browser dùng Next dev riêng, Chrome headless và provider mock tại boundary trong bản sao workspace; blank API key và chặn Google endpoint. Không chạy trên server chính. Login bằng session fixture hợp lệ, không kiểm thử form đăng nhập.

Lệnh tái lập:

```powershell
rtk proxy node scripts/preflight-knowledge-generation-test.mjs --phase5e2
rtk proxy node scripts/check-knowledge-generation-mongo.mjs --phase5e2
rtk proxy node scripts/check-knowledge-generation-browser.mjs --phase5e2
rtk proxy node scripts/check-knowledge-generation-5e2.mjs test
rtk proxy node --conditions=react-server --import tsx tests/knowledge-generation-extraction.ts
rtk proxy node node_modules/typescript/bin/tsc --noEmit
rtk proxy node scripts/check-knowledge-generation-5e2.mjs build
```

Integration/E2E tạo fixture chỉ trong test database; có reservation quota test cho provider mock, không reset. `--resume` browser chỉ dùng sau kiểm kê lần dừng; không retry mù hoặc gọi lại generation đã đạt.

## Giới hạn và vận hành

Grounding extractive vẫn giới hạn một chunk, neutral nguyên văn, persona chỉ thêm khung lời dẫn. Manual không tự do thêm factual claims. Tính đúng lịch sử và ý nghĩa canonical/alias vẫn cần admin kiểm duyệt; validator không chứng minh semantic entailment.

Duplicate possible là heuristic, chưa có benchmark semantic; có false positive/negative. Chỉ cảnh báo và yêu cầu admin quyết định, không tự merge/approve. Quota UI là snapshot. RequestId chưa bền qua reload; xem danh sách proposal trước khi chuẩn bị lượt mới. Nguồn và candidate có giới hạn catalog hiện có; vượt giới hạn thì dừng thay vì kiểm tra thiếu dữ liệu.

Chưa kiểm chứng Vercel deployment, Gemini live của code mới hoặc iPhone thật. Không cam kết production sẵn sàng chỉ từ tests local. Hướng dẫn admin, cấu hình, checklist và rollback: [production guide](chatbot-phase-5e2-production-guide.md).

Database test không có Published pointer; integration xác nhận không tạo thêm/đổi pointer tại đó. Trường hợp đã có Published pointer được kiểm tra bằng unit mock với revision approved trước đó, không tạo approval giả trong test DB và không truy vấn 59 Published của database chính để lấy số liệu mới.

Dừng sau Phase 5E.2 để chủ dự án kiểm tra; không tự deploy, bật flag, gọi live, approve hoặc publish.

## Browser E2E cuối

Đạt **10/10** nhóm kiểm tra: auth 401/403, DOCX/PDF/extraction, file lỗi, history server-side, Gemini mock/idempotency, editor/Draft/review source, nhập thủ công/alias/duplicate → revision, network error/mobile và Published không đổi. Desktop 1440×900, mobile 390×844; không tràn ngang trong các viewport kiểm tra cuối.

Các lần dừng harness đã được lưu riêng: selector nguồn chọn nhiều blockquote, selector status chọn cả loading/chưa lưu, selector danh sách gặp hai proposal cùng câu hỏi và cold dev action vượt 20 giây. Đã thu hẹp selector, dùng action timeout 60 giây và resume từ trạng thái đã kiểm kê; không retry generation. Không phải thay timeout Gemini. Lỗi mobile thực tế đã sửa CSS như mô tả ở trên.

Ảnh trên máy kiểm thử (ảnh mobile dưới đây sau sửa; artifact lần lỗi vẫn giữ riêng):

- [manual-desktop-91f090d1-8cc4-45b9-a039-7d8fe407d14f.png](../.local/chat-phase-5e2/manual-desktop-91f090d1-8cc4-45b9-a039-7d8fe407d14f.png)
- [manual-form-mobile-91f090d1-8cc4-45b9-a039-7d8fe407d14f.png](../.local/chat-phase-5e2/manual-form-mobile-91f090d1-8cc4-45b9-a039-7d8fe407d14f.png)
- [manual-mobile-fixed-91f090d1-8cc4-45b9-a039-7d8fe407d14f.png](../.local/chat-phase-5e2/manual-mobile-fixed-91f090d1-8cc4-45b9-a039-7d8fe407d14f.png)
- [proposals-mobile-91f090d1-8cc4-45b9-a039-7d8fe407d14f.png](../.local/chat-phase-5e2/proposals-mobile-91f090d1-8cc4-45b9-a039-7d8fe407d14f.png)
