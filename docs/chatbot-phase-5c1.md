# Phase 5C.1 — Gemini live generation

Ngày kiểm tra: 16/10/2026. Trạng thái: **live generation, Structured Outputs, matching và E2E local đã xác nhận**. Đã dùng đúng **5/5 generation calls** trong Phase 5C.1. Không deploy, không triển khai Phase 5D/5E.

## Kết luận và nguyên nhân lỗi

| Lỗi Phase 5C | Bằng chứng | Kết luận / xử lý |
| --- | --- | --- |
| `gemini-2.5-flash-lite`: HTTP 404 | Báo cáo Phase 5C ghi `provider_404`, mặc dù metadata đọc được | Model không phục vụ request generation đó. Không đủ bằng chứng để kết luận chi tiết quyền project hay vòng đời model là nguyên nhân duy nhất. Không gọi lại 2.5. Đổi model mặc định sang model đã chạy thành công. |
| `gemini-3.5-flash-lite`: `error_fallback`, 4484 ms | Báo cáo cũ không có lỗi SDK/HTTP chi tiết | Chưa xác định được root cause; không tái hiện trong đợt này. Không khẳng định do timeout, API key hay schema. |
| `gemini-3.5-flash-lite`: `unavailable`, 9698 ms | Báo cáo cũ chỉ xác định lỗi ở generation | Chưa xác định được root cause; không tái hiện. Thêm phân loại lỗi và bằng chứng an toàn cho lần lỗi tiếp theo. |

Model hoạt động: **`gemini-3.5-flash-lite`**, SDK **`@google/genai@2.30.0`**, API **`v1beta`**, phương thức **`models.generateContent`**. Không nâng SDK. Đặt API version tường minh và trim API key server; không coi hai thay đổi này là nguyên nhân đã được chứng minh của lỗi cũ.

