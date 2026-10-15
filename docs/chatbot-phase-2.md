# Chatbot boardgame QR — báo cáo Phase 2

> Cập nhật: [Phase 3 — Knowledge Review & Publishing](chatbot-phase-3.md) đã bổ sung quản trị kiến thức theo phạm vi mới. Các mô tả “chưa có admin review”/“Phase 3 popup” bên dưới là trạng thái tại thời điểm Phase 2; popup vẫn chưa nối API. Chưa chạy import apply hoặc duyệt/công bố dữ liệu thật.

Ngày: 14/10/2026. Đã đọc toàn bộ `CODEX_IMPLEMENTATION_GUIDE.md`, `docs/chatbot-phase-0.md`, `docs/knowledge-pipeline.md`, `knowledge/review-report.md` và quy định `.agents/rules/` trước khi triển khai.

**Backend Phase 2 đã được triển khai và kiểm thử. Chatbot chưa sẵn sàng phục vụ kiến thức thật:** MongoDB hiện chưa có revision được duyệt/công bố; popup chưa nối API theo đúng phạm vi yêu cầu. Không gọi LLM, không tự approve/publish, không chạy import `--apply`.

## 1. Kế hoạch và kết quả

| Hạng mục | Kết quả |
| --- | --- |
| Xác thực phiên chơi, mapping nhân vật server | Hoàn thành; tái sử dụng cookie `history_player`, đọc binding trong `quiz_attempts` |
| Repository approved + published | Hoàn thành; join đúng published pointer, kiểm tra trạng thái và metadata duyệt |
| Exact / normalized alias / fuzzy | Hoàn thành; Fuse.js chỉ tạo gợi ý, không tự trả lời khi mơ hồ |
| API, validation, refusal, rate limiting | Hoàn thành; hai POST endpoint, bộ đếm Mongo riêng |
| Rà soát 40 câu × 4 lời thoại | Đã tạo đề xuất biên tập offline, revision 3, tất cả còn draft |
| Unit tests / typecheck / build / smoke HTTP | Đạt trong phạm vi mới; lỗi baseline toàn repo ghi riêng bên dưới |
| Duyệt/công bố và nối popup | Chưa thực hiện, thuộc bước tiếp theo; không tự chuyển giai đoạn |

## 2. Kiến trúc và ranh giới phiên chơi

```text
POST /api/chat hoặc /api/chat/answer
  → HTTP adapter (JSON, origin, kích thước, lỗi an toàn, no-store)
  → service (payload, cookie, quota, phiên, matching)
  → repository (MongoDB)

history_player cookie → playerSession(false) → ownerHash
sessionId → quiz_attempts {_id, ownerHash, state: ready, expiresAt > now}
  → characterId từ record server → kiểm tra nhân vật còn tồn tại
  → mapping cấu hình server → canonical persona ID
  → knowledge_questions.publishedVersionId
  → knowledge_question_revisions {status: approved, _id đúng pointer}
  → characterAnswers[persona ID]
```

- Payload không nhận `characterId`, `role`, `status`, `answer`, `systemPrompt` hoặc trường bổ sung. Nhắc tên nhân vật khác trong câu hỏi không đổi persona.
- Session ID phải có dạng UUID; cookie phải hợp lệ và hash trùng owner của phiên. ID tự tạo, phiên người khác, phiên chưa sẵn sàng, hết hạn, offline hoặc nhân vật đã xóa đều bị từ chối.
- Chat dùng phiên quiz hiện có, thời hạn hiện tại 20 phút; không tạo/gia hạn cookie hoặc phiên. Có thể chat trước/sau chọn đáp án khi phiên còn hợp lệ. Không đọc nội dung quiz, đáp án, điểm hoặc `selectedIndex`.
- Repository chat đọc riêng projection metadata để tránh gọi helper quiz có side effect tạo indexes. Không chỉnh schema/index/logic của quiz, QR, TTS, PWA, đơn hàng hoặc tài khoản.
- QR là URL công khai, không chứng minh người dùng thật sự quét thẻ vật lý. Ràng buộc server–cookie bảo vệ đúng phiên/người chơi; không xây cơ chế chống tự mở URL.

