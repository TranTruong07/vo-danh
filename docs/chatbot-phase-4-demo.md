# Phase 4 — Chatbot Demo MVP

Ngày kiểm tra: 15/10/2026. Môi trường: source hiện tại, Next.js 16.3.6, MongoDB `vo_danh`, production build chạy local. Không deploy.

## Kết quả

Popup chatbot hiện có đã kết nối backend. Người chơi mở trang nhân vật qua QR, mở bong bóng, nhập câu hỏi hoặc bấm gợi ý để nhận đúng `characterAnswers` của revision đã được quản trị viên publish. Không gọi LLM, không tạo thêm câu trả lời, không sửa nội dung lịch sử.

Đã kiểm tra cả Trường Chinh, Lê Duẩn, Phạm Văn Đồng và Võ Nguyên Giáp. Lời đáp API được so sánh nguyên văn với dữ liệu published đọc từ repository, không chỉ kiểm tra HTTP 200.

**Giới hạn dữ liệu demo hiện tại:** Võ Nguyên Giáp có 7 câu quiz; ba nhân vật còn lại có 0 câu quiz. Cả bốn chat được; luồng đầy đủ chat → đóng popup → chốt đáp án được kiểm tra với Võ Nguyên Giáp. Không tự thêm/sửa quiz để che việc thiếu dữ liệu.

## Dữ liệu MongoDB đã xác minh

| Chỉ số | Trước và sau Phase 4 |
| --- | ---: |
| Logical questions | 59 |
| Revisions | 74 |
| Approved revisions | 60 |
| Draft revisions | 14 |
| Published pointers hợp lệ | 59 |
| Câu repository chatbot thực tế đọc được | 59 |
| Knowledge audit entries | 134 |
| Revision mồ côi / pointer hỏng / version trùng | 0 |

Version hiện có: 19 revision v1, 2 v2, 22 v3, 27 v4, 4 v5. Đây là trạng thái sau các thao tác quản trị của người dùng, không còn là 59 draft như thời điểm Phase 3B.

SHA-256 nội dung và danh sách index của `knowledge_questions`, `knowledge_question_revisions`, `knowledge_audit` giống nhau trước/sau kiểm thử. Không import, approve, reject, publish, unpublish hoặc tạo reviewer trong phase này.

Snapshot chỉ đọc: `knowledge/phase-4-mongo-before.json`, `knowledge/phase-4-mongo-after.json`. Các JSON knowledge nằm trong quy tắc ignore hiện có; không chứa URI, mật khẩu hoặc cookie trong báo cáo demo.

## Tích hợp phiên chơi

Luồng quiz hiện tại ưu tiên dữ liệu đã tải xuống ngay cả khi đang online. Câu quiz local có ID `offline:…`, nên không thể gửi thẳng ID đó tới API chatbot vốn yêu cầu phiên server hợp lệ.

Hai nhánh được hỗ trợ:

1. Có quiz session server: popup dùng ID của quiz session hiện có; backend vẫn kiểm tra cookie owner, thời hạn, trạng thái và mapping nhân vật.
2. Quiz dùng cache hoặc chưa có quiz: trang `/play/[id]` đã đọc nhân vật từ MongoDB tạo một inline Server Action. Closure được Next.js bảo vệ, giữ ID nhân vật ở server; browser chỉ cung cấp UUID yêu cầu để chống tạo trùng. Khi mở popup, action tạo binding chat riêng, không sinh câu quiz phụ.

Binding nằm trong collection mới `chat_game_sessions`: UUID do server tạo, owner hash, character ID, request ID, trạng thái và thời điểm tạo/hết hạn. Có TTL 20 phút và unique index `(ownerHash, requestId)`. `$setOnInsert` giữ nguyên binding khi retry; không kéo dài binding cũ đã hết hạn. Lookup kiểm tra owner/state/expiry trước khi trả thông tin. Đây là metadata phiên tạm, không phải lịch sử tin nhắn hay dữ liệu kiến thức.