Model xuất hiện trong danh sách API hỗ trợ `generateContent`, và các request thực tế đều HTTP 200. Google liệt kê Free Tier cho model này trong [bảng giá chính thức](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite). [Danh sách model](https://ai.google.dev/gemini-api/docs/models) mô tả giới hạn truy cập model 2.5 cho project mới. Không thay billing/plan. API thành công và metadata `serviceTier: standard` **không xác nhận billing tier thực tế của project**; muốn xác nhận điều đó cần xem AI Studio của chủ dự án.

## Kiểm tra từng tầng

| Tầng | Kết quả | Generation | Thời gian |
| --- | --- | --- | --- |
| A — đọc key server | `keyPresent=true`, không in key | 0 | — |
| B — models.list | HTTP 200; 46 model hỗ trợ generateContent | 0 | — |
| C — model khả dụng | 3.5 Flash-Lite có trong list, có Free Tier theo tài liệu, sau đó được xác nhận bằng D | 0 | — |
| D — basic text | HTTP 200, text không rỗng, finish STOP | 1 | 1156 ms |
| E — JSON Schema tối giản | HTTP 200, đúng `{ "ok": true }`, finish STOP | 1 | 841 ms |
| F — matching thật, 3 Published candidates | Chọn `cmtt45-q017` Hà Nội, không chọn q018 Huế / q019 Sài Gòn; đọc lại Published answer hợp lệ | 1 | 1275 ms tới response headers; toàn bước gồm Mongo 2689 ms |
| G — `/api/chat`, phiên chơi thật | Paraphrase → suggest q017 → click → stored persona answer | 1 | 1364 ms cho provider request |
| G — multi-intent ngoài phạm vi | Provider trả `no_match`; fallback không trả lời tự sinh | 1 | 1387 ms cho provider request |

Lưu ý minh bạch về D: artifact gốc `basic.json` ghi `expectedOk=false`, `status=unexpected_output` do assertion yêu cầu chuỗi đúng tuyệt đối `OK`. HTTP 200, text không rỗng và STOP chứng minh generation hoạt động, nhưng không chứng minh tuân thủ chuỗi `OK`. Không lưu raw text nên không suy đoán nội dung. Script đã sửa tiêu chí basic thành text không rỗng; **không chạy lại, không sửa artifact cũ**. Structured Outputs được kiểm tra riêng ở E.

## Request / response và timeout

- D: `contents: "Reply only OK."`, `maxOutputTokens: 128`, không dùng Structured Outputs.
- E: object JSON, `ok: boolean`, required `ok`, `additionalProperties: false`; MIME `application/json`, output tối đa 128 token.
- F/G giữ nguyên schema Phase 5C: required `decision` (`match|no_match`), `questionId` (`string|null`), `confidence` (0–1), `reason` (tối đa 200 ký tự), không chấp nhận field lạ. Dùng `responseJsonSchema`, `responseMimeType: application/json`, temperature 0, tối đa 256 output token.
- Request matching chỉ gửi câu hỏi người chơi cùng questionId/canonical/aliases của candidates Published. Không gửi persona answer, nguồn, phiên chơi hay thông tin định danh.
- Kết quả được parse/validate lại, kiểm tra questionId thuộc candidates, kiểm tra Published hiện hành và stored persona answer. Gemini chỉ gợi ý, không tự trả lời lịch sử.
- D/E/F timeout chẩn đoán 15000 ms. G chạy cấu hình ứng dụng; không tăng timeout để lách lỗi. SDK attempts=1, deadline dùng AbortController + Promise.race, không retry tự động.
- [Structured Outputs của Google](https://ai.google.dev/gemini-api/docs/structured-output) là tài liệu đối chiếu. Việc `generateContent` chấp nhận schema trên đã được xác nhận bằng request E/F/G, không chỉ suy ra từ tài liệu.

## Thay đổi code

| File | Thay đổi trong 5C.1 |
| --- | --- |
| `server/infrastructure/gemini-question-matcher.ts` | API version v1beta tường minh; trim key; giữ schema, abort và một attempt |
| `server/infrastructure/gemini-errors.ts` | Phân loại model/permission/key/quota/billing/timeout/SDK/schema/network/server/response/unknown; không xuất raw error |
| `server/services/chat-ai-config.ts` | Default model 3.5 Flash-Lite; feature flag vẫn tắt mặc định |
| `server/services/chat-ai-matching.ts` | Gắn failure classification an toàn, giữ fallback và API response hiện có |
| `.env.gemini.example` | Model đã kiểm chứng; flag false |
| `scripts/check-chat-ai-live.ts` | Sử dụng lỗi đã phân loại thay vì unavailable chung chung |
| `scripts/diagnose-chat-ai.ts` | Chẩn đoán theo tầng, ledger tổng tối đa 5 generation, model list và artifact an toàn |
| `scripts/support/chat-ai-live-budget.mjs` | Preloader chỉ dành cho server kiểm thử được opt-in; chặn call thứ sáu trước network |
| `tests/chat-ai-errors.test.mjs` | Test các loại lỗi và che thông tin nhạy cảm |
| `tests/chat-ai.test.mjs` | Kiểm tra API version ở SDK request |
| `tests/chat-ai-live.browser.mjs` | E2E Edge local, bốn persona, hai generation còn lại, cache và quota |
| Hai báo cáo `docs/chatbot-phase-5c1.*` | Kết quả và giới hạn kiểm chứng |

Thông báo lỗi trong diagnostics là mô tả cố định đã chuẩn hóa, **không phải trích nguyên văn SDK**. Giữ HTTP status, provider status/reason dạng mã khi đọc được. Không suy ra invalid key từ mọi HTTP 403; không suy ra Free quota từ mọi HTTP 429. Không log key, URL có credential, raw prompt hoặc nội dung response của người chơi.

## Kết quả kiểm thử

- TypeScript `npx tsc --noEmit`: pass.
- ESLint các file thay đổi 5C.1: pass.
- Production build `npm run build`: pass; không deploy.
- Chatbot unit/repository/API tests: **59/59 pass**, bao gồm timeout abort không retry, HTTP 429 fallback, schema invalid, stale Published/revoke, session validation, cache và quota đồng thời.
- Browser live: **11/11 nhóm pass**, Edge headless, desktop 1440×900 và một phiên mobile 390×844.
- Bốn nhân vật: Trường Chinh, Lê Duẩn, Phạm Văn Đồng, Võ Nguyên Giáp. Mỗi nhân vật exact + alias không gọi Gemini; paraphrase gợi ý Hà Nội; click trả đúng nguyên văn stored answer tương ứng. Quiz giữ nguyên, phần nguồn tài liệu vẫn ẩn.
- G lần đầu dùng generation #4; ba persona tiếp theo dùng cache đã kiểm tra lại Published, không phát sinh generation. Không tuyên bố đã gọi Gemini riêng bốn lần.
- Pizza ngoài tài liệu → out_of_scope, không generation. Câu trộn Hà Nội và dự báo thời tiết → generation #5 trả no_match. Câu tiếp theo gặp quota ứng dụng → legacy fallback, không call #6.
- Timeout và quota Google 429 được kiểm thử bằng mock; **không cố gây timeout hoặc tiêu hết quota Google bằng request thật**. Quota ứng dụng đã kiểm tra live.

Lệnh unit tests đã chạy (đều prefix `rtk proxy`):

```powershell
rtk proxy node --test tests/chat-ai-errors.test.mjs tests/chat-ai.test.mjs tests/chat.test.mjs tests/chat-repositories.test.mjs tests/chat-dialogue.test.mjs tests/chat-demo.test.mjs
rtk proxy npx tsc --noEmit
rtk proxy npm run build
```

Artifact local: `.local/chat-phase-5c1/{models,basic,structured,matching,e2e}.json`, `generation-ledger.json`, `e2e-generation.jsonl`, `unit-tests.tap`, `e2e-desktop.png`, `knowledge-before.json`, `knowledge-after.json`. TAP do PowerShell lưu UTF-16. Các artifact local không chứa API key và không được commit.

## Dữ liệu và trạng thái sau kiểm thử

MongoDB `vo_danh`: 59 logical questions; 74 revisions (60 approved, 14 draft); 59 Published/readable; 134 knowledge audit records; không orphan/broken pointer. **Count và SHA-256 nội dung của cả ba collection knowledge trước/sau giống hệt**. Không sửa 59 Published questions.

Phiên chơi/chat thông thường tạo dữ liệu vận hành session binding, cache và quota theo kiến trúc hiện có; không xóa/reset chúng sau test. Quota thử nghiệm dùng hai lượt trong ngày UTC hiện tại; nếu tái sử dụng cùng counter cần tính đến hai lượt này.

Chủ dự án đã đồng ý bật tạm trên **localhost:3013**. Flag/model/quota chỉ override trong process thử nghiệm, không ghi `.env.local`. Đã tắt process và kiểm tra port 3013 không còn lắng nghe. Cấu hình lâu dài vẫn `CHAT_AI_MATCHING_ENABLED=false`; key có sẵn, GEMINI_MODEL chưa khai báo nên code dùng default mới khi được bật sau này.

## Cấu hình cần thiết và chạy lại

Các biến server-only trong `.env.gemini.example`:

```dotenv
GEMINI_API_KEY=<điền riêng trên server, không commit>
GEMINI_MODEL=gemini-3.5-flash-lite
CHAT_AI_MATCHING_ENABLED=false
CHAT_AI_AUTO_ANSWER=false
CHAT_AI_TIMEOUT_MS=5000
CHAT_AI_MAX_CANDIDATES=8
CHAT_AI_CALLS_PER_MINUTE=5
CHAT_AI_CALLS_PER_DAY=100
CHAT_AI_CACHE_TTL_SECONDS=3600
CHAT_AI_NO_MATCH_TTL_SECONDS=120
```

`CHAT_AI_AUTO_ANSWER` không được dùng để bật tự trả lời. Không cần biến API version: v1beta đã được pin trong infrastructure. Không đặt key ở biến NEXT_PUBLIC.

Có thể chạy lại unit tests/TypeScript/build mà không gọi Gemini. Lệnh chỉ đọc model list:

```powershell
rtk proxy node --conditions=react-server --import tsx scripts/diagnose-chat-ai.ts --stage=models --model=gemini-3.5-flash-lite
```

**Không chạy lại basic/structured/matching/live browser bằng ledger hiện tại: đã hết ngân sách 5 lượt. Không xóa ledger để vượt giới hạn.** Script browser chỉ chấp nhận ledger=3 và server diagnostic opt-in. Muốn một đợt live mới cần chủ dự án xác nhận ngân sách riêng; lưu artifact cũ và dùng một đợt chẩn đoán mới có giới hạn rõ ràng. Script smoke cũ không chia sẻ ledger này nên không được dùng để gọi thêm trong đợt hiện tại.

## Chưa kiểm chứng / giới hạn

- Root cause chính xác của hai lỗi 3.5 trước đây vẫn chưa biết; đợt này không tái hiện.
- Chưa xác nhận billing tier/quota cấp project trong AI Studio. Không có quyền tự đổi billing.
- Chưa chạy benchmark live toàn bộ 120 câu; không suy rộng chất lượng matching từ một positive và một negative live.
- Chưa thử keyboard iOS/camera thật hay tải đồng thời trên production.
- Không có MongoDB test URI riêng; không chạy integration có ghi vào database test. E2E dùng phiên thật và Published thật, không chỉnh knowledge.
- Không chạy lại full-repository lint/test ngoài phạm vi; các lỗi baseline ở Phase 5C không được coi là đã sửa trong 5C.1.
- Không có thay đổi matching threshold, API schema, bảo mật phiên, admin workflow, quiz/QR/TTS/PWA/payment. Dừng ở 5C.1; mọi bật cờ lâu dài cần sự đồng ý riêng của chủ dự án.