## 3. Cấu hình nhân vật

Đã bổ sung các biến dưới đây vào `.env.local`, giữ nguyên cấu hình khác. `.env.chat.example` có giá trị trống để triển khai ở môi trường khác. Không dùng biến `NEXT_PUBLIC_` cho mapping.

| Persona | Biến server | ObjectId kiểm tra trong DB hiện tại |
| --- | --- | --- |
| Trường Chinh | `CHAT_CHARACTER_TRUONG_CHINH_ID` | `6acf0a8c9c11e27aef188419` |
| Lê Duẩn | `CHAT_CHARACTER_LE_DUAN_ID` | `6acf0cf89c11e27aef18841a` |
| Phạm Văn Đồng | `CHAT_CHARACTER_PHAM_VAN_DONG_ID` | `6acf16299c11e27aef18841b` |
| Võ Nguyên Giáp | `CHAT_CHARACTER_VO_NGUYEN_GIAP_ID` | `6ac8e47d0ddc4ea27b45f7d4` |

Đây là khảo sát mới: cả bốn nhân vật đã tồn tại, khác thời điểm khảo sát Phase 0. Không tạo hay sửa bản ghi nhân vật. Thiếu mapping thì nhân vật đó không có chat; mapping sai định dạng/trùng ID thì trả lỗi cấu hình an toàn. Không suy luận persona bằng tên có thể chỉnh sửa. Dùng lại `MONGODB_URI`/`MONGODB_DB_NAME`; không cần khóa LLM.

## 4. Quy tắc knowledge và matching

- Logical question phải thuộc topic `cach-mang-thang-tam-1945`, có `publishedVersionId`.
- `$lookup` kiểm tra cùng lúc revision `_id` đúng pointer, `questionId` đúng logical ID, `status=approved`, `reviewedBy` không trống và `reviewedAt` là BSON Date. Đồng thời yêu cầu câu hỏi, nguồn, đáp án trung tính và cả bốn lời đáp không trống.
- Draft, pending_review, rejected, approved chưa publish, pointer hỏng, revision thuộc câu khác hoặc thiếu lời đáp đều không vào index/gợi ý.
- Index chỉ chứa canonical question, aliases và ID. Không tải cả bốn lời đáp vào index hoặc gửi ra client. Khi cần trả lời mới đọc đúng lời đáp của nhân vật server đã xác định.
- Không fallback sang `approvedAnswer`, draft hoặc nhân vật khác. Trả nguyên văn lời đáp đã lưu, không thay đại từ hoặc ghép thêm dữ kiện ở runtime.
- NFC, chữ thường tiếng Việt, khoảng trắng và dấu kết câu được chuẩn hóa; giữ dấu tiếng Việt, phủ định, ngày tháng và dấu bên trong câu. Canonical/alias khớp duy nhất mới trả lời tự động.
- Nhiều exact match khác question ID → gợi ý tối đa 3. Không có exact match → Fuse.js threshold 0.25, query dưới 8 ký tự không fuzzy; mọi kết quả fuzzy đều là gợi ý. Không có kết quả → mẫu từ chối riêng theo nhân vật.
- Chỉ dùng dữ liệu published cho gợi ý. Khi chọn gợi ý, API kiểm tra lại phiên/quota/published revision. Exact match cũng đọc lại pointer với expected revision để không trả nhầm bản đã thay trong lúc xử lý.
- Không cache index hoặc câu trả lời giữa request; đọc DB mới mỗi lần. Index vượt 2.000 mục hoặc có dữ liệu sai cấu trúc thì báo 503, không cắt bớt rồi vô tình che mất alias trùng.
- Index `_id` mặc định phục vụ lookup. Bộ index knowledge unique `(questionId, version)`, `(status, questionId)`, `topicId` đã có trong công cụ import Phase 1, chỉ được tạo khi apply được cho phép. Lần này không tạo index knowledge.

