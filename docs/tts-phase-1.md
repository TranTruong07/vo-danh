# Phase TTS-1 — Single-question FPT.AI pilot

Ngày: 25/10/2026. Trạng thái: đã triển khai code, chờ kiểm tra và cho phép live smoke test.

## Phạm vi và kiến trúc tái sử dụng

Luồng: `QuestionForm / QuestionAudio → Route Handler → quiz-audio service → character-questions repository + speech repository → MongoDB/R2`.

- Đọc `character_questions` bằng `findCharacterQuestion`; không đổi schema câu hỏi, text, đáp án hoặc scoring.
- Dùng `requireAdmin`/`hasAdminSession` hiện có. POST còn kiểm tra same-origin và body JSON tối đa 2 KB; key/URL provider không đi ra frontend.
- Mở rộng `server/repositories/speech.ts`, dùng lại `getR2Client`, bucket và public base URL hiện có; không tạo R2 client/storage abstraction song song.
- Dùng collection `speech_assets` đang có, namespace mới. Không sửa hoặc migrate record legacy.
- Giữ nguyên `/audio/[id]`, MP3 player, quiz, QR, chatbot knowledge, payment và PWA. MP3 mới chỉ nghe thử trong admin ở phase này.
- Không thêm dependency. Giữ toàn bộ thay đổi TTS-0 và các file env example có sẵn trước task.

## API

| Method | Route | Chức năng |
| --- | --- | --- |
| GET | `/api/admin/quiz-questions/[id]/audio?voiceId=leminh` | Xem trạng thái/ước tính ký tự, tùy chọn đối chiếu giọng; không synthesis/upload |
| POST | `/api/admin/quiz-questions/[id]/audio/generate` | Tạo/tiếp tục tải các đoạn được chọn từ một câu hỏi pilot |

POST nhận duy nhất `{ "segments": ["question"], "voiceId": "leminh", "confirmed": true }`. Từ chối trường lạ (bao gồm text), segment trùng/sai, voice không thuộc danh mục, thiếu xác nhận và quá giới hạn. Admin check ở HTTP và service. Response chứa view trạng thái cùng URL R2 chỉ cho đoạn ready, không chứa raw provider response, API key hoặc URL async.

403: không phải admin/sai origin; 400: input sai; 404: không tồn tại câu hỏi; 409: chưa bật/cấu hình, ngoài pilot, khóa đang dùng hoặc chưa qua bước MP3 câu hỏi; 503: lỗi hạ tầng đã được che thông tin nhạy cảm. Thất bại từng đoạn được trả trong view (HTTP 200) để giữ kết quả thành công trước đó.

## Metadata và vòng đời

Trong `speech_assets`, thêm document `_id = quiz-audio:{questionId}`, `kind=quiz-audio`, `questionId`, `voiceId`, `segments`, `updatedAt`. Mutex dùng `owner`, `leaseUntil`; index `_id` unique có sẵn đủ cho các truy vấn point lookup này. Không tạo collection/index/migration trong lúc triển khai.

Mỗi segment chứa `segmentType`, `status`, `textHash`, `voiceId`, `speed`; khi thành công thêm `r2Key`, `fileSize`, `contentType=audio/mpeg`, `generatedAt`. Khi lỗi có `lastError` cố định đã sanitize. `pending={url,textHash,voiceId}` là trạng thái riêng phía server, giúp tiếp tục download sau polling timeout mà không gửi synthesis lại. Không lưu binary trong MongoDB.

`missing`, `stale`, `unavailable` được tính khi đọc, không cần cập nhật câu hỏi/migration. `generating`, `ready`, `failed` được lưu. Trạng thái tổng: `no_audio`, `partial`, `ready`, `outdated`, `failed`. Hash SHA-256 bao gồm nguyên văn text, tốc độ, characterId và version định dạng FPT; voice so sánh riêng và nằm trong object key. Đổi text, voice, speed hoặc nhân vật sẽ làm âm thanh cũ stale, không cung cấp URL preview của đoạn stale.

`quiz-audio/{characterId}/{questionId}/{segmentType}/{textHash}-{voiceId}.mp3` là key R2; tất cả thành phần được kiểm tra, không nhận từ client. MIME upload `audio/mpeg`. Không có DeleteObject. Chỉ thay reference sau upload thành công và ghi metadata thành công; lỗi trước đó giữ reference cũ, không phát nó như bản hiện hành.

## Chống tạo trùng và giới hạn

