# Phase 5C.3B — Vietnamese Matching & Resilient Fallback

Hoàn thành ngày 16/10/2026, development. **0 Gemini live calls, 0 knowledge writes.** Giữ model `gemini-3.5-flash-lite`, API `v1beta`, timeout 5000 ms và `CHAT_AI_AUTO_ANSWER=false`. Không đổi `.env.local`, billing, feature flag hoặc ledger cũ.

## Kết quả chính

Đã triển khai ranking tiếng Việt và fallback nội bộ. Khi Gemini lỗi, chatbot gợi ý tối đa ba câu Published đủ điều kiện; nếu không đủ chắc chắn, yêu cầu diễn đạt lại và không gắn nhãn “ngoài phạm vi” cho lỗi provider. Chỉ exact/alias duy nhất hoặc thao tác chọn gợi ý mới đọc stored persona answer.

**115/115 unit/regression tests pass, TypeScript pass, lint các file trong phạm vi pass, Next production build pass** trong bản sao riêng. Chưa chạy browser E2E hoặc API Gemini live trong phase này.

Benchmark cho thấy độ chính xác gợi ý tăng trong các mẫu thử, nhưng **Candidate Recall@8 trên bộ cũ giảm 19/19 → 14/19**. Đây là đánh đổi có thật của bộ lọc thận trọng; không tuyên bố cải thiện mọi mặt hoặc hỗ trợ mọi cách diễn đạt tiếng Việt.

Báo cáo máy đọc: [chatbot-phase-5c3b-test-report.json](chatbot-phase-5c3b-test-report.json).

## Hệ thống đã đọc và luồng hiện tại

Đã đọc `CODEX_IMPLEMENTATION_GUIDE.md`, `.agents/rules/`, báo cáo Phase 5C.2, 5C.3A và JSON kết quả; khảo sát matcher, candidate retrieval, Gemini orchestration/transport/config, cache, quota, API/service/session/repository và popup/client. Đọc hướng dẫn Route Handler của bản Next.js đang cài trong `node_modules/next/dist/docs/`.

Luồng giữ nguyên:

```text
QR → phiên chơi/binding trên server → popup → POST /api/chat
  → validate payload + cookie/session + rate limit
  → Published index (approved + publishedVersionId)
  → exact/alias duy nhất → đọc lại Published answer của persona server đã xác định
  → ranking nội bộ → Gemini cache/quota/matching nếu đủ điều kiện
  → gợi ý / yêu cầu làm rõ / từ chối ngoài phạm vi rõ ràng
Click gợi ý → /api/chat/answer → xác thực lại phiên + Published → stored persona answer
```

Không đổi schema MongoDB, approval/publish, quiz, QR, TTS, PWA, payment hoặc session security. Hướng dẫn ban đầu cấm LLM runtime đã được yêu cầu Phase 5C về Gemini-assisted matching thay thế; vẫn tuyệt đối không sinh đáp án lịch sử từ Gemini.

## Matching tiếng Việt mới

`server/services/chat-vietnamese-ranking.ts` là module thuần, không DB/LLM:

1. Exact vẫn dùng NFC/case/whitespace/dấu câu theo normalizer hiện có, **giữ dấu tiếng Việt và từ phủ định**. Không đưa normalization fuzzy vào đường auto-answer.
2. Ranking dùng văn bản bỏ dấu, chuẩn hóa một số cụm tương đương về ngôn ngữ như “thắng lợi/thành công”, “đầu hàng/chịu thua”, “khởi nghĩa/nổi dậy”, “thành lập/ra đời”; so từ với tối đa một phép chèn/xóa/thay ký tự cho từ đủ dài, không sửa số.
3. Bỏ từ đệm và giảm tác dụng của các từ chung. Chỉ “cách mạng”, “tháng Tám”, “1945” không đủ tạo gợi ý. Cần ít nhất hai token có nội dung chung.
4. Điểm từng canonical/alias = `0.85 × weighted query coverage + 0.15 × overlap/max(lengths)`. Trọng số token là `log(1 + số câu / document frequency)`. Lấy điểm tốt nhất của từng câu, không nối các đáp án hoặc tạo dữ kiện.
5. Bộ lọc đối chiếu địa danh/nhân vật, ngày-tháng/năm, phủ định, chủ quan/khách quan, quốc tế/trong nước và động tác ban bố/đọc Quân lệnh. Không hardcode quan hệ “ngày nào thuộc thành phố nào”: chỉ kiểm tra bằng chứng trong canonical/aliases Published. Thiếu bằng chứng ngày/năm cụ thể thì loại thận trọng.
6. Hỗ trợ ngày số dạng `19/8`, `19-8`, `19 tháng 8 năm 1945`. Ngày viết hoàn toàn bằng chữ và phủ định đối chiếu phức tạp còn hạn chế. Khi một câu nhiều ý không được một candidate bao phủ đủ, ưu tiên làm rõ, không ghép lời đáp.
7. Retrieval tối đa 8; fallback tối đa 3 với cả score và coverage ≥ **0.78**. Không thêm câu để đủ ba gợi ý. Gemini chọn ID vẫn phải vượt guard metadata và kiểm tra Published/persona lại.

