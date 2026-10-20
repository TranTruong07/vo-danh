# Phase 5D — Chat History, Unmatched Questions & Admin Analytics

Ngày thực hiện: 17/10/2026 (Asia/Bangkok). Phạm vi: triển khai code development; không deploy, không thực hiện 5C.4/5E, không gọi Gemini live.

## Kết quả

Đã bổ sung lịch sử tương tác, trang `/admin/chat-analytics` và `/admin/chat-questions`. Chatbot tiếp tục lấy lời đáp từ Published, giữ matching/ranking, quota và cấu hình Gemini. Quản trị viên có thể xem thống kê, đọc câu hỏi đã lọc thông tin nhạy cảm, rà soát, liên kết câu Published, đánh dấu nhóm tương đương và xóa lịch sử theo nhóm.

163/163 unit/regression tests pass. TypeScript, ESLint và production webpack build pass. Không có database test riêng: **chưa kiểm thử ghi/TTL/transaction trên MongoDB thật**. Đã chạy thành công các truy vấn analytics/list/detail **chỉ đọc** trên database hiện tại, đang chưa có lịch sử. Chưa kiểm thử browser/mobile hoặc tải đồng thời thực tế.

## Khảo sát và ranh giới dữ liệu

Database hiện tại là `vo_danh`. Trước phase không có collection chat history, feedback hay analytics. Các collection `chat_game_sessions`, `chat_limits`, `chat_ai_match_cache` đã tồn tại, được giữ nguyên vai trò và không dùng làm kho lịch sử.

Kiểm kê sau triển khai: 59 logical questions, 74 revisions (60 approved, 14 draft), 59 Published/runtime-readable, 134 knowledge audit. Không có orphan, duplicate version hoặc published pointer hỏng. Hash nội dung ba collection knowledge được đối chiếu với inventory cuối 5C.3B trong báo cáo JSON. Không import/approve/publish, không tạo index/collection trong đợt kiểm thử. Không reset cache, quota hoặc ledger cũ.

## Kiến trúc và luồng

```text
Popup chat → API chat → validation + rate limit + resolve server session
                       ├─ matching và Published answer hiện có
                       └─ chat-history service → chat-history repository → MongoDB

Admin page → POST/PATCH/DELETE private API
           → requireKnowledgeAdmin → chat-history-admin service → repository
                                                  └─ Published index (chỉ đọc)
```

### Một lượt hỏi

1. Client tạo UUID `requestId` một lần cho tin nhắn; retry thủ công giữ lại UUID.
2. Server xác thực cookie/phiên và lấy persona như trước; không nhận `characterId` từ client.
3. ID tương tác được băm từ session reference, loại lượt và request ID. Session reference băm từ owner hash + UUID phiên; không lưu cookie/token/session UUID thật.
4. Khi request đã hoàn thành trước đó, server đọc metadata lịch sử và kiểm tra lại Published. Không lưu/replay nguyên văn answer blob. Dùng lại request ID cho nội dung khác trả 409.
5. Matcher chạy như trước. Service ghi matching outcome/source, IDs, revision đã dùng và số lần provider thực sự được gọi do orchestration báo về.
6. `updateOne + $setOnInsert` và unique `_id` tránh ghi thêm bản sao cùng lượt. Hai request đồng thời có thể cùng chạy matching trước khi bản đầu lưu xong; **không phải distributed single-flight cho Gemini**. Quota hiện hữu vẫn áp dụng. Mục tiêu idempotency ở phase này là lịch sử/selection; không tuyên bố exactly-once generation.

### Gợi ý và chọn gợi ý