## 5. API

### `POST /api/chat`

```json
{
  "sessionId": "UUID từ PublicQuestion.id của lượt chơi hiện tại",
  "message": "Khởi nghĩa giành chính quyền ở Hà Nội thắng lợi ngày nào?"
}
```

`message`: chuỗi không trống, tối đa 500 ký tự, không nhận ký tự điều khiển nguy hiểm. Cần cookie chơi của cùng trình duyệt. Không yêu cầu tài khoản đăng nhập.

### `POST /api/chat/answer`

```json
{
  "sessionId": "UUID từ PublicQuestion.id của lượt chơi hiện tại",
  "questionId": "cmtt45-q017"
}
```

Dùng khi chọn gợi ý. Question ID là ID knowledge, không phải ID câu hỏi trắc nghiệm. Có thể truy vấn trực tiếp ID published hợp lệ; server không yêu cầu lịch sử hội thoại và không suy đoán đáp án quiz.

### Các response thành công HTTP 200

```typescript
type ChatResponse =
  | { status: "answered"; characterId: string; questionId: string;
      answer: string; source: { document: string; sectionId: string } }
  | { status: "suggest"; suggestions: { questionId: string; question: string }[] }
  | { status: "out_of_scope"; characterId: string; answer: string };
```

Không trả source excerpt, reviewer, cookie, hash, prompt, câu trả lời của các nhân vật còn lại hoặc stack trace. Nguồn công khai chỉ gồm tên tài liệu và mục.

### Lỗi

Body: `{status: "error", code, message}`.

| HTTP | Trường hợp |
| --- | --- |
| 400 | `INVALID_INPUT`, `INVALID_JSON` |
| 401 | `INVALID_SESSION` — thiếu cookie, phiên không tồn tại/không thuộc người chơi/hết hạn |
| 403 | `FORBIDDEN_ORIGIN`, `CHARACTER_UNAVAILABLE` |
| 405 | Phương thức không hỗ trợ (Next.js tự xử lý) |
| 413 | `BODY_TOO_LARGE` — tối đa 4.096 byte, kiểm tra cả body stream |
| 415 | `JSON_REQUIRED` |
| 429 | `RATE_LIMITED`, kèm `Retry-After` |
| 503 | `CHAT_CONFIGURATION`, `CHAT_UNAVAILABLE` — lỗi nội bộ/DB, không lộ chi tiết |

POST response có `Cache-Control: no-store, private`, `Vary: Cookie`, `X-Content-Type-Options: nosniff`. Không bật CORS rộng; chấp nhận origin request hoặc origin `NEXT_PUBLIC_APP_URL`, từ chối `sec-fetch-site: cross-site`.

### Rate limiting

- Collection riêng `chat_limits`; atomic `$inc`, xử lý race upsert; TTL `expiresAt` tự dọn counter.
- 20 request/phút/ownerHash cho cả hai API cộng lại, qua mọi phiên của cùng cookie. Tổng 300 request/phút cho deployment dùng chung DB.
- Fixed minute window; `Retry-After` đến cửa sổ tiếp theo. Có cookie hợp lệ về định dạng nhưng phiên sai vẫn tiêu quota; payload sai bị chặn trước đó.
- DB/index không khả dụng thì từ chối, không bỏ qua quota. Application cần quyền tạo TTL index trên collection này; lần đầu request hợp lệ mới tạo.
- Không ghi nội dung chat. Cookie ẩn danh có thể bị người dùng thay mới; quota này không thay thế bảo vệ DDoS/proxy. Giới hạn toàn cục vẫn áp dụng, có thể điều chỉnh các hằng trong `chat-rate-limit.ts` theo tải thực tế.

