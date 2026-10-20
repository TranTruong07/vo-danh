# Phase 5C — Gemini-assisted Question Matching

Ngày báo cáo: 16/10/2026 (Asia/Bangkok).

**Đã triển khai code, mock tests và kiểm thử hồi quy. Chưa xác nhận Gemini generation hoạt động với project hiện tại; chưa bật feature trên website.** Dừng ở Phase 5C, không deploy, không thực hiện Phase 5D/5E.

## Khảo sát và phạm vi

Đã đọc guide, Phase 4 demo/test report, knowledge pipeline, các quy tắc `.agents/rules/`, module service/repository/domain/session/quota/HTTP/client/popup và tài liệu Next.js cài trong repo. Không có `docs/chatbot-phase-5b.md`.

Yêu cầu Phase 5C của chủ dự án thay thế quy tắc cũ “không LLM runtime” **chỉ cho matching**. Không cho Gemini sinh câu trả lời lịch sử. Không sửa 59 câu Published, workflow duyệt, schema API, UI popup, quiz, QR, TTS, PWA hoặc thanh toán. Phần nguồn tài liệu đã được bỏ khỏi popup tiếp tục được giữ như vậy.

Trước thay đổi:

- `sendChatMessage`: kiểm tra payload, lấy hash cookie, áp quota, resolve phiên trên server, đọc index Published.
- `matchChatQuestion`: normalized exact canonical/alias duy nhất trả đáp án; Fuse.js threshold 0,25 chỉ trả tối đa 3 gợi ý; không có kết quả thì refusal theo persona.
- Published index dùng `knowledge_questions.publishedVersionId`, join đúng revision/question, `approved`, reviewer/reviewedAt hợp lệ và đủ bốn lời đáp.
- Character lấy từ phiên quiz/chat ready, đúng owner, chưa hết hạn và mapping server. Không tin `characterId` client.
- Quota chat giữ nguyên: player 20/phút, global 300/phút, bộ đếm MongoDB chung.

Sau thay đổi:

```text
validate payload / origin / cookie / session / chat quota (giữ nguyên)
  -> index approved + published
  -> exact/alias duy nhất -> stored persona answer (không Gemini)
  -> không chắc chắn
       -> flag tắt / thiếu key / không có candidate -> legacy
       -> 2 tầng lấy tối đa 8 candidate Published
       -> cache SHA-256 + quota Gemini riêng trên MongoDB
       -> tối đa 1 generation bằng SDK Google, không tools
       -> validate schema + ID + re-read publication + persona + lexical guard
       -> suggest, người chơi bấm /api/chat/answer
       -> stored answer được kiểm tra Published lần nữa
```

## Model, SDK và cấu hình

- SDK chính thức `@google/genai` 2.30.0, lazy import/client trong module `server-only`.
- Default giữ đề xuất `gemini-2.5-flash-lite`; cho phép đổi `GEMINI_MODEL`.
- Key đã hiện diện phía server. Metadata model 2.5 đọc được nhưng generation trả 404. Google hiện giới hạn 2.5 cho project/người dùng đã sử dụng trước; [tài liệu model](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite).
- Đã thử `gemini-3.5-flash-lite`: metadata đọc được, hai generation chưa thành công. Chưa kết luận nguyên nhân cụ thể. Đây là model có Free Tier được liệt kê trong [bảng giá chính thức](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite), nhưng metadata API không xác nhận billing tier hoặc quota của tài khoản.
- Không bật billing, không đổi plan, không tạo key, không sửa `.env.local`. Không tự chuyển model ở runtime sau lỗi.