- Response `suggest` có optional `offerToken` trên mỗi gợi ý. Token HMAC chứa ID tương tác, tối đa ba Published IDs và hạn một giờ; chữ ký ràng buộc với session reference server-side. Không gửi session reference, owner hash hay nội dung nội bộ người chơi ra client.
- `/api/chat/answer` vẫn xác thực phiên/quota, sau đó kiểm tra offer thuộc phiên. Client cũ không có token chỉ được chọn ID đã được ghi nhận trong một offer của phiên đó trong giờ gần nhất; không còn cho chọn tùy ý một ID Published chưa được gợi ý.
- Server đọc lại Published answer; chỉ ghi `selectedQuestionId`, `selectedAt`, `publishedVersionId`, `outcome=answered` khi thực sự có stored answer hợp lệ.
- Cập nhật lựa chọn có điều kiện `selectedQuestionId` chưa tồn tại. Hai lựa chọn khác nhau đồng thời chỉ một lựa chọn được chấp nhận; lựa chọn khác trả 409. Retry cùng lựa chọn không tăng số đếm hoặc đổi thời gian chọn. Khi retry, revision cũ cũng phải còn là Published, không ghi lịch sử revision cũ trong khi trả revision mới.
- Gợi ý mở đầu được lưu với `kind=starter`; không tính thành lượt hỏi tự nhập trong dashboard. Không sửa UI/quiz lifecycle ngoài truyền metadata lượt gửi và token.

### Khi kho lịch sử lỗi

Ghi/đọc lịch sử là best effort, mỗi thao tác có thời gian chờ tối đa 1.200 ms ở service. Query runtime Mongo có `maxTimeMS=1000`. Lỗi chỉ log mã cố định, không log SDK error/URI/câu hỏi. Chatbot vẫn trả lời; signed offer cho phép chọn khi kho lịch sử tạm lỗi.

Giới hạn cần hiểu: timeout service không hủy promise Mongo đang chạy; một ghi có thể hoàn thành muộn. Khi storage mất kết nối, có thể thiếu lịch sử, không đảm bảo idempotency/race xuyên nhiều server. Không có hàng đợi bền vững hoặc retry ghi tự động. Client cũ không có token phải nhận gợi ý mới nếu không tìm được offer trong DB. Việc ưu tiên hoạt động chatbot khi lịch sử lỗi có nghĩa số liệu là **các tương tác ghi nhận được**, không phải bộ đếm tuyệt đối mọi HTTP request.

## Collection, schema, index

Các collection dưới đây được khởi tạo index lười ở lần ghi hợp lệ đầu tiên; không migration và không tạo từ các GET/read query quản trị.

| Collection | Dữ liệu | Index |
| --- | --- | --- |
| `chat_interactions` | `_id`, `sessionRef`, `characterId`, `kind`, timestamps, question đã lọc, `redacted`, `groupId`, fingerprint của nội dung đã lọc, outcome/source, suggested/selected/answered IDs, Published revision, lỗi provider dạng category, số call thực, cacheHit, latency, `feedbackStatus=not_requested` | unique `_id`; TTL `{expiresAt:1}` expireAfterSeconds=0; `{sessionRef:1,createdAt:-1}`; `{characterId:1,createdAt:-1}`; `{groupId:1,createdAt:-1}`; `{outcome:1,createdAt:-1}`; `{createdAt:-1}` |
| `chat_question_reviews` | `_id=groupId`, status, version, note đã lọc, linkedQuestionId/revisionId, equivalentGroupId, updatedAt, real admin userId | unique `_id`; `{status:1,updatedAt:-1}` |
| `chat_review_audit` | UUID, groupId, action, real actorId, timestamp, from/to status, version, linked/equivalent IDs hoặc deletedCount | unique `_id`; `{groupId:1,at:-1}`; **không TTL** |

Review + audit và delete + audit chạy chung Mongo transaction. Optimistic version kiểm tra cập nhật đồng thời; không tạo reviewer giả. Audit không lưu câu hỏi/ghi chú tự do, không lưu đáp án. Linked revision chỉ là bằng chứng tại thời điểm admin liên kết, không trở thành nguồn auto-answer/alias và không tự publish.

## Matching metadata

| Trường hợp | matchingSource |
| --- | --- |
| Normalized canonical / normalized alias duy nhất | `exact_match` / `alias_match` |
| Gemini chọn ID và ID qua toàn bộ kiểm tra lại Published | `gemini_match` |
| Cached match hợp lệ được chọn | `cache_hit` |
| Gợi ý nội bộ, gồm cached no_match hoặc fallback sau lỗi | `local_fallback` |
| Không đủ căn cứ, chưa biết câu phù hợp | `clarify` |
| Bộ lọc ngoài phạm vi hiện hữu từ chối | `out_of_scope` |
| Provider lỗi và không có gợi ý đủ tin cậy | `provider_unavailable` |
| Quota nội bộ hoặc HTTP 429 | `quota_exceeded` |