Action tái sử dụng cookie `history_player` và quota chatbot. Các API chỉ nhận session ID; không nhận character ID/persona từ client. Mapping bốn nhân vật vẫn theo cấu hình server Phase 2. Không thay authentication tài khoản.

Đây là xác thực phiên theo trang QR hợp lệ, không phải bằng chứng người dùng đã quét một thẻ vật lý: mở URL nhân vật trực tiếp vẫn được phép như trước.

## API

| Endpoint | Request | Hành vi |
| --- | --- | --- |
| `POST /api/chat` | `{sessionId, message}` | API cũ: exact/normalized match trả lời, fuzzy chỉ gợi ý, ngoài phạm vi từ chối |
| `POST /api/chat/answer` | `{sessionId, questionId}` | API cũ: đọc lại published pointer và approved revision khi bấm gợi ý |
| `POST /api/chat/suggestions` | `{sessionId}` | Mới: tối đa 3 canonical questions đã published, chỉ trả question ID và câu hỏi |

Endpoint gợi ý dùng POST để chuyển session trong body, nhưng chỉ đọc knowledge. Dùng lại schema `status: "suggest"`, HTTP adapter, kiểm tra Origin, giới hạn body, quota và `Cache-Control: no-store`. Không trả neutral answer, bốn persona hay draft. Các endpoint chia sẻ quota hiện có: 20 request/phút/player và 300/phút toàn cục. Mở binding cũng dùng quota; khi bị giới hạn, UI đọc `Retry-After` và tạm khóa gửi.

Không thay matching threshold, điều kiện approved/published hoặc schema hai API trả lời hiện có.

## Giao diện

- Mặc định đóng; tên và ảnh lấy từ nhân vật đang chơi.
- Lịch sử nằm trong bộ nhớ của popup; đóng/mở vẫn giữ, refresh hoặc đổi lượt/nhân vật thì xóa. Không lưu chat vào MongoDB/localStorage.
- Enter gửi, Shift+Enter xuống dòng; không gửi khi đang dùng IME; giới hạn 500 ký tự.
- Khóa request đồng bộ để chống bấm/gõ gửi liên tục; timeout kết nối 20 giây; không tự retry tạo nhiều tin.
- Hiển thị loading, nguồn tài liệu, gợi ý fuzzy, từ chối ngoài phạm vi, lỗi mạng/session/quota. Không hiển thị lỗi nội bộ database.
- Ghi rõ lời đáp là mô phỏng giáo dục từ tư liệu đã duyệt, không phải lời nói nguyên văn.
- Hỗ trợ desktop và mobile; giữ điều khiển đóng, Escape, nhãn trợ năng và vùng thông báo.
- Mất mạng: chatbot cần mạng và thông báo rõ, quiz offline vẫn hoạt động. Nếu trang mở từ offline shell, cần kết nối lại và tải lại trang để nhận Server Action trước khi chat.

## File tạo/thay đổi trong Phase 4

| File | Nội dung |
| --- | --- |
| `features/game/character-chat.tsx` | Tích hợp popup, state, gửi tin, gợi ý và lỗi |
| `features/game/character-chat.css` | Tin nhắn, gợi ý, source, textarea, responsive |
| `features/game/chat-client.ts` | HTTP client, timeout, kiểm tra response, thông báo lỗi |
| `features/game/game-player.tsx` | Chỉ nối prop action/session và key reset vào widget; giữ logic quiz/TTS hiện có |
| `app/play/[id]/page.tsx` | Action closure gắn nhân vật đã resolve trên server |
| `server/domain/chat.ts` | DTO action binding và validate request gợi ý |
| `server/services/chat.ts` | Service lấy gợi ý từ published index |
| `server/services/chat-game-session.ts` | Khởi tạo binding chat cho vòng chơi local |
| `server/repositories/chat-game-sessions.ts` | Lưu binding tạm, TTL, idempotency |
| `server/repositories/chat-session.ts` | Tái sử dụng quiz session, fallback binding chat |
| `app/api/chat/suggestions/route.ts` | Endpoint gợi ý tối thiểu |
| `scripts/prepare-chat-demo-fixture.ts` | Chuẩn bị fixture chỉ đọc từ DB thật để kiểm thử persona/published pointer |
| `tests/chat-demo.test.mjs` | 9 unit tests mới |
| `tests/chat-demo.browser.mjs` | API/browser E2E desktop/mobile, QR image, PWA |
| `docs/chatbot-phase-4-demo.md` | Báo cáo và hướng dẫn demo |
| `docs/chatbot-phase-4-test-report.json` | Kết quả kiểm thử machine-readable |

