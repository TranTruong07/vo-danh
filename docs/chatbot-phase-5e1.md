# Phase 5E.1 — Knowledge Generation Integration & Demo

Ngày cập nhật: **19/10/2026**, Asia/Bangkok.

## Trạng thái: COMPLETED_PENDING_OWNER_REVIEW

Đã hoàn tất smoke test được chủ dự án xác nhận: **2/2 lượt Gemini thật thành công, không retry**, model `gemini-3.5-flash-lite`, API `v1beta`. Cả hai trả HTTP 200, JSON/schema và citation hợp lệ, được lưu thành proposal `ready_for_review` trong `vo_danh_phase5e1_test`. Không chuyển Draft, không approve/publish, không deploy.

| Lượt | Luồng | Latency provider | Input / output / tổng token | Trạng thái |
|---|---|---:|---:|---|
| 1 | Từ source đã xác nhận | 2.627 ms | 662 / 793 / 1.455 | `ready_for_review` |
| 2 | Từ chat history resolve server-side | 2.532 ms | 714 / 784 / 1.498 | `ready_for_review` |

Đã giữ nguyên output. Cả hai lặp lại factual core của `cmtt45-q001`; một alias của lượt 1 hỏi rộng hơn đoạn nguồn. Bốn persona khác lời dẫn nhưng cùng thân câu trả lời. Đây là kết quả đạt về tích hợp, **không phải tự phê duyệt nội dung hoặc kết luận production-ready**.

Chi tiết: [đánh giá live](./chatbot-phase-5e1-live-evaluation.md). Ngân sách **2/2 đã hết**; dừng chờ chủ dự án kiểm tra.

## Baseline ngày 18/10 — trước khi được phép gọi live

Đã gỡ blocker thiếu `MONGODB_TEST_URI`. Preflight, MongoDB integration, Browser E2E với provider mock, regression, TypeScript, lint phạm vi thay đổi và production build bản cuối đều đạt.

Ở mốc baseline này, **Gemini live: 0 calls**, trạng thái `READY_FOR_GEMINI_LIVE`. Phần bên dưới ghi lại kết quả hạ tầng và mock E2E ngày 18/10; kết quả live ngày 19/10 ở đầu trang và báo cáo riêng.

Báo cáo máy đọc: [chatbot-phase-5e1-test-report.json](./chatbot-phase-5e1-test-report.json). Báo cáo BLOCKED cũ giữ tại `.local/chat-phase-5e1/prior-blocked-report.*`.

## 1. Preflight và cách ly database

| Kiểm tra | Kết quả |
|---|---|
| `MONGODB_TEST_URI` | Có; không in URI hoặc secret |
| Database đích | **`vo_danh_phase5e1_test`** |
| Tên database trong URI | URI cluster không có tên database; chọn tên test tường minh theo yêu cầu chủ dự án |
| URI có tên database khác | Helper từ chối trước kết nối; không fallback sang URI chính |
| Ping, quyền đọc/ghi/tạo index | Đạt bằng thao tác fixture test |
| Replica set/mongos và logical sessions | Đã xác minh |
| Transaction commit / rollback | Đạt |
| Database `vo_danh` | Không kết nối, không đọc/ghi |

Helper ánh xạ `MONGODB_URI` từ `MONGODB_TEST_URI`, đặt `MONGODB_DB_NAME=vo_danh_phase5e1_test` **trong tiến trình test**. Guard tại `MongoClient.db()` từ chối mọi tên khác và tên bỏ trống. Không sửa `.env.local`.

Integration dùng MongoClient mới. Browser chạy Next **development** trên localhost cổng còn trống, trong bản sao `.local/chat-phase-5e1/browser-workspace-*`, không copy `.env.local` và không dùng server/client chính. Tất cả server test của đợt này đã dừng.

Giữ nguyên model thật `gemini-3.5-flash-lite`, API `v1beta`, cấu hình và billing chính. Trong bản sao E2E, chỉ boundary generator được thay bằng mock `fixture-no-provider`; API/service/repository/auth vẫn là code ứng dụng. API key bị bỏ khỏi tiến trình test, matching bị tắt, fetch tới host Gemini bị chặn. Mock dùng giới hạn test 20 reservations/ngày; không thay hạn mức chính.

## 2. MongoDB integration — 11/11 nhóm kiểm tra đạt

Artifact: `.local/chat-phase-5e1/mongo-integration.json`.