- Một pilot ObjectId từ env; chỉ admin xác nhận mới sinh audio. Không chạy từ startup/build/player, không batch toàn DB.
- Lượt đầu chỉ được tạo `question`. Các đoạn khác cần flag cho phép **và** MP3 câu hỏi đã ready với giọng/hash hiện tại.
- Atomic `findOneAndUpdate`/upsert trên `_id`, duplicate-key nghĩa là một tiến trình khác đang giữ khóa. Lease 10 phút; ghi segment có owner/lease fencing. Khi server bị dừng, UI không tự retry; sau hết lease cần admin kiểm tra và thao tác lại.
- Tối đa 7 đoạn; xử lý tuần tự. Một POST FPT cho mỗi đoạn mới, không retry POST. Bỏ qua đoạn ready cùng hash/voice; bỏ qua text trống và hiển thị unavailable.
- Request budget service 210 giây trước khi bắt đầu đoạn tiếp, route tối đa 300 giây; các đoạn chưa bắt đầu vẫn ở trạng thái cũ để admin chạy tiếp. Mỗi POST FPT timeout 10 giây, polling tối đa 6 GET/25 giây, upload R2 timeout 25 giây. Hosting vẫn phải hỗ trợ duration tương ứng; khuyến nghị pilot từng segment.
- Đọc lại câu hỏi giữa các đoạn để phát hiện sửa đồng thời. Edit sau khi request bắt đầu vẫn có thể làm MP3 vừa tạo thành stale; không phát bản stale, không sửa nội dung câu hỏi để khớp audio.

## FPT/SSRF/file validation

Giữ endpoint v5, UTF-8 raw body, `api_key`, voice ID, speed, format MP3. Parse JSON giới hạn 16 KB, chỉ nhận `error === 0` và URL hợp lệ. Host được chấp nhận hiện là `s3-ap-southeast-1.amazonaws.com`, đường dẫn `/text2speech-v4/<filename>.mp3` theo ví dụ chính thức. Chỉ HTTPS, không userinfo/port/query/hash, không wildcard host/bucket, không follow redirect.

Download giới hạn streaming 5 MB kể cả không có Content-Length. Kiểm tra MIME audio/mpeg hoặc audio/mp3; kiểm tra ít nhất hai MPEG Layer III frame liên tiếp, đầy đủ độ dài, sau ID3v2 hợp lệ nếu có. Reject HTML, JSON, file chỉ có ID3, frame bị cắt và file quá lớn trước khi upload.

