# Phase TTS-0 — Gỡ Google Cloud Text-to-Speech

Thực hiện: 24–25/10/2026. Phạm vi: cleanup nhà cung cấp cũ, giữ phát MP3 và R2; không tích hợp FPT.AI.

## Audit và phân loại

Đã đọc AGENTS.md, toàn bộ `.agents/rules/`, tài liệu Route Handler của Next.js 16.3.6 đang cài, luồng quản lý nhân vật/câu hỏi, quiz online/local, narration player, PWA pack/service worker, storage R2 và các test liên quan. Kiểm tra schema/collection bằng source; không kết nối MongoDB production để kiểm kê hoặc chạy test. Chỉ kiểm tra tên biến trong `.env.local`, không in giá trị hoặc sửa file.

| Nhóm | Thành phần đã tìm thấy | Xử lý |
|---|---|---|
| A — riêng Google TTS | REST client `google-tts.ts`, GoogleAuth/ADC, `voices.list`, `text:synthesize`, parser base64 `audioContent` | Xóa client và tất cả cấu hình/xác thực/lời gọi |
| A | Danh sách 40 giọng, default voice, validator giọng, chia text theo giới hạn byte Google | Gỡ khỏi domain |
| A | `speechParts`, hash `google-mp3-v1`, `cachedNarration`, `attachOfflineSpeech`, lease/ready lookup/release cache | Gỡ cơ chế tìm và tạo audio theo provider cũ |
| A | Server Actions lấy giọng/nghe thử/plan/tạo audio, tác vụ lặp trong trang admin | Xóa actions, service và UI; không còn trigger synthesis |
| A | VoicePicker/PrepareSpeech và CSS riêng, tài liệu cấu hình, env example và test Google cũ | Xóa; thay bằng test cleanup/MP3 dùng mock |
| B — dùng chung | `NarrationPlayer`, HTMLAudioElement, play/pause/replay/mute, loading/blocked/error, CSS player | Giữ nguyên |
| B | `QuestionAudio`, `PublicQuestion.narration`, `AnswerResult.narration`, formatter `questionSpeech` | Giữ kiểu playlist và tiện ích không phụ thuộc provider |
| B | Local grading gắn playlist đúng/sai, PWA cache MP3/byte range | Giữ nguyên cơ chế phát URL đã có |
| B | R2 client, upload ảnh, `storeSpeech`, `readSpeechFile`, GET `/audio/[id]` | Giữ storage/MP3 resolver và đường dẫn R2 cũ |
| C — Google khác | `@google/genai`, matcher/generation Gemini, Google Fonts | Không sửa |

Không tìm thấy browser `SpeechSynthesis` độc lập trong mã ứng dụng. Không có fallback đọc bằng trình duyệt hoặc provider khác được thêm vào. Synthesis cũ là **Server Actions**, không phải route `/api/tts`; GET `/audio/[id]` chỉ đọc file đã có, không tổng hợp.

## File đã xóa

- `.env.tts.example`
- `actions/speech.ts`
- `server/infrastructure/google-tts.ts`
- `server/services/speech.ts`
- `features/characters/voice-picker.tsx`
- `features/characters/prepare-speech.tsx`
- `docs/google-tts.md`
- `tests/speech.test.mjs`
- `tests/speech.browser.mjs` — test cũ ghi fixture trực tiếp qua `MONGODB_URI`; không chạy test này trong cleanup.

## File đã chỉnh sửa/tạo

- `server/domain/character.ts`: bỏ voice khỏi input/public DTO và bỏ validator Google.
- `server/models/character.ts`: giữ `voiceName?: string` như metadata legacy, không dùng để chọn giọng.
- `server/repositories/characters.ts`: không gán voice mặc định hoặc trả voice ra UI.
- `server/services/characters.ts`: lưu nhân vật không đọc form voice, không gọi Google; `$set` các field hiện tại không xóa voice cũ trong DB.
- `features/characters/character-form.tsx`, `app/admin/characters/[id]/page.tsx`, `app/admin/characters/characters.css`: bỏ bộ chọn giọng, nghe thử và tạo audio riêng Google.
- `server/domain/speech.ts`: giữ playlist và formatter chung, bỏ mapping/chunking Google.
- `server/repositories/character-questions.ts`: bỏ truy vấn chỉ phục vụ plan synthesis.
- `server/repositories/speech.ts`: bỏ đọc cache ready và claim/release generation; giữ upload/read MP3 dùng chung.
- `server/services/quizzes.ts`: bỏ lookup audio theo hash Google, giữ nguyên chọn/chấm đáp án; không có URL thì không phát âm thanh.
- `server/services/offline-game.ts`: bỏ bước gắn audio từ cache Google, giữ lọc orphan/version/playlist đã có trong dữ liệu đầu vào.
- `package.json`, `package-lock.json`: gỡ dependency trực tiếp chỉ phục vụ TTS.
- `tests/history-game.test.mjs`, `tests/pwa.test.mjs`: bỏ mock service đã xóa.
- `tests/tts-cleanup.test.mjs`: mới, kiểm tra cleanup, tương thích metadata cũ, playlist local và R2/route bằng mock.
- `scripts/check-game-chat-access.mjs`: thêm chế độ `--tts0`, kiểm tra thiếu audio và chặn request TTS trong bản sao cô lập.
- `docs/pwa.md`: cập nhật hành vi audio sau cleanup.
- `docs/tts-phase-0-cleanup.md`, `docs/tts-phase-0-test-report.json`: báo cáo.