## 6. Rà soát lời thoại — vẫn chờ duyệt

Bản Phase 1 dùng source excerpt dài giống nhau và chỉ đổi câu dẫn. Đã đề xuất diễn đạt lại 40 câu dựa trên source tương ứng, với nhịp hội thoại:

| Nhân vật | Phong cách đề xuất cho mô phỏng giáo dục |
| --- | --- |
| Trường Chinh | Phân tích theo ý, có cấu trúc, làm rõ ý chính và phần bổ sung |
| Lê Duẩn | Dứt khoát, khích lệ người học nắm chắc và tự nhắc lại nội dung |
| Phạm Văn Đồng | Nhẹ nhàng, giải thích từng phần, gần gũi người học |
| Võ Nguyên Giáp | Cô đọng, nhấn điều cần nhớ và đối chiếu chi tiết trong tư liệu |

Các phong cách là lựa chọn thiết kế, **không phải xác nhận cách nói có thật hoặc lời trích lịch sử**. Không viết ký ức cá nhân, không nhận vai trò lịch sử của nhân vật khác. Giữ các đính chính về Lê Duẩn, phân biệt ban bố/đọc Quân lệnh số 1 và vai trò tập thể. Không dùng nguồn ngoài DOCX. Việc diễn đạt lại vẫn cần người quản trị kiểm tra từng mệnh đề và phần lược bớt, không coi kiểm thử là duyệt lịch sử.

Artifact local:

- `knowledge/draft-questions.json`: giữ nguyên 40 draft revision 1.
- `knowledge/draft-questions-phase-2.json`: giữ 40 draft revision 2 của lượt biên tập đầu.
- **`knowledge/draft-questions-phase-2-v3.json`: bản đề xuất mới nhất cần duyệt**, 40 draft revision 3, 160 lời đáp; bổ sung biến thể câu dẫn để bớt lặp.
- `knowledge/review-report.md`: giữ báo cáo Phase 1.
- **`knowledge/review-report-phase-2.md`** và `.json`: báo cáo đối chiếu bản mới nhất, 0 lỗi cấu trúc, 18 cảnh báo cần duyệt.
- `knowledge/import-report-phase-2.json`: dry-run bản mới nhất, dự kiến 40 inserts, 0 writes, 0 approved, 0 published.

Canonical question, aliases, normalized phrases, đáp án trung tính, source/excerpt/locators/hash giữ nguyên qua các revision. Tất cả còn `status=draft`, không reviewer/reviewedAt. Script từ chối đầu vào đã được duyệt, DOCX khác hash hoặc ghi đè file đích; runtime không import file nháp hay module biên tập. Không đưa artifact vào `public/`, PWA hoặc git.