1. GridFS upload/read và SHA-256 binary; metadata và chunks đúng nguồn.
2. Xác nhận nguồn, actor và audit.
3. Proposal persistence/edit/version; từ chối version cũ.
4. Draft conversion atomic, audit/actor đúng, không có reviewer hoặc Published pointer.
5. Từ chối replay conversion đã hoàn tất.
6. Trùng chính xác chặn logical question mới; target hiện hữu tạo revision mới và giữ revision cũ.
7. Hai conversion đồng thời: đúng một thành công, một bị từ chối, một revision mới.
8. Lỗi ghi cuối transaction: rollback, không tăng logical count, proposal không bị chuyển dở.
9. Reservation idempotency: cùng request chỉ giữ chỗ một lần, không gọi provider.
10. Indexes source/proposals/audit/GridFS và unique `(sourceId, order)` tồn tại.
11. Published pointers test giữ nguyên; không có approve/publish audit.

Integration service mock auth bằng actor gắn với user fixture thật trong database test. **Browser kiểm tra session và authorization thật**, không suy kết quả bảo mật từ auth mock.

## 3. Browser E2E — 9/9 nhóm kiểm tra đạt

Artifact: `.local/chat-phase-5e1/browser-e2e.json`. Edge và Chrome có sẵn; desktop **1440×900**, mobile emulation **390×844**.

| Màn / luồng | Kết quả |
|---|---|
| Authorization | API bốn màn: anonymous 401, user thường 403; trang admin kiểm tra chuyển hướng người không có quyền |
| `/admin/knowledge/sources` | DOCX upload, preview, loading, xác nhận nguồn đạt |
| PDF tiếng Việt có text | Upload, preview, xác nhận; đối chiếu toàn bộ text với nguồn đạt sau chuẩn hóa NFC/whitespace |
| File lỗi | PDF sai định dạng hiển thị lỗi, không thêm source |
| `/admin/chat-questions` | Chọn fixture lịch sử → “Tạo kiến thức từ câu hỏi này” đạt |
| Context server-side | Hiển thị câu hỏi từ group MongoDB; client giả `originalQuestion` bị 400; group không tồn tại bị 404 |
| `/admin/knowledge/generate` | Chọn đoạn, một proposal mock, loading; cùng request không tăng budget |
| `/admin/knowledge/proposals` | Evidence/bốn persona, sửa/lưu, xác nhận trước Draft, chuyển Draft, mở review có nguồn đạt |
| Error recovery / mobile | List HTTP 503 mô phỏng → refresh thật → dữ liệu hiện, lỗi cũ được xóa; không tràn ngang ở 390px |

User/session fixture chỉ nằm trong test DB, token ngẫu nhiên giữ trong bộ nhớ, hash lưu theo schema có sẵn. Backend kiểm tra role, authVersion và admin fingerprint thật. **Không kiểm thử form login**. Fixture actor không phải người duyệt lịch sử, không approve/publish.

Nguồn mẫu: `body/3` của `docs/source/Tong-hop-kien-thuc.docx`, lấy nguyên văn từ extraction manifest. Neutral giữ nguyên đoạn; bốn persona dùng lời dẫn đã có cộng nguyên văn factual core. Đây là **output mock**, không phải AI thật. Ghi chú biên tập test được lưu tách với nguồn.

Proposal E2E: `56ef36c405d7313ad4effec5afb56ec5c470c8dd5c724e802fff4f1c7f206153`. Draft test **`cmtt45-q003:v1`**, không có `publishedVersionId`.

### Ảnh kiểm chứng

- [Nguồn DOCX desktop](../.local/chat-phase-5e1/sources-desktop-b135a9d4-ce15-4631-8ec6-327d6fb6ddf8.png)
- [Tạo đề xuất từ hội thoại](../.local/chat-phase-5e1/generate-desktop-b135a9d4-ce15-4631-8ec6-327d6fb6ddf8.png)
- [Biên tập và Draft](../.local/chat-phase-5e1/proposals-desktop-b135a9d4-ce15-4631-8ec6-327d6fb6ddf8.png)
- [Review nguồn](../.local/chat-phase-5e1/review-desktop-b135a9d4-ce15-4631-8ec6-327d6fb6ddf8.png)
- [Mobile](../.local/chat-phase-5e1/proposals-mobile-b135a9d4-ce15-4631-8ec6-327d6fb6ddf8.png)

Ảnh/artifact ở `.local`, không phải tài nguyên public của website.

### Các lần harness chưa đạt