## Dependency và env

Đã chạy `npm uninstall google-auth-library --ignore-scripts --no-audit --no-fund --offline`. Gỡ dependency trực tiếp `google-auth-library@11.3.0`, cùng hai package chỉ còn thuộc nhánh này (`gcp-metadata@9.2.0`, `google-logging-utils@2.1.0`). Không nâng cấp dependency khác, không thêm thư viện.

`npm ls google-auth-library @google/genai --all` xác nhận `@google/genai@2.30.0` vẫn dùng `google-auth-library@10.9.1` gián tiếp. **Giữ nguyên dependency gián tiếp đó**; nó không phải dấu hiệu Google TTS còn hoạt động. Source ứng dụng trước cleanup chỉ import trực tiếp GoogleAuth ở client TTS, không có OAuth flow dùng dependency trực tiếp này.

Các biến TTS không còn được source yêu cầu, có thể kiểm tra và xóa thủ công trên môi trường triển khai sau khi cập nhật:

- `GOOGLE_TTS_PROJECT_ID`
- `GOOGLE_TTS_CLIENT_EMAIL`
- `GOOGLE_TTS_PRIVATE_KEY`
- `GOOGLE_TTS_USE_ADC`
- `GOOGLE_APPLICATION_CREDENTIALS`: chỉ xóa khi chắc chắn môi trường đó không dùng ADC cho dịch vụ Google khác. Không xóa file credential tự động.

Các tên ví dụ `GOOGLE_TTS_ENABLED`, `GOOGLE_TTS_VOICE`, `GOOGLE_TTS_LANGUAGE`, `GOOGLE_TTS_CREDENTIALS`, `GOOGLE_CLOUD_TTS`, `GOOGLE_CLOUD_PROJECT` không có consumer TTS trong source khảo sát. Không tự chỉnh `.env.local`, Vercel, Gemini flag/API key hoặc billing. Repository không có `.env.example` chung; file mẫu riêng Google TTS đã được xóa.

## Dữ liệu và âm thanh cũ

- Không chạy migration, xóa document/field, reset quota hoặc upload/xóa R2.
- `characters.voiceName` cũ được giữ nguyên trong DB nhưng bị bỏ qua. Test admin edit xác nhận không `$unset` hoặc ghi đè field này.
- Collection `speech_assets` và object `audio/tts/<hash>.mp3` vẫn tồn tại. Giữ metadata storage để không phá hợp đồng lưu trữ cũ.
- `storeSpeech` chỉ là helper lưu bytes vào R2 và cập nhật metadata; không còn caller runtime/Server Action để tạo audio, không có provider initialization trong helper. Không gọi helper ghi trong cleanup.
- `/audio/<hash>` vẫn đọc đúng object cũ và hỗ trợ byte range. Playlist đã tải trong pack cũ vẫn phát được nếu URL/file còn truy cập được.
- **Giới hạn có chủ ý:** cache cũ chỉ lưu hash/trạng thái, không có quan hệ provider-independent từ câu hỏi đến MP3. Sau khi gỡ Google hash/voice lookup, lượt chơi hoặc pack tải mới sẽ không tự tìm lại các MP3 này. UI báo “Chưa có âm thanh cho nội dung này.” và disable nút nghe; quiz/chatbot vẫn hoạt động. Một lần PWA đồng bộ thành công có thể thay pack có playlist cũ bằng pack mới không có playlist. Không có file R2 nào bị xóa bởi cleanup.
- Nếu cần khôi phục liên kết MP3 cũ, cần kế hoạch riêng: inventory read-only, ánh xạ đoạn audio với version nội dung, review stale/thiếu file, rồi migration metadata được chủ dự án duyệt. Không tạo/chạy migration trong TTS-0.

## Kiểm thử