## 7. Kiểm thử đã chạy

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run chat:test` | **23/23 đạt**, không skip tại máy hiện tại |
| `npx tsc --noEmit` | Đạt sau bản chỉnh cuối |
| ESLint các file mới/chỉnh trong chatbot | Đạt |
| `npm run build` | Đạt; 29 trang được generate, hai API được nhận diện, PWA vẫn 76 public assets |
| HTTP production tại localhost:3012 | **10/10 đạt**: hai API thiếu session 401, payload override/injection 400, malformed JSON 400, origin 403, type 415, body 413, GET 405; no-store |
| MongoDB read-only thực tế | Mapping 4/4, aggregation chạy được; logical questions 0, revisions 0, published index 0, không trả đáp án mẫu |
| Validate draft revision 3 | 40 records, **0 lỗi / 18 cảnh báo**, không duyệt |
| Import dry-run revision 3 | 40 inserts dự kiến, **0 DB writes**, không tạo index knowledge |
| Toàn bộ Node tests | **88/93 đạt**; 5 lỗi auth giống baseline |
| Full lint | 5 lỗi loader test và 1 cảnh báo img giống baseline |

23 tests gồm exact/normalization/fuzzy/ambiguity/ngoài phạm vi/prompt injection; payload giả mạo; cookie–owner–expiry–character mapping; đủ bốn persona; approved + pointer và thiếu lời đáp; recheck khi chọn gợi ý; quota và lỗi storage; HTTP errors; draft version và các đính chính nhạy cảm.

Các nhánh approved/published, session owner và quota dùng fixture giả trong bộ nhớ, không approve một câu lịch sử nào để chạy test. Repository test đánh giá các predicate Mongo được phát ra trên fixture; kiểm tra DB thật mới chạy trên kho rỗng. Chưa có integration test trên DB thật có dữ liệu đã duyệt hay tải đồng thời nhiều deployment.

Lỗi baseline: `tests/auth.test.mjs` có 5 lỗi loader tìm sai `server/services/character.ts` khi đi qua dependency TTS hiện hữu. Full lint: `no-assign-module-variable` trong `character-images`, `character-questions`, `history-game`, `orders`, `support/load-typescript`; cảnh báo `<img>` ở `app/author/page.tsx`. Không sửa các phần ngoài phạm vi này, không tuyên bố toàn repo xanh. Máy dùng Node 20.13.1, dependency TTS hiện hữu có engine warning yêu cầu Node >=22.

Server kiểm tra riêng ở cổng 3012 đã được dừng. Không thay server/cổng đang dùng của dự án.

## 8. File thay đổi trong Phase 2

**Backend mới:**

- `server/domain/chat.ts`: DTO, lỗi và validation input.
- `server/services/chat.ts`: điều phối hai luồng hỏi/chọn gợi ý.
- `server/services/chat-session.ts`: xác thực binding phiên.
- `server/services/chat-characters.ts`: mapping server và persona templates.
- `server/services/chat-matcher.ts`: exact/alias/fuzzy.
- `server/services/chat-rate-limit.ts`: chính sách quota.
- `server/repositories/chat-session.ts`: đọc metadata phiên/nhân vật.
- `server/repositories/chat-knowledge.ts`: join approved/published và projection tối thiểu.
- `server/repositories/chat-limits.ts`: counters Mongo và TTL.
- `server/infrastructure/chat-http.ts`: transport validation và lỗi an toàn.
- `app/api/chat/route.ts`, `app/api/chat/answer/route.ts`: hai POST route handlers.

**Công cụ / kiểm thử / cấu hình / tài liệu:**

- `scripts/knowledge/character-dialogue.ts`, `scripts/revise-character-drafts.ts`: đề xuất biên tập offline và tạo revision draft mới.
- `scripts/knowledge/common.ts`: cập nhật hướng dẫn đọc báo cáo để phản ánh lời đáp được diễn đạt lại.
- `tests/chat.test.mjs`, `tests/chat-repositories.test.mjs`, `tests/chat-dialogue.test.mjs`.
- `.env.chat.example`; `.env.local` chỉ thêm bốn mapping đã đối chiếu.
- `package.json`, `package-lock.json`: Fuse.js và scripts test/biên tập.
- `.gitignore`: cho phép env example, bỏ qua mọi `knowledge/review-report*.md` chứa nội dung chưa duyệt.
- `docs/chatbot-phase-2.md`, cập nhật tham chiếu trong `docs/chatbot-phase-0.md`, `docs/knowledge-pipeline.md`, `knowledge/README.md`.
- Các artifact local tại mục 6; `.local/chat-smoke.mjs` và `.local/chat-db-readonly.ts` chỉ dùng kiểm tra local, được ignore.

Các model knowledge Phase 1 và helper DB hiện hữu được tái sử dụng. Các thay đổi TTS/UI/PWA có sẵn trước tác vụ vẫn giữ nguyên; không commit, reset hay revert chúng.

## 9. Hướng dẫn chạy thử

1. Kiểm tra `.env.local`: MongoDB và bốn mapping theo `.env.chat.example`. Khởi động lại Next sau khi đổi env.
2. Chạy kiểm tra backend:

```powershell
rtk proxy npm run chat:test
rtk proxy npx tsc --noEmit
rtk proxy npm run build
rtk proxy npm run start -- --port 3001
```

Nếu cổng 3001 đã được dùng, chọn cổng khác. Build không import/publish knowledge.

3. Mở `/play/<ObjectId nhân vật>` online, đợi câu hỏi quiz xuất hiện để có phiên server. Trong DevTools Network, tìm response server action `startQuizAction` và lấy `data.id` (PublicQuestion.id). **Không dùng `round` trên URL, ID câu hỏi trong kho ABCD hay tự tạo UUID để thay thế phiên.** Dùng cùng trình duyệt/cookie.
4. Chạy trong DevTools Console ở cùng origin:

```javascript
const sessionId = "DÁN PublicQuestion.id CỦA LƯỢT CHƠI";
await fetch('/api/chat', {
  method: 'POST', credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId, message: 'Khởi nghĩa giành chính quyền ở Hà Nội thắng lợi ngày nào?' })
}).then(r => r.json());