Đây là bộ lọc lexical, không phải bộ kiểm chứng sự kiện lịch sử. Exact vào nội dung đã duyệt vẫn theo workflow cũ. Metadata tốt hơn hoặc aliases mới cần admin duyệt riêng; phase này không sửa 59 câu.

### Chọn ngưỡng bằng benchmark

Tuning dùng 21 câu có nhãn của bộ cũ + 16 câu mới, tổng 37 ca. Ba nhãn `5c-027`, `5c-028`, `5c-115` giữ nguyên và không tính điểm. Thử grid `[0.65, 0.70, 0.75, 0.78, 0.80, 0.85, 0.90, 0.95]`:

| Ngưỡng | Gợi ý đúng / tổng gợi ý | Ca có gợi ý sai / 37 | Positive recall |
| --- | --- | --- | --- |
| 0.65 / 0.70 | 19/20 | 1/37 | 19/28 |
| 0.75 | 17/18 | 1/37 | 17/28 |
| **0.78 / 0.80** | **17/17** | **0/37** | **17/28** |
| 0.85 | 16/16 | 0/37 | 16/28 |
| 0.90 / 0.95 | 14/14 | 0/37 | 14/28 |

Chọn ngưỡng thấp nhất trong grid không có false suggestion trên tuning: 0.78. Không giảm ngưỡng để tăng recall. Các trọng số và luật là heuristic kỹ thuật, không phải xác suất đúng 78%.

Bổ sung **40 ca**: 16 tuning + 24 holdout được định nghĩa trước khi tuning, gồm positive/negative/adversarial. Không điều chỉnh synonym/ngưỡng theo kết quả holdout. Sau đó có bổ sung bảo vệ parser ngày thiếu chữ “ngày” và năm thiếu bằng chứng khi rà soát code; các tỷ lệ holdout không thay đổi. Holdout do cùng người triển khai soạn, không phải tập người dùng bên ngoài hoặc đánh giá mù; cần tập độc lập ngoài dự án ở giai đoạn sau.

## Fallback và tương thích API

| Trường hợp | Hành vi |
| --- | --- |
| Exact hoặc normalized alias duy nhất | Đọc stored answer, không Gemini/cache/quota Gemini |
| Cache hit hợp lệ | Không generation; kiểm tra lại Published và guard |
| HTTP 504, timeout, 429, 503, network/cache/quota lỗi, JSON không hợp lệ | Không retry; đọc lại Published index; dùng ranking fallback |
| Quota nội bộ hết | Không gọi provider; vẫn fallback |
| Có candidate đủ tin cậy | `status: suggest`, tối đa 3 ID + canonical Published |
| Không đủ tin cậy sau lỗi provider | `status: suggest`, `suggestions: []`, `reason: provider_unavailable`, thông báo hỏi rõ hơn |
| Mơ hồ/generic/nhiều ý chưa đủ căn cứ | `status: suggest`, danh sách rỗng, `reason: clarify` |
| Ngoài phạm vi rõ ràng theo bộ lọc lexical | Refusal persona cố định; không sinh lịch sử |

