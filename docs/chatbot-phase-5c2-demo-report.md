# Phase 5C.2 — Development demo report

Ngày 16/10/2026, múi giờ Asia/Bangkok. Đã đọc báo cáo và kết quả test Phase 5C.1 trước khi chạy.

**Kết luận: hoàn thành kiểm thử, còn lỗi ảnh hưởng chất lượng demo.** Exact/alias và cache hoạt động với cả bốn nhân vật; Gemini đã chọn đúng Hà Nội và Huế. Đợt này có **6 HTTP 504 trong 9 generation calls**, khiến một số câu hợp lệ bị fallback thành ngoài phạm vi. Không đủ cơ sở tuyên bố demo đã ổn định.

Đã dùng **9/10 lượt mới**, không dùng lượt còn lại, không retry tự động, không đổi billing hoặc deploy. Ledger Phase 5C.1 không bị xóa/reset/sửa. Server thử nghiệm đã dừng.

## 1. Cấu hình thực tế và hướng dẫn bật

Kiểm tra server environment chỉ xuất boolean cho key, không xuất secret:

| Cấu hình | Giá trị hiện có |
| --- | --- |
| GEMINI_API_KEY | Có, chỉ kiểm tra true/false |
| CHAT_AI_MATCHING_ENABLED | `true` |
| GEMINI_MODEL | `gemini-3.5-flash-lite` |
| CHAT_AI_AUTO_ANSWER | `false` |
| API version / SDK | `v1beta` / `@google/genai@2.30.0` |
| Timeout | 5000 ms |
| Candidates tối đa | 8 |
| Quota ứng dụng | 5/phút, 100/ngày |
| Cache match / no_match | 3600 / 120 giây |

Cấu hình hiện tại đã bật, khác với thời điểm kết thúc 5C.1. **Đợt này không chỉnh `.env.local` gốc.** Nếu cần bật cho một phiên development mới, đặt các dòng sau trong `.env.local` trên server, giữ API key riêng tư đang có:

```dotenv
CHAT_AI_MATCHING_ENABLED=true
GEMINI_MODEL=gemini-3.5-flash-lite
CHAT_AI_AUTO_ANSWER=false
CHAT_AI_TIMEOUT_MS=5000
CHAT_AI_MAX_CANDIDATES=8
CHAT_AI_CALLS_PER_MINUTE=5
CHAT_AI_CALLS_PER_DAY=100
```

Sau khi đổi biến môi trường, khởi động lại **phiên development của bạn** để chắc chắn process đọc cấu hình mới:

```powershell
rtk proxy npm run dev
```

Script này chạy cổng 3001. Mở `http://localhost:3001/play`, quét QR/chọn ảnh QR, mở popup sau khi trang nhân vật tải xong. Không chạy `next start` để thay thế cho kiểm thử development. Không đặt GEMINI_API_KEY trong biến NEXT_PUBLIC. `CHAT_AI_AUTO_ANSWER` không có khả năng bật trả lời tự sinh trong kiến trúc hiện tại.

Đây là hướng dẫn cho chủ dự án, không phải yêu cầu chạy thêm generation trong ngân sách đã dùng của đợt này. Việc bật cờ trên server đang dùng không đồng nghĩa mọi câu đều gọi Gemini: exact/alias, cache và quota vẫn được kiểm tra trước.

## 2. Môi trường kiểm thử và bảo toàn dữ liệu