Provider failure lưu riêng nên một lượt `local_fallback` vẫn thể hiện được lỗi 504/timeout. `cacheHit` và `providerCalls` không suy từ feature flag. Orchestration chỉ thêm `suggestionSource` sau revalidation để phân biệt cached match với cached no_match; không thay đổi candidate list, prompt/schema, ngưỡng, model, timeout hay nhánh quyết định.

Latency đo bằng `performance.now()` trong service, gồm phần đọc knowledge/matching và không gồm thời gian ghi lịch sử cuối, network trình duyệt hay toàn bộ HTTP/auth. Selection có latency riêng. Không dùng nó để suy ra latency riêng Gemini.

## Nhóm câu hỏi và rà soát

- `groupId = SHA256([serverPersona, normalizeKnowledgePhrase(question)])`; giữ dấu, phủ định, địa danh, ngày tháng và dấu câu nội bộ. Khác hoa/thường, Unicode tổ hợp, khoảng trắng hoặc dấu kết câu có thể cùng nhóm.
- Không gộp Hà Nội/Huế/Sài Gòn, 19/8–23/8–25/8, ban bố/đọc Quân lệnh, khẳng định/phủ định, persona khác nhau. Câu không dấu không tự gộp với câu có dấu.
- Nội dung bị redaction dùng ID tương tác để tách nhóm, tránh gom nhiều câu không liên quan thành một câu `[đã ẩn]`.
- Không fuzzy auto-merge. Admin có thể gắn `equivalentGroupId` sau khi tự đối chiếu; chỉ tạo tham chiếu, không cộng gộp hoặc sửa các interaction.
- `reviewReason` phân biệt không có candidate do orchestration báo, cần làm rõ, lỗi provider và ngoài phạm vi; trường hợp gợi ý chưa chọn nhận biết qua outcome/selectedQuestionId. “Cần bổ sung kiến thức” chỉ là quyết định review của admin.
- Sau **10 phút**, lượt không có answered được đưa vào nhóm cần xem xét. Nhóm đã có review vẫn xem được nếu còn lịch sử. Chưa chọn gợi ý không đồng nghĩa thiếu kiến thức.
- Status: `new`, `reviewing`, `linked_existing`, `needs_knowledge`, `dismissed`, `resolved`. Chỉ admin tự đánh dấu cần kiến thức, liên kết, bỏ qua hoặc đã xử lý; hệ thống không tự sinh câu hỏi/aliases.
- Detail gồm nguyên văn đã được lọc của từng lượt, source/outcome, IDs gợi ý/chọn/revision, ngày giờ, ghi chú và 30 audit gần nhất. Không gửi sessionRef/requestHash ra cả trình duyệt admin.

## Số liệu dashboard

Trong khoảng lọc và chỉ những bản ghi chưa hết hạn:

- **Lượt hỏi**: số interaction `kind=question`; starter không tính vào mẫu số.
- **Câu duy nhất**: số groupId (gồm persona trong định nghĩa).
- **Lượt có gợi ý**: interaction có suggestedQuestionIds không rỗng.
- **Lượt chọn gợi ý**: interaction có selectedQuestionId.
- **Đã trả lời**: interaction `outcome=answered`, gồm exact/alias và gợi ý được chọn thành công. Gợi ý đơn thuần không tính.
- **Tỷ lệ gợi ý** = lượt có gợi ý / lượt hỏi. **Tỷ lệ chọn** = lượt chọn / lượt có gợi ý. Mẫu số 0 hiển thị “Chưa có dữ liệu”.
- **Nhóm cần rà soát**: có ít nhất một lượt chưa giải đáp sau 10 phút, status chưa `resolved`, `dismissed`, `linked_existing`.