Kết quả chi tiết và giới hạn được lưu ở `docs/tts-phase-0-test-report.json`; artifact tại `.local/tts-phase-0/`.

| Kiểm tra | Kết quả |
|---|---|
| TypeScript `npx tsc --noEmit` | PASS |
| Unit/regression | **216/216 PASS**, 0 fail |
| Browser desktop/mobile | **21/21 nhóm PASS**, gồm cả bốn nhân vật |
| ESLint runtime sửa, test mới và harness | PASS |
| ESLint toàn source (bỏ `.local/**`) | 5 lỗi baseline, 1 warning baseline; không có lỗi mới |
| Production `npm run build` cô lập | PASS, 44 trang static, 84 tài nguyên PWA |
| Provider live / MongoDB thật / upload R2 | **0** |

Năm lỗi lint baseline là `@next/next/no-assign-module-variable` trong `tests/character-images.test.mjs`, `tests/character-questions.test.mjs`, `tests/history-game.test.mjs`, `tests/orders.test.mjs`, `tests/support/load-typescript.mjs`. Warning `@next/next/no-img-element` ở `app/author/page.tsx`. Trong `history-game.test.mjs` chỉ bỏ mock TTS; dòng loader gây lint có sẵn và không thay đổi. Build có warning nhiều lockfile do workspace sao chép, không có lỗi build.

- Unit/regression chạy với MongoDB và provider bị chặn; repository/storage được mock. Không tạo MP3, không gọi TTS/Gemini, không đọc/ghi DB thật.
- Bộ cleanup kiểm tra không còn import/client/credential/synthesis/voice mapping, legacy metadata, submit form cũ, playlist prompt/correct/incorrect, offline pack, đọc R2 và HTTP 200/206/404/416/503 của audio route.
- Browser dùng GamePlayer, CharacterChat, NarrationPlayer và CSS thật; mock transport quiz/chat và context PWA trong bản sao, không sửa runtime để phục vụ test. Chạy desktop 1440×900, mobile 390×844 và 375×667. Kiểm tra nút nghe disabled khi thiếu URL, chốt đúng/sai, retry, đổi lượt, phản hồi đến muộn và bốn nhân vật.
- Không nghe MP3 thật từ R2, không test autoplay/loa/bàn phím trên iPhone vật lý. Tính tương thích đọc MP3/byte range được kiểm bằng mock và regression PWA. Không tuyên bố đã nghiệm thu audio production.
- Build dùng đúng `npm run build` (Next + PWA assets) trong bản sao không sao chép `.env.local`; không deploy, không thay build server chính.
- ESLint toàn source bỏ `.local/**` để không lint generated build artifacts. Các lỗi baseline ngoài thay đổi được báo riêng, không sửa ngoài phạm vi.

Lệnh chạy lại:

```sh
npx tsc --noEmit
npx eslint . --ignore-pattern .local/**
node --import ./scripts/support/chat-history-offline-guard.mjs --test tests/tts-cleanup.test.mjs tests/pwa.test.mjs tests/history-game.test.mjs tests/character-questions.test.mjs tests/character-images.test.mjs tests/chat.test.mjs tests/chat-repositories.test.mjs tests/chat-demo.test.mjs tests/chat-ai.test.mjs tests/chat-ai-errors.test.mjs tests/chat-fallback.test.mjs tests/chat-history.test.mjs tests/knowledge-generation.test.mjs
node scripts/check-game-chat-access.mjs browser --tts0
node scripts/check-game-chat-access.mjs build --tts0
```

## Rà soát sau cleanup và rollback

Mã runtime không còn Google TTS client, endpoint synthesis, credentials, voice catalogue hoặc background trigger. Chuỗi Google TTS còn được giữ trong báo cáo này, test chống tái xuất hiện và câu ghi lịch sử trong `docs/knowledge-pipeline.md`. Các bản source/build cũ dưới `.local/`, Git history và node_modules là artifact/dependency, không phải mã ứng dụng hiện tại; không tự xóa chúng. Máy đang chạy bundle cũ cần restart/rebuild sau khi chủ dự án triển khai thay đổi; cleanup không tắt tiến trình đang dùng của người dùng.

Rollback: hoàn tác riêng các thay đổi TTS-0, khôi phục package.json/lockfile rồi `npm ci` theo môi trường của dự án; rebuild/restart phiên bản cũ. Không cần hoàn tác DB/R2 vì không có dữ liệu bị sửa. Không reset toàn working tree, không hoàn tác các file `.env.*.example` đã có trước task. Không tự bật lại API/billing hay sửa secret.

Dừng ở Phase TTS-0; chưa triển khai FPT.AI hoặc provider abstraction mới.