// Khi API trả suggestions, chọn questionId trong danh sách đó:
await fetch('/api/chat/answer', {
  method: 'POST', credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId, questionId: 'cmtt45-q017' })
}).then(r => r.json());
```

Hiện tại với phiên hợp lệ, kho chưa công bố nên nhận `out_of_scope`. Chưa đăng nhập tài khoản vẫn dùng được nếu có phiên chơi. Thiếu cookie/phiên hết hạn nhận 401. Sau khi quản trị viên duyệt và công bố qua workflow được triển khai riêng, exact/alias mới trả `answered`, typo trả `suggest`; thêm `characterId` vào payload luôn bị 400.

5. Đọc bản nháp và chạy lại kiểm tra (chỉ dry-run):

```powershell
rtk proxy npm run knowledge:validate -- --file knowledge/draft-questions-phase-2-v3.json --report knowledge/review-report-phase-2.md
rtk proxy npm run knowledge:import -- --dry-run --file knowledge/draft-questions-phase-2-v3.json --report knowledge/import-report-phase-2.json
```

Không dùng mặc định file revision 1 nếu mục đích là duyệt lời thoại mới. Script `knowledge:dialogue-drafts` dùng đề xuất trong code; muốn chạy lại hãy chọn `--file` draft gốc và `--out` chưa tồn tại. Mọi sửa đổi thủ công sau đó cần giữ draft, tăng revision khi cần và validate lại.

## 10. Những phần chưa hoàn thành

- Người quản trị chưa duyệt 40 câu, aliases, đáp án trung tính và 160 lời thoại mới, đặc biệt 18 cảnh báo nguồn; chưa có dữ liệu production approved/published.
- Chưa làm admin knowledge review/reject/publish/unpublish/audit. Không có endpoint hoặc CLI công khai để tự đặt status; không đổi JSON thành approved để lách workflow.
- Popup và UI suggestion/source/refusal/loading chưa nối API, theo yêu cầu để Phase 3.
- Chat cần mạng và phiên server; không sửa hành vi quiz/PWA/TTS offline. Phase 3 cần hiển thị trạng thái chat cần mạng, không chặn chơi offline.
- Chưa kiểm thử end-to-end trên dữ liệu thật được duyệt, race publish/revoke thực tế hoặc tải production. Các giới hạn quota là cấu hình ban đầu, chưa đo tải.

Không xem việc hoàn thành backend Phase 2 là hoàn thành toàn bộ chatbot theo định nghĩa của guide. Bước tiếp theo là quản trị viên rà soát bản nháp và triển khai workflow duyệt/công bố có phân quyền, sau đó tích hợp popup theo phạm vi được giao.