- Next **development**, webpack, Edge headless; desktop 1440×900 và mobile viewport 390×844.
- Một bản sao source hiện tại trong `.local/chat-phase-5c2/workspace`, dùng chung dependencies; process riêng cổng 3014. Không dừng server development đang có của người dùng.
- Truy cập browser bằng `http://localhost:3014`. Server chỉ bind loopback `127.0.0.1`; không mở public demo.
- Quét **ảnh PNG QR thật**, giải mã qua `jsQR` của ứng dụng; không mock kết quả nhận dạng. Camera vật lý chưa kiểm thử.
- Service worker bị chặn trong context kiểm thử để đo luồng development online; không sửa PWA.
- Dùng phiên chơi do ứng dụng tạo, cookie và backend validation bình thường; không giả session/character mapping.
- Fixture đọc Published từ MongoDB `vo_danh`, gồm q017 Hà Nội, q018 Huế, q019 Sài Gòn và stored answers của bốn persona.
- Bộ đếm mới `.local/chat-phase-5c2/generation-ledger.json`, hard cap 10 ngay trước transport; lock độc quyền, không tự retry. Giữ nguyên bộ đếm quota MongoDB và cache đang có.
- Bắt đầu có 2 reservation Gemini trong ngày UTC từ đợt trước; không reset để lấy quota mới. Giữ cấu hình 5/phút, 100/ngày trong phần live.
- Chỉ ở lượt kiểm thử fallback cuối: override `CHAT_AI_CALLS_PER_DAY=0` trong process test, không ghi env gốc và không sửa counter.

Sau kiểm thử: count và SHA-256 nội dung của `knowledge_questions`, `knowledge_question_revisions`, `knowledge_audit` trước/sau giống hệt. Vẫn 59 logical questions, 59 Published/readable, 74 revisions (60 approved, 14 draft), 134 audit records, không orphan/broken pointer. Không sửa 59 Published, không approve/publish. Chỉ có dữ liệu vận hành phiên chơi/chat/cache/quota phát sinh theo luồng thông thường.

Đã xác nhận port 3014 đóng, gỡ bản sao `.env.local` trong workspace thử nghiệm. `.env.local` gốc giữ nguyên, bao gồm flag đang true; không tự tắt flag của người dùng. Hash ledger 5C.1 trước/sau không đổi.

## 3. QR → nhân vật → quiz → popup

| Nhân vật | QR PNG → đúng nhân vật | Quiz thực tế | Popup / exact / alias / stored answer |
| --- | --- | --- | --- |
| Võ Nguyên Giáp | Đạt | 7 câu trong DB, render 1 câu + 4 đáp án | Đạt |
| Trường Chinh | Đạt | 0 câu; màn “Chưa mở được câu hỏi” | Đạt qua phiên chat hợp lệ |
| Lê Duẩn | Đạt | 0 câu; màn “Chưa mở được câu hỏi” | Đạt qua phiên chat hợp lệ |
| Phạm Văn Đồng | Đạt | 0 câu; màn “Chưa mở được câu hỏi” | Đạt qua phiên chat hợp lệ |

**Không coi `aria-busy=false` là quiz ready nếu không có bốn đáp án.** Chỉ Võ Nguyên Giáp đáp ứng toàn bộ đường đi có quiz thật. Không tự thêm quiz cho ba nhân vật còn lại vì ngoài phạm vi.

Cả bốn persona đều nhận đúng stored answer tương ứng. Đóng/mở popup giữ nguyên câu hỏi hoặc trạng thái quiz rỗng và lịch sử chat. Ba gợi ý đầu tiên thuộc Published. UI nguồn tài liệu vẫn ẩn. Mất mạng request giả lập → hiện retry thủ công → gửi lại exact thành công, không phát sinh Gemini.

## 4. Các câu hỏi đã thử