Ngày thống kê theo `Asia/Bangkok` (UTC+7). Mặc định 30 ngày, tối đa 90 ngày/filter; page 1–500, pageSize tối đa 50 (UI 20), keyword tối đa 120 ký tự, regex được escape. Aggregation có maxTimeMS=3000, top popular giới hạn 10 và tổng hợp ngay trong Mongo thay vì tải toàn bộ lịch sử về Node. Hai truy vấn analytics không nằm trong snapshot transaction; số liệu có thể lệch nhẹ khi có lượt chat mới đồng thời. Chưa có bảng tổng hợp lâu dài; hết retention thì số liệu tương ứng cũng không còn.

## API và tương thích

Tất cả endpoint admin dùng authentication/authorization server hiện có; body JSON kiểm tra origin, size; response `Cache-Control: no-store, private`, `Vary: Cookie`. Không có public history endpoint.

| Method, route | Chức năng |
| --- | --- |
| POST `/api/admin/chat-analytics` | Body `{from?,to?,characterId?}` → totals, days, outcomes, popular |
| POST `/api/admin/chat-questions` | Body thêm `{status?,text?,page?,pageSize?}` → items, total |
| POST `/api/admin/chat-questions/[groupId]` | `{page?,pageSize?}` → detail, audit, danh sách Published để liên kết |
| PATCH `/api/admin/chat-questions/[groupId]` | `{status,expectedVersion,note,linkedQuestionId?,equivalentGroupId?}` → review; stale version trả 409 |
| DELETE `/api/admin/chat-questions/[groupId]` | `{confirm:"DELETE_HISTORY"}` → deleted count; có xác nhận UI và audit |

Public chat giữ các status cũ. Chỉ thêm optional `requestId` ở request và `offerToken` trên suggestion/answer request để bảo vệ selection. Payload mới vẫn reject role, characterId, answer, source và field lạ. UUID request phải hợp lệ, token tối đa 1000 ký tự; giới hạn body chat cũ giữ nguyên. Với client cũ không gửi requestId, mỗi request được coi là một lượt mới — không thể phân biệt retry mạng với hai câu hỏi cố ý giống nhau. Cần refresh client để có idempotency đầy đủ.

## Privacy và retention

- Mặc định raw history 30 ngày, `CHAT_HISTORY_RETENTION_DAYS` nguyên 1–365; không hợp lệ dùng 30. Cấu hình áp dụng cho **record mới**, không viết lại expiresAt cũ.
- Chuẩn hóa NFC/whitespace, bỏ ký tự điều khiển; tối đa 500 ký tự. Ẩn email, số liên hệ dài, URL, chuỗi token; nếu thấy dấu hiệu key/password/cookie/connection string thì ẩn toàn bộ câu. Fingerprint chỉ dựa vào nội dung đã lọc, không lưu hash của secret gốc.
- Đây là lọc heuristic, **không phải DLP hoàn chỉnh**: tên/địa chỉ/thông tin nhạy cảm không theo mẫu có thể còn. Admin cần dùng thao tác xóa khi phát hiện và không ghi thêm dữ liệu cá nhân vào note.
- Không lưu API key, cookie, session token/UUID thật, IP, user agent, raw Gemini prompt/response hay bản sao persona answer.
- TTL chỉ trên `chat_interactions`. Truy vấn loại expired ngay cả trước khi Mongo TTL monitor xóa vật lý. Không TTL knowledge/audit. Review note đã lọc và trạng thái giữ lại để admin bảo toàn công việc; nhóm không có raw history còn hạn không xuất hiện trong danh sách. Xóa nhóm sẽ xóa cả note/review, giữ audit tối thiểu.
- Xóa lịch sử trong UI chỉ ảnh hưởng nhóm được xác nhận; không xóa knowledge/cache/quota. Lượt mới phát sinh sau xóa có thể tạo nhóm lại.

## Cấu hình và chạy local

File mẫu `.env.chat-history.example`:

```dotenv
CHAT_HISTORY_RETENTION_DAYS=30
CHAT_HISTORY_SIGNING_SECRET=
```

Đặt `CHAT_HISTORY_SIGNING_SECRET` là chuỗi ngẫu nhiên mật mã ít nhất 32 ký tự, server-only, cùng giá trị giữa các instance. Không dùng mật khẩu admin hay Gemini key làm signing key. Khi thiếu, local dùng key ngẫu nhiên theo process; restart/chuyển instance sẽ dựa vào offer đã lưu trong Mongo. **Muốn multi-instance và fallback tốt khi DB lỗi phải cấu hình secret dùng chung**. Không sửa `.env.local` trong đợt này.