Các snapshot Mongo và artifact kiểm thử nằm trong `knowledge/phase-4-mongo-*.json`, `.local/chat-demo/`. Script inventory `scripts/inspect-knowledge-readonly.ts` tái sử dụng từ phase trước. `public/pwa-assets.json` được build tái sinh theo quy trình hiện có.

Working tree đã có nhiều thay đổi từ các phase khác trước khi bắt đầu. Không coi toàn bộ `git diff` là thay đổi Phase 4; phần TTS đã có trong `game-player.tsx`, cùng các thay đổi PWA/admin/payment/auth khác, được giữ nguyên.

## Kiểm thử và kết quả

| Kiểm tra | Kết quả |
| --- | --- |
| TypeScript `npx tsc --noEmit` | Pass |
| ESLint các TS/TSX/MJS thay đổi trong phase | Pass, 0 lỗi/cảnh báo |
| Build `npm run build` | Pass, tạo đủ routes và 80 PWA assets |
| Chat unit/repository/dialogue + test mới | 32/32 pass |
| Toàn bộ `tests/*.test.mjs` | 139 tests: 133 pass, 5 fail cũ, 1 skip |
| Edge headless production desktop 1440×1000/mobile 390×844 | 16 nhóm kiểm tra pass |
| So sánh knowledge trước/sau | Nội dung và indexes không đổi |

5 lỗi cũ đều thuộc `tests/auth.test.mjs`: test loader cố đọc `server/services/character.ts` không tồn tại (ENOENT, dependency đi qua TTS). Chúng đã có ở Phase 3A, không phải lỗi mới do popup chat. Không sửa auth/TTS trong phase này. Test Mongo integration quản trị bị skip vì không có `MONGODB_TEST_URI`; không tự tạo database test trên production.

Các nhóm kiểm tra E2E bao gồm canonical, alias, fuzzy → chọn suggestion, ngoài phạm vi, cả bốn lời đáp, session không hợp lệ/cookie owner khác, chặn client persona override, từ chối revision ID draft và lấy đúng published answer theo logical ID dù còn draft, shared rate limit thật, 503 giả lập, chống gửi trùng, Shift+Enter, refresh, đổi nhân vật và tiếp tục quiz. Kiểm tra expiry thật bằng unit; UI expiry giả lập HTTP 401, không sửa ngày hết hạn trong DB thật.

Luồng PWA kiểm tra thực: tải pack online → ảnh QR được jsQR giải mã → quiz local chưa có cookie player → mở chat tạo binding → nhận câu trả lời → mất mạng → chốt đáp án → quét lại ảnh QR offline → kết nối lại/reload → chat tiếp. Không thay đổi SW/pack/thuật toán chọn quiz.

Đã xem screenshot desktop và mobile, không tràn ngang. Chưa thử camera vật lý, bàn phím điện thoại thật, Safari/iOS hoặc thiết bị cầm tay thực. Không chạy giao dịch thanh toán thật, gửi email, tạo TTS hoặc workflow approve/publish để kiểm tra hồi quy.

## Chạy demo local

Giữ cấu hình MongoDB và bốn `CHAT_CHARACTER_*_ID` đang hoạt động trong `.env.local`; không cần API key AI. Không in/chia sẻ file môi trường. Khởi động lại server nếu đang dùng tiến trình cũ.