| Nhóm / câu thử | Kết quả live | Generation mới |
| --- | --- | --- |
| Canonical “Khởi nghĩa giành chính quyền ở Hà Nội thắng lợi ngày nào?” | `answered`, nguyên văn stored persona answer, đủ bốn nhân vật | 0 |
| Alias “Ngày thắng lợi của khởi nghĩa ở Hà Nội tháng 8/1945 là ngày nào?” | `answered`, đủ bốn nhân vật | 0 |
| “Cháu muốn biết cuộc khởi nghĩa tại Hà Nội đã thắng lợi vào ngày nào?” | Gemini match q017 → `suggest`; click → Published answer. Ba persona tiếp theo dùng cache, vẫn nhận đúng lời đáp riêng | 1 |
| “Ngay thang loi cua khoi nghia o Ha Noi thang 8/1945 la ngay nao?” | Google 504 → legacy suggest q017, q018, q019; Hà Nội đứng đầu | 1 |
| “Ngay nao nguoi dan Ha Noi gianh chinh quyen thanh cong?” | Google 504 → `out_of_scope`, bỏ lỡ câu hợp lệ | 1 |
| “Cuộc khởi ngĩa ở Hà Nọi đã thắg lợi vào ngày nào ạ?” | Google 504 → `out_of_scope`, bỏ lỡ câu sai chính tả | 1 |
| “Cách làm bánh pizza phô mai?” | Google `no_match` → `out_of_scope` | 1 |
| “Bác cho cháu hỏi, ở Huế cuộc khởi nghĩa thành công vào hôm nào?” | Gemini match q018 → `suggest`; click → Published answer Huế, không chọn Hà Nội | 1 |
| “Còn tại Sài Gòn, nhân dân giành chính quyền thắng lợi ngày mấy?” | Google 504 → `out_of_scope`; **chưa xác nhận được live matching Sài Gòn** | 1 |
| “Hà Nội và Huế cùng giành chính quyền vào một ngày phải không?” | Google 504 → `out_of_scope`, không tự khẳng định hai địa điểm cùng ngày | 1 |
| “Khởi nghĩa Hà Nội thắng lợi ngày 23/8/1945 đúng không?” | Google 504 → `out_of_scope`, không tự xác nhận tiền đề sai | 1 |

Với hai câu cuối, đã xác nhận hành vi fallback an toàn; **chưa xác nhận quyết định Gemini `no_match` cho chính hai câu đó**, vì provider trả 504.

### Các lượt gọi thực tế

| Lượt | HTTP | Kết quả | Thời gian transport |
| --- | --- | --- | --- |
| 1 | 200 | match q017 | 3434 ms |
| 2 | 504 | fallback | 4583 ms |
| 3 | 504 | fallback | 3651 ms |
| 4 | 504 | fallback | 4223 ms |
| 5 | 200 | no_match | 2334 ms |
| 6 | 200 | match q018 | 2220 ms |
| 7 | 504 | fallback | 4369 ms |
| 8 | 504 | fallback | 4311 ms |
| 9 | 504 | fallback | 4847 ms |

Tất cả dùng `gemini-3.5-flash-lite`, v1beta. HTTP 504 được quan sát ở transport gọi Google, không phải HTTP 504 của `/api/chat`: ứng dụng vẫn trả HTTP 200 với kết quả fallback. Không ghi raw error body nên không kết luận nguyên nhân sâu hơn của gateway/deadline phía provider, không quy lỗi cho API key/billing/schema khi chưa có bằng chứng. Không tăng timeout hoặc đổi model trong đợt này.

Tỷ lệ lỗi transport của **mẫu nhỏ này** là 6/9; không suy rộng thành SLA hay chất lượng tổng quát của model. Không thấy provider HTTP 429 trong đợt live.

## 5. Suggest-only, cache, timeout, quota và fallback

- Khi Gemini match, API chỉ trả `suggest`, không chứa historical answer. Chọn gợi ý gọi `/api/chat/answer`; so sánh byte-for-byte với stored persona answer đọc từ Published trước test.
- Exact/alias là đường trả lời từ Published không gọi Gemini. Các suggestion ID được đối chiếu danh sách 59 Published.
- **`out_of_scope` có field `answer` theo API hiện có**, nhưng đó là `CHAT_PERSONAS[characterId].refusalText` cố định, không phải Gemini tự sinh. Không đánh đồng field này với auto-answer.
- Paraphrase Hà Nội dùng một generation đầu tiên, ba lần hỏi ở persona khác không gọi thêm. Answer vẫn thay đổi đúng persona server-side, không tái sử dụng answer của người trước.
- Timeout: 6 provider HTTP 504 thực tế đều có fallback; test mock cũng xác nhận deadline AbortSignal, không retry, không rò nội dung provider.
- Quota: process kiểm thử cuối đặt per-day=0. **8/8 kiểm tra đạt**, ledger vẫn 9. Cache q017 dùng được ngay khi quota bằng 0; cache miss dùng legacy hoặc từ chối cố định. Không cố tiêu hết Free Tier Google để tạo HTTP 429.
- Lượt quota=0 kiểm tra lại alias không dấu, paraphrase không dấu, typo, pizza, Sài Gòn, nhiều địa điểm và ngày sai. Hai ca suggest có click nhận đúng stored answer; sáu ca `out_of_scope` so sánh đúng refusalText. Không request nào gọi provider.