Sau khi chủ dự án duyệt, dùng môi trường development với database test riêng có dữ liệu Published hợp lệ để kiểm thử ghi. Không dùng database `vo_danh` cho dữ liệu kiểm thử giả.

```powershell
rtk npm run dev
```

Mở `http://localhost:3001`, đăng nhập tài khoản admin cấu hình hiện có (`ADMIN_EMAIL`/`ADMIN_PASSWORD`, không ghi mật khẩu trong tài liệu). Sidebar có “Thống kê hội thoại” và “Rà soát hội thoại”. Không cần import hay approve lại 59 câu. Collection mới tự được khởi tạo ở lượt ghi hợp lệ đầu tiên, tài khoản DB cần quyền tạo index cho ba collection mới; thiếu quyền không được làm sập chat nhưng lịch sử không được lưu.

Checklist demo development:

1. Quét QR → quiz ready → mở popup; kiểm tra đóng/mở không đổi quiz. Với mỗi persona, thử canonical/alias từ Published và một câu diễn đạt khác.
2. Xem gợi ý rồi chọn; refresh admin để so sánh lượt hỏi/gợi ý/đã trả lời. Starter được lưu riêng và không tăng lượt hỏi.
3. Retry cùng requestId không tăng history; cố dùng gợi ý từ phiên khác phải bị từ chối. Không dùng Gemini live cho bước lỗi: test mock sẵn có bao phủ timeout/504/quota.
4. Chờ 10 phút cho lượt chưa được giải đáp hoặc dùng clock/data ở test DB; không thay thời gian production. Lọc nhóm, liên kết một Published, lưu, mở hai tab để thử optimistic conflict.
5. Thử tài khoản không phải admin: page redirect, API từ chối. Xóa một nhóm test đã xác nhận; audit được giữ, knowledge không đổi.
6. Kiểm tra TTL trong test DB bằng expiresAt ngắn do test chuẩn bị riêng; không giảm retention/xóa production để thử.

## Kiểm thử thực hiện

```powershell
rtk proxy node scripts/check-chat-history.mjs test
rtk proxy npx tsc --noEmit
rtk proxy npx eslint server/domain/chat-history.ts server/domain/chat.ts server/services/chat-history.ts server/services/chat-history-privacy.ts server/services/chat-history-admin.ts server/services/chat.ts server/services/chat-ai-matching.ts server/repositories/chat-history.ts features/admin/chat-history-admin.tsx features/admin/admin-frame.tsx features/game/chat-client.ts features/game/character-chat.tsx app/admin/chat-analytics/page.tsx app/admin/chat-questions/page.tsx app/api/admin/chat-analytics/route.ts app/api/admin/chat-questions/route.ts "app/api/admin/chat-questions/[id]/route.ts" tests/chat-history.test.mjs tests/chat-ai.test.mjs tests/chat.test.mjs tests/chat-demo.test.mjs tests/chat-fallback.test.mjs tests/support/chat-history-memory.mjs scripts/check-chat-history.mjs scripts/inspect-chat-history-readonly.ts scripts/support/snapshot-chat-history.mjs scripts/support/chat-history-offline-guard.mjs
rtk proxy node scripts/check-chat-history.mjs build
```