```powershell
rtk proxy npm run build
rtk proxy npm run start -- --port 3001
```

1. Vào `http://localhost:3001/play`, quét ảnh QR hoặc mở phần dán liên kết/mã nhân vật. QR in theo domain cấu hình có thể dán vào scanner local; scanner dùng ID nhân vật để chuyển tới trang cùng origin.
2. Dùng Võ Nguyên Giáp để demo cả quiz và chat: `/play/6ac8e47d0ddc4ea27b45f7d4`.
3. Mở bong bóng, bấm một câu gợi ý lấy từ published data. Hoặc hỏi: `Khởi nghĩa giành chính quyền ở Hà Nội thắng lợi ngày nào?` (canonical đã xác minh trong DB lúc kiểm thử).
4. Thử câu gần giống `Khởi nghĩa giành chính quyền ở Hà Nôi thắng lợi ngày nào?`, chọn câu được gợi ý để nhận lời đáp. Thử câu ngoài phạm vi như hỏi nấu pizza.
5. Đóng popup, chọn đáp án quiz rồi chốt. Dùng “Quét nhân vật tiếp” để đổi thẻ và mở một lịch sử chat mới.
6. Để demo offline: tải đủ pack khi có mạng, ngắt mạng; quiz vẫn chơi được, chat thông báo cần mạng. Bật mạng và reload nếu đang ở offline shell.

Các ID khác đã xác minh: Trường Chinh `6acf0a8c9c11e27aef188419`, Lê Duẩn `6acf0cf89c11e27aef18841a`, Phạm Văn Đồng `6acf16299c11e27aef18841b`. Chúng chat được nhưng cần quản trị viên tự chuẩn bị quiz nếu muốn demo đầy đủ như Võ Nguyên Giáp.

## Chạy lại kiểm thử

```powershell
rtk proxy npx tsc --noEmit
rtk proxy node --test tests/chat-demo.test.mjs tests/chat.test.mjs tests/chat-repositories.test.mjs tests/chat-dialogue.test.mjs
$chatDemoTests = @(rtk proxy rg --files tests -g '*.test.mjs')
rtk proxy node --test @chatDemoTests
rtk proxy npm run build
rtk proxy npm run start -- --port 3013
```

Trong terminal khác, với Edge và dependencies hiện có:

```powershell
rtk proxy node --conditions=react-server --import tsx scripts/prepare-chat-demo-fixture.ts
rtk proxy node tests/chat-demo.browser.mjs
```

Fixture dùng DB `vo_danh` và yêu cầu 59 câu published để phát hiện thay đổi dữ liệu demo. Browser test mặc định chỉ cho `localhost:3013`; có thể cấu hình `CHAT_DEMO_URL` sang origin localhost khác. Test tạo các phiên chơi/quota thông thường có TTL, không xóa fixture DB, không tạo câu hỏi, không ghi knowledge. Không chạy đồng thời nhiều lượt để tránh quota toàn cục; nếu vừa chạy liên tục và nhận 429, đợi sang phút tiếp theo rồi chạy lại.

Log/screenshot: `.local/chat-demo/browser-report.json`, `unit-tests.tap`, `build.log`, `mobile-cached-quiz.png`, `desktop-3.png`. Fixture chứa nội dung published dùng để đối chiếu, nằm trong `.local/` đã ignore.

## Phần còn lại

- Quản trị viên cần thêm quiz cho ba nhân vật còn thiếu nếu muốn demo trọn vòng chơi của cả bốn. Không thuộc thay đổi kiến thức chatbot.
- Matching vẫn chỉ dùng exact/normalized alias và fuzzy suggestions; không hứa trả lời mọi cách diễn đạt. Không giảm threshold để tăng số câu trả lời.
- Chat cần mạng và phiên server còn hạn. Không thêm chế độ chat offline hoặc lưu hội thoại lâu dài.
- Cần kiểm thử thiết bị thật và xử lý 5 lỗi test loader auth ở một task riêng.
- Chưa triển khai các phase tiếp theo; không deploy production.