## 6. Kết quả test và giới hạn của script

- Chatbot unit/repository/API tests: **59/59 đạt**. Có timeout, 429 mock, cache, shared quota, revoked Published, session và character mapping.
- ESLint toàn bộ năm file công cụ/test mới: đạt.
- Browser vòng live gốc ghi **22 check pass, 7 check fail**, cộng hai lần luồng quét bị gián đoạn. Không sửa các artifact này thành pass.
- Ba fail phản ánh vấn đề retrieval thực tế khi provider 504: paraphrase không dấu, typo và Sài Gòn.
- Bốn fail còn lại xuất phát từ kỳ vọng script quá chặt: yêu cầu alias không dấu và pizza không được gọi Gemini; yêu cầu `out_of_scope` không có field `answer` ở hai ca địa điểm/ngày. Source xác nhận normalizer exact vẫn giữ dấu và response refusal có answer. Đã sửa kỳ vọng test cho các lần chạy sau, không sửa kiến trúc ứng dụng.
- Vòng bổ sung quota=0: **8/8 đạt**, xác nhận refusal cố định và click stored answer; không dùng nó để tuyên bố các quyết định live Gemini trước đó đã thành công.
- Không chạy production build trong 5C.2 vì chỉ bổ sung tooling/test/report; server chạy dev biên dịch các route được sử dụng. Không chạy lại full-repository suite; không nhận là đã sửa baseline ngoài chatbot.

Lệnh unit đã chạy:

```powershell
rtk proxy node --test tests/chat-ai-errors.test.mjs tests/chat-ai.test.mjs tests/chat.test.mjs tests/chat-repositories.test.mjs tests/chat-dialogue.test.mjs tests/chat-demo.test.mjs
```

## 7. Lỗi / rủi ro demo và đề xuất

1. **Provider 504 lặp lại:** ảnh hưởng trực tiếp câu diễn đạt khác, không dấu, sai chính tả. Cần một đợt chẩn đoán riêng có ngân sách được duyệt: lưu status/code/message đã khử secret, so sánh deadline hiện tại với timeout khác có kiểm soát, đo trước khi thay đổi cấu hình. Không bật retry tự động để che lỗi hoặc tăng chi phí.
2. **Fallback bỏ lỡ câu hợp lệ:** Sài Gòn, không dấu và typo có thể thành ngoài phạm vi khi AI lỗi. Nên có benchmark hồi quy cho các mẫu này; xem xét UX phân biệt lỗi kết nối với câu thật sự ngoài tài liệu. Mọi thay đổi matching/threshold/aliases cần phạm vi duyệt riêng; đợt này không đổi.
3. **Ba nhân vật chưa có quiz:** quản trị viên cần chuẩn bị câu hỏi quiz để demo đủ bốn luồng có quiz ready. Đây là dữ liệu quiz riêng, không phải thiếu 59 Published Knowledge.
4. **Origin development:** preflight `http://127.0.0.1:3014` trả 403 ở `/api/chat/suggestions`; đổi client sang `http://localhost:3014` thì thành công. Source kiểm tra origin với request URL/cấu hình APP URL. Không nới kiểm tra origin. Dùng một hostname thống nhất; nếu cần hỗ trợ IP, kiểm tra origin/URL mà reverse proxy chuyển tiếp trước khi sửa allowlist. Chưa ghi request URL nội bộ nên không khẳng định chính xác khâu rewrite gây lệch.
5. **Quét ảnh ngay sau tải trang trong dev đôi lúc kẹt “Đang mở…”:** vòng đầu và vòng tiếp theo timeout chờ màn nhân vật; ảnh lỗi vòng tiếp theo còn ở scanner. Chờ 1 giây sau khi mount rồi chọn file thì quét được. Có khả năng liên quan lifecycle/Strict Mode vì scanner dùng generation guard và cleanup; **chưa đủ bằng chứng xác nhận root cause**. Không sửa QR. Cần kiểm thử riêng thao tác sớm sau hydration; không coi khoảng chờ của test là bản sửa sản phẩm.
6. **Câu ngoài phạm vi vẫn tốn một generation:** pizza có candidate nên đi qua AI trước khi từ chối. Đây không phải vi phạm suggest-only, nhưng cần theo dõi ngân sách khi demo nhiều người.