- 115 regression trước phase + 48 test mới = 163 pass. Bao phủ exact/alias, bốn persona, AI/cache/fallback bằng mock, selection/foreign session, request dedup, concurrent selection, Published revoke, privacy/retention, admin auth/filter/version conflict, audit/deletion transaction wiring, pagination/projection, hanging/failing writes.
- Các fixture test cũ bổ sung in-memory history; test response so sánh IDs/labels thay vì chữ ký ngẫu nhiên của offer. Test chọn ID tùy ý trước kia đổi sang assert từ chối vì yêu cầu bảo vệ session ở phase này.
- Harness chặn `fetch` và `MongoClient.connect`, xóa key/URI khỏi env của **process test/build**. Production code/config thật không bị đổi. Không gọi live Gemini, không ghi test data production.
- Production build chạy webpack ở `.local/chat-phase-5d/build-workspace-*`, không copy `.env.local`, không chạy post-build `pwa-assets.mjs`, không dùng `.next` của dự án chính. Có warning workspace nhiều lockfile và experimental JSON import hiện hữu.
- Read-only Mongo query smoke pass trên collection chưa tồn tại; **không thay thế** integration với dữ liệu đầy đủ, TTL expiration, transaction commit/rollback hoặc tải nhiều instance. Chưa có `MONGODB_TEST_URI`, nên không chạy test ghi thật.
- Không chụp ảnh hoặc xác minh hành vi trên browser/device ở đợt này. React render nội dung như text; không `dangerouslySetInnerHTML`; nội dung tìm kiếm gửi qua POST body, không URL query.

## File đã tạo/thay đổi

Mới:

- `server/domain/chat-history.ts`
- `server/repositories/chat-history.ts`
- `server/services/chat-history.ts`, `chat-history-privacy.ts`, `chat-history-admin.ts`
- `app/api/admin/chat-analytics/route.ts`, `app/api/admin/chat-questions/route.ts`, `app/api/admin/chat-questions/[id]/route.ts`
- `app/admin/chat-analytics/page.tsx`, `app/admin/chat-questions/page.tsx`
- `features/admin/chat-history-admin.tsx`, `chat-history-admin.css`
- `.env.chat-history.example`
- `tests/chat-history.test.mjs`, `tests/support/chat-history-memory.mjs`
- `scripts/check-chat-history.mjs`, `inspect-chat-history-readonly.ts`, `report-chat-history.mjs`
- `scripts/support/snapshot-chat-history.mjs`, `chat-history-offline-guard.mjs`
- `docs/chatbot-phase-5d.md`, `docs/chatbot-phase-5d-test-report.json`

Sửa:

- `server/domain/chat.ts`: optional request/offer metadata, validation.
- `server/services/chat.ts`: history orchestration, replay, selection authorization.
- `server/services/chat-ai-matching.ts`: **chỉ metadata `suggestionSource`**, không thay matching.
- `features/game/chat-client.ts`, `character-chat.tsx`: UUID ổn định qua retry, offerToken, thông báo 409; không sửa giao diện/quiz.
- `features/admin/admin-frame.tsx`: hai link, title, ẩn GET search ở hai trang chat để không đưa câu hỏi vào URL.
- `tests/chat.test.mjs`, `chat-demo.test.mjs`, `chat-ai.test.mjs`, `chat-fallback.test.mjs`: fixtures/regression như trên.
- `.gitignore`: cho phép version control file env example mới, giữ nguyên quy tắc cũ.

## Rollback

Không dùng `git reset --hard`/`git clean`/restore toàn working tree: có thay đổi các phase trước chưa commit.

1. Dùng `.local/chat-phase-5d/before.json` cho các file runtime/UI và test đã được snapshot trước phase; so sánh với thay đổi mới hơn trước khi khôi phục. Snapshot không chứa `.env.local`.
2. Với `chat-ai-matching.ts`, chỉ bỏ optional `suggestionSource` trong interface và dòng gán metadata sau revalidation. Không đảo các guard 5C.3B.
3. Với `tests/chat-ai.test.mjs`, chỉ bỏ import/injection `historyMemory` được thêm ở phase này. File này có thay đổi 5C chưa commit nên không restore về HEAD.
4. Gỡ imports/routes/menu mới sau khi service/UI đã phục hồi; các file mới test/report có thể giữ làm bằng chứng. Chỉ bỏ dòng whitelist `.env.chat-history.example` trong `.gitignore` nếu bỏ file mẫu đó.
5. Không drop collection, không rollback Published, không đổi env/model/key/cache/quota. History đã tạo sau rollout có thể giữ đến TTL; review/audit giữ nguyên. Chạy lại test/typecheck và restart development khi đã xem diff.

Dừng tại Phase 5D, chờ chủ dự án duyệt trước khi deploy. Các bước tiếp theo cần môi trường kiểm thử riêng và duyệt vận hành; không tự triển khai 5C.4/5E.