`ChatResponse` chỉ bổ sung **optional** `message` và `reason` trên nhánh `suggest`; không tạo status mới. Client cũ vẫn đọc được status/danh sách nhưng có thể dùng câu dẫn chung; client hiện tại dùng `chatResponseText()` để hiển thị thông báo chính xác, không hiện nhãn “Ngoài phạm vi” cho fallback thiếu gợi ý.

Không có retry tự động hoặc chuyển model. Mỗi lần chat có tối đa một generation như cũ; cache/quota vẫn là cơ chế chung hiện hữu. Cache key thêm `ranking: 5c3b-1` để quyết định từ policy cũ không được dùng lại; không xóa/reset collection hoặc ledger. Thay policy có thể làm tăng cache miss sau khi đưa code vào demo, vẫn chịu giới hạn quota cũ. Production matcher, API version, timeout, model và prompt/schema Gemini không thay đổi.

## Benchmark trước/sau

Baseline đóng băng code matcher/retrieval trước phase và metadata 59 Published trong `tests/fixtures/chat-matching-baseline-5c3b.json`. Không dùng draft thay Published. Cùng snapshot, câu hỏi và nhãn cho trước/sau; không gọi DB hoặc Gemini khi benchmark.

Định nghĩa:

- **Top-1**: ID đầu đúng; với nhãn rỗng thì đúng khi không gợi ý, chia tổng ca được chấm. Cột trước là Legacy Top-1, cột sau là ranking fallback mới; đây không phải accuracy của auto-answer.
- **Recall@8**: ca positive có ID kỳ vọng trong tám ứng viên / số ca positive.
- **Fallback Precision@3**: slot gợi ý đúng / tổng slot thực sự phát ra, mỗi ca tối đa ba slot; không đệm danh sách cho đủ ba.
- **False suggestion rate**: ca có ít nhất một ID sai / toàn bộ ca được chấm. JSON có thêm tỷ lệ trên riêng ca có gợi ý.
- **Out-of-scope rejection**: ca ngoài phạm vi không có gợi ý / số ca ngoài phạm vi. Từ chối gợi ý có thể là yêu cầu làm rõ, không nhất thiết status `out_of_scope`.

| Chỉ số | Bộ cũ: 21 scored, trước → sau | Tuning mới: 16, trước → sau | Holdout mới: 24, trước → sau |
| --- | --- | --- | --- |
| Top-1 | 6/21 (28,57%) → 11/21 (52,38%) | 5/16 → 15/16 | 13/24 (54,17%) → 22/24 (91,67%) |
| Recall@8 | **19/19 → 14/19 (73,68%)** | 9/9 → 9/9 | 11/11 → 11/11 |
| Fallback Precision@3 | 4/5 (80%) → 9/9 | 2/12 → 8/8 | 5/17 (29,41%) → 9/9 |
| False suggestion rate | 1/21 → 0/21 | 7/16 → 0/16 | 6/24 → 0/24 |
| Out-of-scope rejection | 2/2 → 2/2 | 2/2 → 2/2 | 3/4 → 4/4 |
| Từ chối gợi ý mọi ca negative | 2/2 → 2/2 | 3/7 → 7/7 | 8/13 → 13/13 |
| Positive suggestion recall | 4/19 → 9/19 | 2/9 → 8/9 | 5/11 → 9/11 |

Các tỷ lệ 100% chỉ áp dụng mẫu này. Trên tổng 61 ca được chấm, có 26 gợi ý và đều đúng theo nhãn; còn 13/39 ca positive chưa được fallback gợi ý. Không sửa nhãn ba ca đang chờ duyệt để thay đổi số liệu.

### Những câu còn bỏ sót

Không có false suggestion mới trong các ca được chấm, nhưng có các false negative sau; nội dung nguyên văn và candidate IDs có trong JSON:

| ID | Dạng câu / khoảng trống |
| --- | --- |
| `5c-001` | Hỏi “tính chất” cuộc cách mạng bằng diễn đạt dài; thiếu tương đồng lexical |
| `5c-005` | Hai mốc đầu hàng của Nhật + “cùng ngày không”; bộ lọc phủ định quá thận trọng |
| `5c-007`, `5c-015` | “Bác nhắc lại được không” bị coi như phủ định nội dung |
| `5c-008` | “Nhật đảo chín Pháp…”; có candidate nhưng chưa đủ điểm fallback |
| `5c-016` | “Nguyen Ai Quoc ve nuoc lan nay…”; candidate có, chưa đạt ngưỡng |
| `5c-036` | “Khởi ngĩa ở Huế thắng…”; từ viết tắt/mất từ chưa đủ bằng chứng |
| `5c-039` | “Mùng hai tháng chín…”; chưa chuẩn hóa toàn bộ ngày bằng chữ |
| `5c-045` | Câu đính chính Lê Duẩn dài có phủ định; candidate có nhưng chưa đủ điểm |
| `5c-052` | “Đọc … chứ không phải … ban bố”; chưa phân tích phạm vi phủ định |
| `5c3b-005` | Diễn đạt dài việc đọc Quân lệnh; có candidate nhưng không đủ điểm |
| `5c3b-036`, `5c3b-037` | Holdout: bài học chớp thời cơ và câu không dấu về nguyên nhân khách quan; candidate có, fallback từ chối |

Năm ca cũ mất expected ID khỏi retrieval là `001`, `005`, `007`, `015`, `052`. Không gỡ các guard chỉ để khôi phục recall. Hướng cải thiện cần duyệt: parser phạm vi phủ định/lời nhờ hỏi, biểu diễn ngày bằng chữ, thêm corpus ngoài người triển khai; không tự thêm aliases hay sửa lịch sử.

### Hiệu năng offline

Đo matcher + retrieval local sau warmup, một lần mỗi ca; P50/P95 nearest rank, không bao gồm DB, cache, network hoặc 5000 ms chờ Gemini:

| Bộ | Trước P50/P95 (ms) | Sau P50/P95 (ms) |
| --- | --- | --- |
| Bộ cũ | 15,76 / 25,87 | 11,93 / 16,68 |
| Tuning mới | 13,17 / 19,00 | 9,66 / 14,60 |
| Holdout mới | 13,22 / 14,04 | 10,07 / 15,51 |

P50 giảm ở lần đo này; P95 holdout tăng khoảng 1,47 ms. Không tuyên bố nhanh hơn chắc chắn hoặc tốt hơn về tail latency; mẫu nhỏ và phụ thuộc tải máy. Orchestration có thể tính lại ranking khi re-read Published, chưa benchmark tải đồng thời hoặc ngân hàng lớn hơn 59 câu.

## Kiểm thử

- 115/115 test pass: 53 test mới, 62 regression/metric hiện có.
- Mock 504, timeout, 429, 503, JSON sai, quota exhausted; không retry, không đưa provider output vào lời đáp.
- Exact/alias bypass, cache miss/hit, quota chung, key cache đổi theo policy, mock Published revalidation/revoke, session/cookie/origin/payload checks, cả bốn persona.
- Guard địa danh/ngày/phủ định/Quân lệnh/nhiều ý/out-of-scope; test không auto-answer fuzzy.
- API regression dùng Web Request + HTTP handler/service thật với repositories/transport giả lập, không phải server Next E2E. UI kiểm tra client/formatter, chưa browser/device test.
- TypeScript `npx tsc --noEmit`: pass. ESLint toàn bộ file code/tooling/test của phase: pass.
- Next.js 16.3.6 production **webpack** build: pass trong workspace riêng không có `.env.local`, fetch bị chặn. Không chạy script post-build PWA; `.next` và PWA assets của dự án chính giữ nguyên.
- Build lần đầu thiếu thư mục `actions` trong harness sao chép và fail; đã bổ sung đầy đủ thư mục, chạy lại pass. Không sửa admin/auth để chữa lỗi harness. Còn warning multiple lockfiles/workspace root và experimental JSON imports.
- Không có database test riêng; không chạy integration ghi MongoDB. Kiểm kê read-only sau phase: 59 logical/Published, 74 revisions, 134 audit records; hash collection so với inventory cuối 5C.3A giữ nguyên.

Hai kỳ vọng test cũ được cập nhật theo yêu cầu mới: retrieval không đệm Tân Trào bằng câu Hà Nội, và index rỗng yêu cầu làm rõ thay vì gắn nhãn ngoài phạm vi. Không xóa kiểm tra security, Published-only hoặc stored answer.

## File thay đổi

Runtime:

- Mới `server/services/chat-vietnamese-ranking.ts`.
- Sửa `server/services/chat-matcher.ts`, `chat-ai-candidates.ts`, `chat-ai-matching.ts`, `chat.ts`.
- Sửa `server/domain/chat.ts` với optional metadata trên `suggest`.
- Sửa `features/game/chat-client.ts`, `character-chat.tsx` để hiển thị thông báo fallback; không đổi CSS, quiz lifecycle hoặc layout.

Tests/tooling/docs:

- Mới `tests/chat-fallback.test.mjs`, `tests/fixtures/chat-fallback-cases.mjs`, `tests/fixtures/chat-matching-baseline-5c3b.json`.
- Sửa `tests/chat.test.mjs`, `tests/chat-ai.test.mjs` như giải thích ở trên.
- Mới `scripts/prepare-chat-fallback-benchmark.ts`, `benchmark-chat-fallback.mjs`, `check-chat-fallback.mjs`, `report-chat-fallback.mjs`, `scripts/support/chat-offline-test-guard.mjs`.
- Hai báo cáo của phase. Local artifacts nằm trong `.local/chat-phase-5c3b/`; snapshots/ledger các phase trước không đổi.

## Kiểm thử demo và tái chạy

Không chạy `start-chat-demo-5c2.mjs` hoặc browser live cũ để kiểm thử phase này vì chúng có thể gọi Gemini. Các lệnh an toàn, không generation:

```powershell
rtk proxy node scripts/check-chat-fallback.mjs test
rtk proxy node scripts/benchmark-chat-fallback.mjs tune
rtk proxy node scripts/benchmark-chat-fallback.mjs evaluate
rtk proxy node scripts/report-chat-fallback.mjs
rtk proxy npx tsc --noEmit
rtk proxy node scripts/check-chat-fallback.mjs build
```

`freeze` chỉ dùng một lần và từ chối ghi đè baseline. Đợt hiện tại đã có fixture, không cần chạy lại script chuẩn bị MongoDB. `report-chat-fallback.mjs` tổng hợp artifact đã kiểm thử, không tự chạy TypeScript/lint.

Chủ dự án có thể kiểm tra UI development sau khi duyệt: dùng process test riêng với quota Gemini bằng 0 để bảo đảm không gọi provider, không sửa `.env.local` gốc. Quét QR → mở popup → thử “Hà Nội khởi nghĩa thắng lợi vào hôm nào vậy?”, câu typo Huế/Sài Gòn, câu ngày sai, câu nhiều ý và câu thời tiết. Kỳ vọng: gợi ý đủ tin cậy hoặc yêu cầu làm rõ; bấm gợi ý mới nhận stored answer. Exact/alias phải trả ngay, đóng/mở popup giữ quiz. Mô phỏng provider 504 dùng suite mock; không tiêu quota thật để cố tạo lỗi.

## Rollback an toàn

Không dùng `git reset --hard`, `git clean` hoặc restore cả working tree: repository có các thay đổi Phase 5C trước đó chưa commit.

1. Khi cần rollback, lấy **bản trước phase** của sáu file runtime trong `baselineFiles` tại `.local/chat-phase-5c3b/snapshot.json`: matcher, AI candidates, AI matching, service chat, domain chat và component character-chat. Chỉ khôi phục các file đó sau khi so sánh với thay đổi phát sinh sau phase.
2. Với `features/game/chat-client.ts`, bỏ riêng hàm `chatResponseText` và dòng validate optional `data.message` được phase này thêm. Component bản cũ sẽ không import helper nữa.
3. Sau khi không còn import, có thể bỏ module `chat-vietnamese-ranking.ts`. Các fixture/test/report mới có thể giữ làm chứng cứ; nếu rollback tests thì chỉ đảo hai thay đổi kỳ vọng của phase này.
4. Chạy lại TypeScript và tests phù hợp, restart development do chủ dự án kiểm soát. Không xóa Mongo cache/quota hoặc ledger; cache của policy mới chỉ tự hết hạn, rollback dùng key policy cũ. Không rollback 59 Published hay `.env.local`.

Chưa deploy production; dừng sau Phase 5C.3B, chờ chủ dự án duyệt. Không thực hiện Phase 5D/5E.