Mạng lỗi phía browser đã được kiểm thử bằng abort một request và retry thủ công thành công. Chưa thử camera/iPhone thực, tải đồng thời hoặc website production. Không kiểm chứng billing tier/quota project trong AI Studio; không có thay đổi billing.

## 8. Files và artifacts

Chỉ tạo/sửa các file phục vụ đợt kiểm thử này:

- `scripts/prepare-chat-demo-5c2.ts`: đọc cấu hình, quota, Published fixture và hash ledger cũ; không ghi MongoDB.
- `scripts/start-chat-demo-5c2.mjs`: workspace dev riêng, hỗ trợ quota=0 trong process test.
- `scripts/support/chat-demo-5c2-budget.mjs`: cap 10 lượt và metadata transport không chứa key/prompt/answer.
- `tests/chat-demo-5c2.browser.mjs`: QR PNG, bốn persona, các nhóm câu hỏi và manual retry; phần continuation không lặp các call cũ.
- `tests/chat-demo-5c2-fallback.browser.mjs`: 8 ca quota=0/cache/refusal.
- `docs/chatbot-phase-5c2-demo-report.md`: báo cáo này.

Artifacts local được giữ để đối chiếu trong `.local/chat-phase-5c2/`:

- `generation-ledger.json`, `generation-events.jsonl`: 9 calls, không reset.
- `environment-before.json`, `knowledge-before.json`, `knowledge-after.json`.
- `preflight.json`, `browser-report.json`, `browser-resume-report.json`, `browser-rest-report.json`, `fallback-report.json`.
- `summary.json`: tổng hợp machine-readable, gồm phân biệt lỗi sản phẩm và lỗi kỳ vọng test.
- `demo-vo-nguyen-giap.png`, `demo-truong-chinh.png`, `demo-le-duan.png`, `demo-pham-van-dong.png`, `flow-failure.png`.

Các lệnh live đã chạy, chỉ để truy vết, **không chạy lại tự động**:

```powershell
rtk proxy node scripts/start-chat-demo-5c2.mjs
rtk proxy node tests/chat-demo-5c2.browser.mjs
rtk proxy node tests/chat-demo-5c2.browser.mjs --resume
rtk proxy node tests/chat-demo-5c2.browser.mjs --resume-rest
# Sau khi dừng server live, chạy server quota=0 cho kiểm thử không generation:
rtk proxy node scripts/start-chat-demo-5c2.mjs --quota-zero
rtk proxy node tests/chat-demo-5c2-fallback.browser.mjs
```

Scripts giữ report cũ và từ chối tự replay sai trạng thái. Không xóa report/ledger để chạy lại. Những thay đổi có sẵn của Phase 5C/5C.1 và các phần khác được giữ nguyên. Không thay kiến trúc, 59 Published, admin workflow, quiz, QR, TTS, PWA hoặc payment. **Dừng sau báo cáo này, chờ chủ dự án duyệt.**