- Chromium bundled chưa cài: dùng browser có sẵn.
- Edge inspector báo `Request content was evicted from inspector cache`: xác minh bằng UI + record MongoDB tương ứng, dùng Chrome cho phần tiếp tục.
- Fixture trùng filename làm selector mơ hồ: đổi filename theo run ID, không xóa fixture cũ.
- Next route announcer cũng có `role=alert`: scope selector vào `.knowledge-error`.
- Cold compilation của Next development cần thời gian chờ riêng; không thay timeout Gemini.

Giữ báo cáo từng lần trong `browser-attempt-*.json`. Sau chẩn đoán, dùng `--resume` tiếp tục proposal hiện hữu và giữ các kiểm tra đã đạt; không tạo lại batch, không retry provider hoặc reset quota. E2E hoàn tất qua nhiều lượt, không tuyên bố một lượt live AI liên tục.

## 4. Kiểm kê database test

Artifact: `.local/chat-phase-5e1/test-database-inventory.json`, lúc `2026-10-18T14:03:11Z`.

| Dữ liệu | Số lượng |
|---|---:|
| Sources / chunks | 8 / 8 |
| GridFS files / chunks | 8 / 8 |
| Proposals | 6 |
| Logical questions / revisions | 3 / 4 |
| Revision Draft | 4 |
| Revision approved / Published pointer | 0 / 0 |
| Generation audit / knowledge audit | 13 / 4 |
| Chat history fixtures | 6 |
| Approve/publish actions | 0 |

Proposal states: 4 `converted_to_draft`, 1 `ready_for_review` cho rollback test, 1 `generating` là **reservation idempotency cố ý giữ lại**, không có provider đang chạy. Không tự xóa/discard fixture.

Budget test: **2 reservations** — 1 integration, 1 generation mock E2E. Gemini live vẫn **0**. Không reset budget/ledger các phase trước. Giữ fixture để kiểm tra.

Không truy vấn production để đếm lại 59 Published: mọi connection giới hạn test DB. Không sửa 59 câu Published.

## 5. Sửa lỗi và file thay đổi

**Lần tiếp tục:** refresh danh sách thành công vẫn giữ thông báo lỗi cũ. Đã xóa error sau khi request list/context đang active hoàn tất thành công. Browser xác minh 503 → refresh → danh sách hiện và `.knowledge-error` biến mất.

**Lượt trước BLOCKED:** sửa audit conversion hardcode `before.status=draft`; đọc revision trước trong transaction, dùng status/ID thật cho audit và `basedOnRevisionId`; từ chối logical thiếu revision. Regression vẫn đạt.

File lần tiếp tục:

- `features/knowledge/knowledge-generation.tsx`
- `scripts/knowledge-generation-test-env.mjs`
- `scripts/preflight-knowledge-generation-test.mjs`
- `scripts/check-knowledge-generation-mongo.mjs`
- `scripts/check-knowledge-generation-browser.mjs`
- `scripts/inspect-knowledge-generation-test.mjs`
- `docs/chatbot-phase-5e1.md`
- `docs/chatbot-phase-5e1-test-report.json`

Giữ ba file sửa audit trước đó: `server/repositories/knowledge-generation.ts`, `server/services/knowledge-generation.ts`, `tests/knowledge-generation.test.mjs`. Không thay workflow approve/publish, quiz, QR, TTS, PWA, payment hoặc schema knowledge.

## 6. Regression cuối

| Kiểm tra | Kết quả |
|---|---|
| Unit/regression | **192/192** |
| Extraction | **11/11** |
| PDF tiếng Việt E2E full text | **2/2**, chỉ chuẩn hóa NFC/whitespace |
| TypeScript | Đạt |
| ESLint phạm vi thay đổi | Đạt |
| Production build sau sửa UI | Đạt, exit 0, 42 static pages, workspace riêng |
| Live calls trong regression | **0** |

Build không copy `.env.local`, không chạy `scripts/pwa-assets.mjs`. Guard chặn global fetch/MongoClient.connect, không phải firewall mọi socket. Build đầu có cảnh báo kết nối khi tải phụ thuộc build; bản cuối chỉ còn cảnh báo nhiều lockfile và experimental JSON modules. Extraction cảnh báo font chuẩn PDF nhưng 11 tests vẫn đạt.

Lệnh tái lập integration (sẽ thêm fixture **chỉ ở test DB**):

```powershell
rtk proxy node scripts/preflight-knowledge-generation-test.mjs
rtk proxy node scripts/check-knowledge-generation-mongo.mjs
rtk proxy node scripts/check-knowledge-generation-browser.mjs
rtk proxy node scripts/inspect-knowledge-generation-test.mjs
```