Tạo/quản lý key tại [Google AI Studio](https://aistudio.google.com/apikey), chọn project và kiểm tra API/quota tại đó. Lưu `GEMINI_API_KEY` trong cấu hình server, không đặt tiền tố `NEXT_PUBLIC_`, không gửi vào chat/log/commit. Sao chép cấu hình mẫu từ `.env.gemini.example`:

| Biến | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `GEMINI_API_KEY` | rỗng | Chỉ server |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` | Model do người vận hành chọn và kiểm tra |
| `CHAT_AI_MATCHING_ENABLED` | `false` | Phải chính xác `true` và có key mới chạy |
| `CHAT_AI_AUTO_ANSWER` | `false` | Không được đọc; đặt `true` cũng không auto-answer |
| `CHAT_AI_TIMEOUT_MS` | 5000 | 100–15000 ms |
| `CHAT_AI_MAX_CANDIDATES` | 8 | 1–12 |
| `CHAT_AI_CALLS_PER_MINUTE` | 5 | 0–100; 0 tắt generation |
| `CHAT_AI_CALLS_PER_DAY` | 100 | 0–10000; ngày UTC |
| `CHAT_AI_CACHE_TTL_SECONDS` | 3600 | Cache match, 60–86400 giây |
| `CHAT_AI_NO_MATCH_TTL_SECONDS` | 120 | 1–300 giây; luôn nhỏ hơn TTL match |

Giá trị số sai được hạ về mức tối thiểu an toàn, không tự nới quota. Quota ứng dụng không phải cam kết quota Free Tier của Google. Kiểm tra [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) trước khi bật. Free Tier có chính sách sử dụng dữ liệu để cải thiện sản phẩm; payload được giảm tới câu hỏi và metadata câu hỏi ứng viên, không gửi answers, nguồn, session/cookie/IP/user ID.

## Retrieval và validation

1. Giữ thứ tự các ID từ legacy, chỉ resolve trong Published index.
2. Bổ sung lexical retrieval: token không dấu, một số viết tắt thông dụng, bỏ stop words, trọng số tần suất tài liệu. Không sửa normalization của exact hoặc Fuse threshold. Có thể lấy ID nằm ngoài legacy top 3.
3. Loại ID trùng, cap mặc định 8. Chỉ gửi `{questionId, canonicalQuestion, aliases}` cùng question, không gửi revision IDs hoặc bất cứ lời đáp nào lên Gemini.
4. Prompt quy định chỉ chọn một ID hoặc no_match, bảo toàn khác biệt ngày, địa danh, người, tổ chức, sự kiện, nguyên nhân/kết quả, phủ định, các giai đoạn. Câu người chơi/candidate đều là dữ liệu không đáng tin, không phải chỉ dẫn. Không cấp tools hay quyền DB.
5. Structured output JSON Schema; runtime validator kiểm tra đúng bốn field, enum, ID thuộc candidate, confidence 0–1, reason tối đa 200 ký tự, tổng text tối đa 4096 ký tự. Output tokens tối đa 256. Confidence không được coi là xác suất đúng hoặc tự cho phép trả lời.
6. Sau generation/cache hit/no_match/quota, đọc lại Published index. ID chọn phải giữ nguyên revision và metadata, có approved Published answer đúng persona. Nếu đã republish/unpublish hoặc mất answer thì bỏ kết quả Gemini.
7. Guard bảo thủ cho địa danh/nhân vật, năm/ngày tường minh và phủ định. Đây không phải bộ kiểm chứng sự thật: có thể bỏ gợi ý đúng, không xử lý đầy đủ mọi cách diễn đạt đa ý.
8. Chỉ trả `suggest`: selected ID đứng đầu và tối đa 2 legacy suggestion còn Published. Không gửi confidence/reason/diagnostics ra API. Kể cả index mới tạo exact trong lúc chờ, nhánh AI vẫn chỉ suggest.

Chuỗi có email, URL, số liên lạc dài hoặc token rõ ràng bị giữ ở legacy, không chuyển ra provider. Đây chỉ là giảm thiểu, không phải hệ thống phát hiện mọi PII; không có lớp xóa/thay ý nghĩa câu hỏi tự do.

## Cache, quota và fallback

- Collection mới `chat_ai_match_cache`: `_id` hash, `{decision, questionId}`, `expiresAt`; TTL index, đồng thời kiểm tra hạn khi đọc. Không lưu raw query, reason, answer hay dữ liệu người chơi.
- Hash gồm normalized question, ordered candidates với ID/revision/canonical/aliases, model và prompt version `5c-1`. Republish đổi revision làm đổi key; mọi hit vẫn revalidate.
- Dùng `chat_limits` hiện có với key riêng `gemini:minute:*` và `gemini:day:*`. Atomic increment MongoDB chia sẻ giữa instances; fail closed khi storage không hoạt động. Reservation bị từ chối cũng có thể được tính để bảo thủ, không hoàn quota khi generation thất bại.
- Tối đa một generation/request; SDK `retryOptions.attempts=1`, AbortController + deadline. Không tự retry 429/503, không tự đổi model. Chưa thêm circuit breaker riêng; quota 5/phút giới hạn cả lúc lỗi liên tục.
- Cache/quota/provider lỗi, JSON sai, ID giả, no_match, stale revision: quay về legacy trên index mới. Nếu không thể đọc lại index, refusal an toàn. Không để lỗi provider biến chat đang hoạt động thành HTTP 500.
- Chưa có distributed single-flight: nhiều request đồng thời cùng câu có thể gọi trùng trước khi cache được ghi, nhưng vẫn chịu quota chung.

## File thay đổi

| File | Vai trò |
| --- | --- |
| `package.json`, `package-lock.json` | SDK Google |
| `.gitignore`, `.env.gemini.example` | Theo dõi sample không có key |
| `server/services/chat.ts` | Nối nhánh gợi ý AI sau exact, giữ API |
| `server/domain/chat-ai.ts` | Prompt/schema/validator/guard |
| `server/services/chat-ai-config.ts` | Cấu hình server |
| `server/services/chat-ai-candidates.ts` | Retrieval hai tầng |
| `server/services/chat-ai-matching.ts` | Orchestration/cache/quota/revalidation/fallback |
| `server/infrastructure/gemini-question-matcher.ts` | SDK lazy, JSON schema, timeout, một attempt |
| `server/repositories/chat-ai-cache.ts` | Cache MongoDB riêng |
| `tests/chat-ai.test.mjs` | 25 nhóm unit/mock tests |
| `tests/chat.test.mjs` | Cố định AI tắt trong fixture baseline, tránh API thật nếu shell có key |
| `tests/fixtures/chat-ai-benchmark.ts` | 120 câu thử độc lập |
| `scripts/benchmark-chat-ai.ts` | Benchmark chỉ đọc, không Gemini |
| `scripts/check-chat-ai-live.ts` | Smoke opt-in, tối đa 3 generation |
| `docs/chatbot-phase-5c.md` | Báo cáo này |
| `docs/chatbot-phase-5c-test-report.json` | Kết quả kiểm thử |
| `docs/chatbot-phase-5c-benchmark.md` | Phương pháp, số liệu, giới hạn |
| `docs/chatbot-phase-5c-benchmark-results.json` | Kết quả từng mẫu + locator |

Không tạo endpoint mới. `POST /api/chat`, `/answer`, `/suggestions` giữ contract/auth/origin/quota cũ. Không sửa frontend.

## Kết quả kiểm thử

- TypeScript và ESLint toàn bộ file thay đổi đạt.
- Production build đạt; không deploy. 75 file client build đã được kiểm tra: không chứa giá trị API key.
- 25/25 test mới đạt, gồm exact/alias bypass, suggest-only, no_match, ID giả, invalid JSON, timeout thực sự abort mock SDK, 429/503/network/key/model error, cache, revision thay đổi, quota, session, four personas và cờ auto-answer không có hiệu lực.
- 32/32 test chatbot cũ đạt, bao gồm repository lọc draft/rejected/unpublished/cross-question, HTTP validation, session và quota.
- Toàn bộ unit regression: **157 pass, 5 fail, 1 skip / 163**. Năm lỗi có sẵn trong `tests/auth.test.mjs`: loader tìm `server/services/character.ts` không tồn tại. Integration knowledge MongoDB skip vì không có `MONGODB_TEST_URI` trong môi trường test. Không dùng production làm test database.
- Full ESLint còn 5 lỗi baseline `no-assign-module-variable` trong các loader test và 2 warnings ở `app/author/page.tsx`, `.local/knowledge-coverage-audit.mjs`; không sửa ngoài phạm vi.
- Edge headless UX: **17/17 nhóm** trên 1440×900, 390×844, 375×667; source UI vẫn ẩn; scroll, retry, IME, offline/rate-limit/session error, keyboard viewport giả lập, đóng/mở giữ quiz và bốn persona đạt.
- Edge regression Phase 4: **16/16 nhóm** gồm QR/image, published answer, owner/session, quota, cached/offline quiz và chat recovery. Các browser test chạy với Gemini tắt; nhánh bật kiểm tra bằng service/transport mocks, chưa có live browser generation thành công.
- Live: 3 generation đều fallback; không xác nhận Gemini matching thành công. Đã đọc 59 Published, fingerprint hai collection knowledge trước/sau các smoke không đổi. Script sau rà soát đã bổ sung đúng `knowledge_audit` vào fingerprint cho lần chạy tiếp theo; ba smoke trước chưa kiểm kê audit riêng.
- Chỉ metadata cache/quota chatbot có thể được tạo/ghi khi chạy smoke. Không có đường ghi knowledge trong implementation.

Các artifact local: `.local/chat-phase-5c/`, `.local/chat-phase-5a/`, `.local/chat-demo/`. Chưa kiểm thử camera thật hoặc bàn phím Safari/iPhone thật; mô phỏng VisualViewport không thay thế thiết bị thực.

## Benchmark và việc còn lại

Chi tiết: [benchmark](chatbot-phase-5c-benchmark.md). Legacy Top-1 48,35%, Recall@3 41,56% trên 91 mẫu có nhãn đủ rõ; Candidate Recall@8 77/77 trên bộ này. **Chưa có số liệu chất lượng Gemini trên 120 câu, không tuyên bố cải thiện.**

Trước khi bật demo AI cần:

1. Xác nhận một model thật sự generate được với key/project và quota hiện có. 2.5 trả 404; 3.5 có metadata nhưng generation thất bại chưa rõ nguyên nhân.
2. Kiểm tra lại bằng một số lời gọi có kiểm soát, không tự chạy full benchmark hoặc nâng billing.
3. Rà soát 29 nhãn chưa chắc chắn; nếu được cho phép ngân sách benchmark, đo chất lượng end-to-end thay vì lấy Recall@8 làm độ chính xác AI.
4. Kiểm thử live trong popup sau khi provider hoạt động. Các lỗi fallback legacy có thể vẫn gợi ý sai địa danh; chỉ người chơi chọn câu cụ thể mới lấy đáp án.

Không tự thay đổi dữ liệu Published để sửa benchmark. Không coi kiểm tra kỹ thuật là quyền approve lịch sử.

## Chạy thử và rollback

```powershell
rtk proxy node --test tests/chat-ai.test.mjs tests/chat.test.mjs tests/chat-repositories.test.mjs tests/chat-dialogue.test.mjs tests/chat-demo.test.mjs
rtk proxy npx tsc --noEmit
rtk proxy npm run build
rtk proxy node --conditions=react-server --import tsx scripts/benchmark-chat-ai.ts

# Opt-in riêng khi muốn dùng quota API, không sửa cấu hình website:
rtk proxy node --conditions=react-server --import tsx scripts/check-chat-ai-live.ts --live --model=gemini-3.5-flash-lite --limit=1 --timeout=10000
```

Khi đã xác nhận provider hoạt động, người vận hành đặt `GEMINI_MODEL` phù hợp và `CHAT_AI_MATCHING_ENABLED=true`, giữ `CHAT_AI_AUTO_ANSWER=false`, restart server. Mở QR một trong bốn nhân vật, mở chatbot, thử exact/alias rồi câu diễn đạt khác, chọn gợi ý để lấy stored answer. Kiểm tra cả flag tắt và quota bằng 0; chatbot phải giữ fallback.

Rollback tức thời: đặt `CHAT_AI_MATCHING_ENABLED=false`, restart. Không cần xóa collection, migration hay sửa Published data. Cache tự hết hạn. Nếu bỏ code ở commit sau, chỉ hoàn nguyên các file Phase 5C, không reset các thay đổi khác của dự án.

Tài liệu SDK/schema: [Google GenAI](https://ai.google.dev/gemini-api/docs), [Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output). Không dùng LLM sinh lời đáp lịch sử hoặc tạo nhãn đánh giá.