**Bản sửa sau pilot — URL audio v5:** allowlist hiện bổ sung chính xác `file01.fpt.ai` với đường dẫn `/text2speech-v5/{short|long}/YYYY-MM-DD/<filename>.mp3`. Host HTTPS đã được kiểm tra trực tiếp bằng HEAD trên [file mẫu công khai của FPT](https://file01.fpt.ai/public/tts/loichao_banmaiace_02.mp3), trả HTTP 200, MIME audio/mpeg. Đường dẫn public demo chỉ dùng xác minh host, không được thêm vào allowlist generation. Không thêm wildcard `*.fpt.ai` hoặc cho redirect tùy ý. URL `async` được parse và giữ riêng phía server trước; full URL validation vẫn chạy trước mọi download. Nhờ đó URL bị chặn không làm mất reference và không synthesis lại khi admin thử tiếp. Không nhận URL tự do từ frontend.

Schema, giọng và host được tham chiếu từ [FPT v5](https://docs.fpt.ai/docs/en/speech/api/text-to-speech/). Chưa xác minh bằng live response. Nếu provider dùng host/MIME mới, pilot sẽ từ chối an toàn; cần xác minh rồi cập nhật riêng.

## UI

Mục **4. Âm thanh câu hỏi** nằm trong form tạo/sửa hiện có: trạng thái tổng, bảy segment, dropdown bảy giọng, số ký tự, thanh nghe thử ready, nút tạo từng đoạn/tạo các đoạn còn thiếu, xác nhận inline, trạng thái loading và lỗi. Câu hỏi chưa lưu hoặc có thay đổi chưa lưu không thể generation. Mở trang/đổi dropdown/lưu nội dung không tự gọi FPT. Trên mobile, danh sách thành một cột; audio controls không tràn ngang.

## File của TTS-1

Mới:

- `.env.fpt-tts.example`
- `server/domain/quiz-audio.ts`, `server/domain/quiz-audio-hash.ts`
- `server/models/quiz-audio.ts`
- `server/services/quiz-audio.ts`, `server/services/quiz-audio-config.ts`
- `server/infrastructure/fpt-tts.ts`, `server/infrastructure/quiz-audio-http.ts`
- `app/api/admin/quiz-questions/[id]/audio/route.ts`
- `app/api/admin/quiz-questions/[id]/audio/generate/route.ts`
- `features/questions/question-audio.tsx`
- `tests/quiz-audio.test.mjs`, `scripts/check-quiz-audio.mjs`
- Ba báo cáo/hướng dẫn TTS-1 trong `docs/`.

Sửa:

- `.gitignore`: cho phép version control file env example mới, tiếp tục ignore secrets.
- `server/repositories/speech.ts`: thêm manifest, mutex và upload quiz vào repository/storage có sẵn.
- `features/questions/question-form.tsx`, `app/admin/questions/questions.css`: section âm thanh và guard chưa lưu.
- `tests/tts-cleanup.test.mjs`: chỉ cấm legacy Google TTS; cho phép provider FPT mới theo phạm vi đã được yêu cầu.

Không coi các diff TTS-0 có sẵn là thay đổi mới của TTS-1.

## Kiểm thử

Kết quả: **239/239 unit/regression tests** (23 test mới TTS-1), **15/15 nhóm browser checks** ở 1440×900, 390×844 và 375×667. TypeScript đạt. Production build đạt, tạo 44 trang và 84 PWA assets trong bản sao cô lập. Các file TTS-1 đạt lint không có lỗi/cảnh báo; lint toàn source còn baseline được liệt kê bên dưới.

Kết quả cuối cùng và danh sách checks trong `tts-phase-1-test-report.json`. Unit/regression có guard chặn fetch/MongoDB; FPT, R2 và metadata repository đều mock. Browser chạy source copy không có `.env.local`, API fixture và chặn request ngoài localhost. Build chạy bản sao với flag tắt/credential rỗng; không ghi PWA asset manifest hoặc `.next` của server chính.

Lệnh tái chạy:

```text
node --import ./scripts/support/chat-history-offline-guard.mjs --test tests/quiz-audio.test.mjs tests/tts-cleanup.test.mjs tests/pwa.test.mjs tests/history-game.test.mjs tests/character-questions.test.mjs tests/character-images.test.mjs tests/chat.test.mjs tests/chat-repositories.test.mjs tests/chat-demo.test.mjs tests/chat-ai.test.mjs tests/chat-ai-errors.test.mjs tests/chat-fallback.test.mjs tests/chat-history.test.mjs tests/knowledge-generation.test.mjs
npx tsc --noEmit
node scripts/check-quiz-audio.mjs browser
node scripts/check-quiz-audio.mjs build
```

Ảnh desktop/mobile và log nằm trong `.local/tts-phase-1/` (không publish). Browser test kiểm tra controls/source URL, không chứng minh âm thanh nghe được hoặc chất lượng giọng: file playback là fixture. Chưa chạy integration MongoDB thật hoặc live R2; kiểm tra quyền, index thực tế và playback thật nằm trong bước smoke test được duyệt sau.

ESLint toàn source còn 5 lỗi loader test cũ (`no-assign-module-variable`) và 1 cảnh báo ảnh ở `app/author/page.tsx`; không sửa ngoài phạm vi. Các file runtime/test/harness TTS-1 không có lỗi/cảnh báo mới.

## Rủi ro, rollback và bước tiếp

Không thể bảo đảm exactly-once billing nếu POST được FPT nhận nhưng kết nối đứt trước khi trả URL. Lỗi metadata sau upload có thể tạo object chưa được tham chiếu; không tự cleanup. URL async bị lưu lỗi hoặc file provider hỏng sẽ cần kiểm tra thủ công, không có nút âm thầm tái synthesis. Mutex không thay thế durable background queue; pilot không triển khai queue hoặc migration.

R2 public playback hiện theo kiến trúc media công khai có sẵn. Đây không phải signed URL hoặc cơ chế bảo vệ bản quyền âm thanh. Không mở endpoint public để tạo audio.

Tắt `FPT_TTS_ENABLED` rồi restart để chặn request mới. Rollback riêng danh sách file TTS-1, không reset các thay đổi có sẵn. Không xóa speech_assets/MP3. Không tích hợp playback player hoặc PWA trong phase này.

Xem `tts-phase-1-setup.md` để chọn ID, cấu hình key và thử đúng một segment sau khi chủ dự án cho phép. Kết thúc triển khai ở đây; **0 FPT live calls, 0 R2 live writes, 0 MongoDB writes**, không sửa `.env.local`, không deploy.

## Chẩn đoán lỗi URL sau lần admin chạy thật

Ảnh lỗi “Host hoặc đường dẫn audio chưa được xác minh với FPT” cho thấy request đã đi tới bước URL validation, trước download và upload R2. Lỗi tương thích xác định trong code: chỉ whitelist ví dụ S3 v4, không hỗ trợ host FPT v5 nêu trên. Chưa thu được URL async thật của lượt lỗi: phản hồi người dùng gửi là lệnh curl, không phải JSON response. Vì vậy chưa khẳng định hostname cụ thể của lượt đó, hoặc audio thực đã tạo xong. Không chạy lại lệnh curl hoặc generation để đoán URL.

Bản sửa kiểm thử: **34/34 tests** (26 TTS + 8 cleanup), TypeScript và scoped ESLint đều đạt. Có mock pipeline từ response URL v5 đến ready metadata/R2 upload, từ chối URL giả mạo/query/port/path không hợp lệ, và kiểm tra URL bị từ chối được giữ nhưng không fetch hoặc synthesis thêm khi retry. Artifact `.local/tts-phase-1/url-fix-tests.json`; không chạy lại browser vì không sửa UI. Chưa kiểm chứng live generation sau sửa.

Lượt lỗi cũ xảy ra trước khi lưu URL nên bản sửa không thể tự phục hồi URL ấy. Nếu admin chọn tạo lại, có thể phát sinh một synthesis POST và tiêu hao ký tự mới. Kiểm tra Console/quota trước khi xác nhận. Dừng sau cập nhật code, không tự ghi MongoDB/R2 hoặc sửa env.