`--resume` browser harness dùng báo cáo gần nhất để tiếp tục bước chưa đạt. Kiểm kê trạng thái trước khi dùng, không retry mù.

Regression đã chạy:

```powershell
rtk proxy node .local/chat-phase-5e1/check.mjs test
rtk proxy node --conditions=react-server --import tsx tests/knowledge-generation-extraction.ts
rtk proxy node node_modules/typescript/bin/tsc --noEmit
rtk proxy node node_modules/eslint/bin/eslint.js features/knowledge/knowledge-generation.tsx scripts/check-knowledge-generation-browser.mjs scripts/check-knowledge-generation-mongo.mjs scripts/knowledge-generation-test-env.mjs scripts/preflight-knowledge-generation-test.mjs scripts/inspect-knowledge-generation-test.mjs server/repositories/knowledge-generation.ts server/services/knowledge-generation.ts tests/knowledge-generation.test.mjs
rtk proxy node .local/chat-phase-5e1/check.mjs build
rtk proxy node .local/chat-phase-5e1/rebuild.mjs
```

Đã copy UI sửa vào workspace build trước lần `rebuild.mjs` cuối. `.local` chứa runner/artifact máy này; helper chính ở `scripts/`.

## 7. Hướng dẫn admin và bước live

1. Mở server test riêng, ánh xạ đúng URI test và `MONGODB_DB_NAME`. Không mặc định chạy `npm run dev` với cấu hình chính.
2. Đăng nhập admin cấu hình riêng của tiến trình test. Session fixture trong harness là tạm thời, không phải mật khẩu cho thao tác thủ công.
3. `/admin/knowledge/sources`: upload, đọc trích xuất, xác nhận nguồn.
4. `/admin/knowledge/generate`: chọn đoạn, số câu 1; hoặc từ `/admin/chat-questions` → chọn câu → tạo kiến thức.
5. Hai lượt live được xác nhận đã chạy xong ngày 19/10. **Không gọi thêm** trong đợt này. Kiểm thử mới cần ngân sách mới; luôn kiểm tra Free Tier và target, giữ model khi chưa được phép đổi.
6. Lưu nguyên output ban đầu, HTTP status, latency, schema/evidence/status. Không sửa rồi báo như output gốc. `insufficient_evidence` phải ghi nhận đúng.
7. Đối chiếu citation, factual core, bốn persona, biên tập rồi tạo Draft. Dừng trước approve/publish.

## 8. Giới hạn và rollback

- Live ngày 19/10 đã xác minh schema/grounding trên hai mẫu. Billing và quota provider không được truy vấn độc lập: Free Tier dựa trên xác nhận chủ dự án và pricing chính thức. Chưa xác nhận deploy.
- Browser mobile là emulation, không phải iPhone thật; login form chưa kiểm thử.
- Giới hạn một chunk, neutral verbatim và persona framing của Phase 5E giữ nguyên.
- Các fixture/test sessions còn lại được giữ, session có TTL; không tự dọn database.

Rollback: dừng test process để bỏ override (đã dừng). Nếu cần rollback UI, chỉ bỏ dòng `setError('')` thêm sau tải list/context thành công. Không reset working tree, xóa database hoặc reset ledger. Sửa audit lượt trước chỉ revert riêng ba file liên quan khi được yêu cầu.

## Bổ sung ngày 19/10

- Thêm `scripts/check-knowledge-generation-live.mjs`: preflight, hai lượt tuần tự có ledger/transport guard và postflight chỉ đọc. Không sửa code runtime hoặc matching.
- Unit/regression **192/192**, ba kiểm tra transport mock, TypeScript và lint đạt. Không chạy lại build vì không sửa runtime; build bản cuối baseline đã đạt.
- Ledger live `.local/chat-phase-5e1-live/generation-ledger.json`: **2/2**. Quota test ngày 18/10 vẫn 2; ngày 19/10 tăng từ 0 lên 2. Không reset.
- Live gọi service/repository/provider thật qua CLI; chỉ inject DB test và actor admin fixture đã tồn tại. Không tuyên bố đây là một lượt Browser E2E mới với provider thật. Browser/auth/biên tập/Draft đã được kiểm chứng ở baseline.
- Postflight: 3 logical questions, 4 revisions Draft cũ, 0 approved/Published pointer; hash toàn bộ knowledge và audit cũ không đổi. Hai proposal live chưa chuyển Draft.

**Đã hoàn tất kiểm thử kỹ thuật Phase 5E.1, dừng chờ chủ dự án kiểm tra. Không deploy, không approve/publish, không triển khai phase tiếp theo.**
