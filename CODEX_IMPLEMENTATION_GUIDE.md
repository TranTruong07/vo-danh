# CODEX IMPLEMENTATION GUIDE — Chatbot nhập vai cho boardgame QR (Strict Approved Knowledge)

> **Dành cho Codex trong dự án Next.js App Router + TypeScript.** Nguồn tri thức duy nhất: `Tổng hợp kiến thức.docx` do chủ dự án cung cấp. Mục tiêu: tích hợp vào boardgame QR đang hoạt động, chatbot mô phỏng 4 nhân vật **Trường Chinh, Lê Duẩn, Phạm Văn Đồng, Võ Nguyên Giáp**, chỉ trả lời từ **ngân hàng câu hỏi/đáp án đã được người quản trị phê duyệt**. Không gọi LLM khi người dùng chat.

## 0. Chỉ dẫn thực thi bắt buộc cho Codex

1. **Đọc toàn bộ file này trước khi sửa code.** Kiểm tra codebase hiện tại (`package.json`, `src/app`, thư viện DB, auth, UI, cấu hình deploy). Giữ nguyên các chức năng đang có; tái sử dụng convention, UI component và MongoDB connection sẵn có. Không tạo project mới nếu repository đã tồn tại.
2. Lập kế hoạch ngắn và checklist trước khi sửa; triển khai từng giai đoạn, chạy lint/typecheck/test sau mỗi giai đoạn. Nếu thiếu file DOCX, **không tự tạo dữ liệu lịch sử giả**; báo cần đặt file vào `docs/source/Tong-hop-kien-thuc.docx` (hoặc đường dẫn do người dùng chỉ định).
3. **Không sử dụng API LLM, RAG generative, fine-tuning hoặc truy cập Internet để sinh câu trả lời ở runtime.** Fuse.js chỉ dùng tìm câu hỏi gần giống; kết quả fuzzy/semantic **chỉ là gợi ý để người dùng chọn**, không được tự động lấy đáp án.
4. Chỉ câu hỏi `status=approved` và `characterAnswers[characterId]` đã duyệt mới được trả về. Không có dữ liệu → từ chối bằng mẫu cố định. Tuyệt đối không thêm nội dung lịch sử mới vào câu trả lời runtime.
5. Mọi dữ liệu do AI hỗ trợ sinh ở giai đoạn offline phải mang trạng thái `draft` và được người quản trị phê duyệt trước khi phát hành. Không mặc định `approved`.
6. Bốn nhân vật là **mô phỏng giáo dục**, không phải phát ngôn nguyên văn của người thật. Không bịa lời nói, ký ức cá nhân, trải nghiệm trực tiếp. Nếu dùng ngôi thứ nhất, chỉ dùng trong nội dung đã được duyệt và không gán trải nghiệm sai.
7. Không làm lộ `MONGODB_URI`, secrets hoặc nội dung chưa duyệt ra client. Không thêm package không cần thiết. Ưu tiên giải pháp chạy được trên Vercel Hobby + MongoDB Atlas M0, nhưng không cam kết free vô điều kiện.
8. Không tự thay đổi schema hiện có hay xoá dữ liệu production. Mọi script import phải hỗ trợ `--dry-run`, upsert theo ID ổn định, không ghi đè dữ liệu `approved` khi chưa có lệnh rõ ràng.
9. Nếu có xung đột giữa nội dung tài liệu và giả định thông thường, **giữ nguyên tài liệu, gắn cờ cần người quản trị xem xét**, không âm thầm sửa bằng kiến thức ngoài.
10. Sau khi hoàn tất, báo cáo các file đã thay đổi, lệnh đã chạy, kết quả test, biến môi trường cần cấu hình, các phần còn cần duyệt thủ công.


## 0A. Bối cảnh sản phẩm và quyết định đã chốt (ưu tiên cao)

- Dự án là **boardgame hỗ trợ bằng QR**, không phải ứng dụng chatbot độc lập. Người chơi quét một trong bốn QR, màn hình hiển thị nhân vật lịch sử tương ứng, câu hỏi trắc nghiệm ABCD và một popup chat ngay trên trang chơi.
- Frontend boardgame, câu hỏi trắc nghiệm, luồng QR và popup chat **đã gần hoàn thành**. Nhiệm vụ của Codex là **bổ sung logic chatbot và nối vào UI hiện có**, sửa tối thiểu.
- Bốn nhân vật: `truong-chinh`, `le-duan`, `pham-van-dong`, `vo-nguyen-giap`. Phải đọc mapping ID thực tế trong repo, không tự ép đổi tên ID hiện có; dùng adapter nếu khác.
- Người dùng **đã chọn chế độ B**: chatbot trả lời tự do **trong phạm vi tài liệu đã duyệt**, không áp dụng cơ chế che/khóa đáp án quiz. Điều này không cho phép chatbot trả lời bằng kiến thức ngoài tài liệu.
- **Phương án A về tính nghiêm ngặt vẫn giữ nguyên**: runtime chỉ trả chuỗi đã duyệt, không LLM tự sinh. "Trả lời tự do" ở đây nghĩa là tự do đặt câu hỏi về tài liệu, không phải tự do tạo kiến thức mới.
- Ưu tiên miễn phí: không gọi AI trả phí khi chat, tận dụng Next.js + MongoDB hiện có + Fuse.js. Không tự thêm Qdrant/Redis/AI API.

### Quy tắc phiên/QR bắt buộc

1. Khảo sát nguồn xác định nhân vật: route params, QR payload, game session, cookies/token, database. Vẽ sơ đồ ngắn luồng dữ liệu thực tế **trước khi code**.
2. Nếu đã có session được server xác thực, dùng session để lấy nhân vật. Nếu chỉ có QR URL công khai, **không gọi nó là xác thực bảo mật**: người dùng có thể đổi URL. Trong boardgame public, có thể chấp nhận QR URL là lựa chọn nhân vật nếu đây là yêu cầu sản phẩm; phải phân biệt rõ với chống giả mạo, và không tuyên bố bảo vệ chống đổi nhân vật.
3. Không làm client truyền `characterId` rồi tin tuyệt đối. Khi chưa có session đáng tin, đề xuất cơ chế server-issued signed token hoặc server session; chỉ triển khai sau khi hiểu hạ tầng hiện tại. Tránh tạo hệ thống đăng nhập không cần thiết.
4. Chỉ có bốn nhân vật trong tài liệu; đừng thêm Ngô Quyền thành nhân vật chat chỉ vì quiz minh họa đang hỏi về Ngô Quyền.
5. Chat không được sửa đáp án quiz, trạng thái câu hỏi, điểm số, tiến độ, animation hay nút "Chốt đáp án".

### API và vòng đời đề xuất

```text
QR scan -> trang chơi hiện hữu -> session/QR character mapping
    |                               |
    +-> nhân vật 2D                 +-> server resolve characterId
    |                                      |
    +-> popup chat -> /api/chat {sessionId, message}
                                           |
                                  approved Q&A matching
                                           |
                                characterAnswers[characterId]
                                           |
                                   trả về chat panel

Quiz ABCD -> submit/chốt đáp án (luồng độc lập, không bị chatbot can thiệp)
```

### Ranh giới phạm vi

- Tài liệu gốc hiện tại chỉ về Cách mạng tháng Tám 1945 và vai trò của bốn nhân vật. Câu hỏi lịch sử khác không mặc nhiên hợp lệ chỉ vì nhân vật có liên quan.
- Các câu hỏi kiểu "Bác ơi", "Đồng chí ơi" hoặc đại từ xưng hô phải được hỗ trợ qua alias đã duyệt/tiền xử lý an toàn; không tự cắt các thành phần làm thay đổi nghĩa câu hỏi.
- Nếu câu hỏi nhiều ý nhưng không có đáp án kết hợp được duyệt, hãy gợi ý các câu hỏi có sẵn hoặc từ chối; không ghép nhiều câu trả lời tự do tại runtime.

## 1. Phạm vi tri thức và các quy tắc lịch sử

Tài liệu gồm 10 phần: I Khái quát chung; II Bối cảnh lịch sử; III Quá trình chuẩn bị; IV Diễn biến; V Vai trò bốn đồng chí; VI Kết quả và ý nghĩa; VII Nguyên nhân thắng lợi; VIII Bài học kinh nghiệm; IX Các điểm cần phân biệt; X Kết luận.

**Các điểm kiểm duyệt đặc biệt theo chính tài liệu:**
- **Lê Duẩn:** mục V có đính chính rằng ông bị giam tại Côn Đảo từ năm 1940 và chỉ trở về đất liền sau khi Cách mạng tháng Tám thành công. Không tạo đáp án nói ông trực tiếp chỉ huy khởi nghĩa Sài Gòn tháng 8/1945.
- **Quân lệnh số 1:** tài liệu nêu ban bố đêm 13/8/1945 và Võ Nguyên Giáp đọc tại Tân Trào ngày 16/8/1945; phân biệt hai hành động.
- **19/8, 23/8, 25/8, 2/9:** phân biệt giành chính quyền Hà Nội, Huế, Sài Gòn và Tuyên ngôn Độc lập.
- Không quy thắng lợi cho một cá nhân; phải giữ vai trò của Đảng, Hồ Chí Minh, Việt Minh và nhân dân theo tài liệu.
- Không suy diễn các sự kiện ngoài tài liệu, dù có liên quan cùng nhân vật (ví dụ Điện Biên Phủ 1954).

## 2. Kiến trúc

```text
Boardgame QR hiện hữu -> resolve game session -> nhân vật đang hiển thị
  └── Chat widget có sẵn -> POST /api/chat {sessionId, message}
      ├── validate input (Zod), auth/rate-limit nếu đã có
      ├── xác thực phiên và resolve characterId phía server
      ├── lấy approved question index từ MongoDB
      ├── EXACT MATCH (normalized canonicalQuestion + aliases)
      │    └── trùng duy nhất -> trả characterAnswers đã duyệt
      ├── FUZZY MATCH (Fuse.js)
      │    └── có ứng viên -> chỉ trả ID + canonicalQuestion để gợi ý
      └── không có -> refusal template theo character

Người dùng click gợi ý
  └── POST /api/chat/answer { sessionId, questionId }
      └── server tự kiểm tra approved + answer tồn tại -> trả đáp án

Offline admin/import:
DOCX -> trích xuất có nguồn -> draft Q&A -> review -> approved -> MongoDB
```

**Không có đường nào cho client tự cung cấp `answer`, `status`, `source` hoặc tự ép backend bỏ qua kiểm tra.**

## 3. Stack và phụ thuộc

- Next.js App Router, TypeScript, Node.js runtime cho API routes.
- MongoDB: dùng `mongodb` driver hoặc Mongoose **đã có trong repo**, không cài cả hai nếu không cần.
- `fuse.js` để tìm gợi ý; `zod` để validate (nếu repo có validation framework tương đương, ưu tiên tái sử dụng).
- Unit tests: dùng Vitest/Jest theo convention hiện có; nếu chưa có, đề xuất Vitest.
- DOCX extraction offline: script Python `python-docx` **hoặc** JS `mammoth`; chọn theo repo. Phải trích xuất cả **bảng** và đoạn văn theo thứ tự nguồn.
- Không cần vector DB, GPU, embedding API, LLM API ở runtime.

Lệnh cài tham khảo (chỉ khi chưa có):

```bash
npm install fuse.js zod
npm install -D vitest
```

## 4. Cấu trúc thư mục đề xuất (điều chỉnh theo repo)

```text
src/
  app/
    api/chat/route.ts
    api/chat/answer/route.ts
    # KHÔNG tạo chat/page.tsx trừ khi dự án thật sự cần route riêng
  components/chat/
    # KHÔNG tạo CharacterSelector.tsx: nhân vật do QR/phiên chơi quyết định
    ChatWindow.tsx                 # tái sử dụng cửa sổ chat đang có
    SuggestedQuestions.tsx
  lib/
    db/mongodb.ts
    repositories/knowledge-question.repository.ts
    chat/types.ts
    chat/characters.ts
    chat/normalize.ts
    chat/matcher.ts
    chat/service.ts
    chat/character-resolver.ts
    chat/game-session-adapter.ts
    chat/rate-limit.ts                 # nếu cần, phù hợp Vercel
  tests/chat/
    matcher.test.ts
    service.test.ts
    api.test.ts
scripts/
  extract-knowledge.ts                # hoặc .py
  import-knowledge.ts
  validate-knowledge.ts
  generate-drafts.ts                  # optional, offline only
knowledge/
  draft-questions.json
  approved-questions.json             # nếu dùng version-controlled approvals
  extraction-manifest.json
docs/source/
  Tong-hop-kien-thuc.docx             # do người dùng cung cấp
```

Không commit `.env.local`, secrets, hay bản sao tài liệu nếu repository public mà chủ dự án chưa cho phép.

## 5. Data model bắt buộc

```ts
export const CHARACTER_IDS = [
  'truong-chinh', 'le-duan', 'pham-van-dong', 'vo-nguyen-giap'
] as const;
export type CharacterId = typeof CHARACTER_IDS[number];

export type KnowledgeQuestion = {
  _id: string;                        // ID ổn định, ví dụ cmtt45-v1-q001
  topicId: 'cach-mang-thang-tam-1945';
  sectionId: string;                  // ví dụ V.4
  canonicalQuestion: string;
  aliases: string[];
  normalizedPhrases: string[];        // sinh từ canonicalQuestion + aliases
  approvedAnswer: string;            // nội dung trung tính
  characterAnswers: Record<CharacterId, string>; // 4 câu trả lời được duyệt
  source: {
    document: string;
    sectionId: string;
    excerpt: string;                 // đoạn trích ngắn có trong DOCX
    paragraphIndex?: number;
    tableIndex?: number;
  };
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  version: number;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
```

**Index:** `{ status: 1, topicId: 1 }`, index/unique `_id` mặc định; index `{ sessionId: 1, createdAt: 1 }` cho chat messages nếu lưu lịch sử. Chỉ tải dữ liệu approved cần thiết. Với ngân hàng nhỏ có thể cache trong process với TTL ngắn, nhưng không dựa vào cache để phê duyệt và không giả định cache chia sẻ giữa các Vercel instances.

**Kiểm duyệt:** `approved` chỉ khi đủ canonicalQuestion, source excerpt có thể đối chiếu, approvedAnswer, cả bốn characterAnswers, reviewedBy, reviewedAt. `source.excerpt` phải xuất hiện trong văn bản trích xuất đã chuẩn hóa (có thể cần so khớp Unicode/whitespace). Phân biệt nội dung mô phỏng với trích dẫn lịch sử.

## 6. Matching: thuật toán an toàn

1. Chuẩn hóa đầu vào bằng `NFC`, lowercase tiếng Việt, trim, chuẩn hóa whitespace và dấu câu; **không xóa dấu tiếng Việt trong bước exact**; không xóa từ phủ định như `không`, `chưa`, `khác`.
2. Nếu normalized input trùng **duy nhất** với canonicalQuestion hoặc alias của một record approved → `answered`.
3. Nếu trùng nhiều record khác nhau → `suggest` (không tự chọn).
4. Nếu không exact, dùng Fuse.js tìm tối đa 3 câu hỏi approved; ví dụ threshold `0.25` chỉ là giá trị thử nghiệm, phải điều chỉnh qua bộ test. **Không bao giờ auto-answer fuzzy**, kể cả điểm rất cao.
5. Không có gợi ý phù hợp → `out_of_scope`.
6. Input rỗng, quá 500 ký tự, `characterId` sai → HTTP 400; không echo raw input trong lỗi.
7. Chỉ chấp nhận `questionId` từ click gợi ý qua endpoint `/api/chat/answer`; server **phải truy vấn lại** record approved, không tin dữ liệu frontend.
8. Câu hỏi đa ý, tiền đề sai, đảo phủ định, đổi chủ thể/ngày tháng phải nằm trong bộ test chống false positive. Với strict mode, thà gợi ý/từ chối còn hơn trả sai.

**Contract response:**

```ts
type ChatResponse =
  | { status: 'answered'; characterId: CharacterId; questionId: string; answer: string; source: { sectionId: string; document: string } }
  | { status: 'suggest'; suggestions: { questionId: string; question: string }[] }
  | { status: 'out_of_scope'; characterId: CharacterId; answer: string };
```

Không trả `characterAnswers` của các nhân vật khác hay các record chưa duyệt.

## 7. Nhân vật và từ chối

Định nghĩa cấu hình bốn nhân vật server-side. Mỗi nhân vật có `name`, `displayName`, `refusalText`, `introText` và metadata UI/avatar nếu dự án đã có ảnh được phép sử dụng.

- Trường Chinh: mô phỏng lối diễn đạt chặt chẽ, nhấn mạnh chiến lược.
- Lê Duẩn: mô phỏng lối diễn đạt mạch lạc, chú trọng tổ chức phong trào; tuyệt đối không kể trải nghiệm trực tiếp khởi nghĩa Sài Gòn 8/1945.
- Phạm Văn Đồng: mô phỏng điềm đạm, giải thích dễ hiểu.
- Võ Nguyên Giáp: mô phỏng điềm tĩnh, chú trọng tổ chức lực lượng vũ trang.

Các mô tả này là **quy ước thiết kế**, không phải lời nói nguyên văn hoặc chứng cứ lịch sử. Mỗi `characterAnswers` phải được người quản trị đọc duyệt. Refusal là template cố định, ví dụ: “Tư liệu Cách mạng tháng Tám năm 1945 được cung cấp chưa có đủ căn cứ để trả lời câu hỏi này. Bạn có thể hỏi về diễn biến, ý nghĩa hoặc vai trò của các nhân vật trong tài liệu.”

## 8. API chi tiết

### `POST /api/chat`

Request: `{ "sessionId": "game-session-123", "message": "Ai tổ chức Đội Việt Nam Tuyên truyền Giải phóng quân?" }`. Không nhận `characterId` làm nguồn xác thực; server resolve từ phiên/QR hiện có.

- Validate Zod + JSON parse error.
- Xác thực session/QR theo cơ chế hiện có; lấy characterId từ server, kiểm tra session hợp lệ và hết hạn.
- Load approved questions.
- Match exact/fuzzy.
- Exact: lấy `characterAnswers[characterId]`, kiểm tra không rỗng; nếu thiếu thì từ chối và log cấu hình lỗi.
- Fuzzy: chỉ trả suggestion IDs + questions.
- No match: trả refusal.
- Không nhận `systemPrompt`, `role`, `answer`, `approved`, `source` từ client.

### `POST /api/chat/answer`

Request: `{ "sessionId": "game-session-123", "questionId": "cmtt45-v1-q001" }`. Server resolve nhân vật từ session, không tin `characterId` client.

- Validate input, resolve nhân vật từ session phía server.
- Truy vấn MongoDB `_id=questionId, status=approved`.
- Nếu không có: 404 hoặc refusal có cấu trúc; không lộ dữ liệu draft.
- Nếu có: lấy câu trả lời theo nhân vật đã duyệt, nguồn section và ID.
- Có thể hỗ trợ request id / structured logging; không log secrets.

### Lưu lịch sử (optional)

Nếu cần lưu lịch sử, chỉ lưu `characterId`, `questionId`, status, text do user nhập, timestamps và session ownership. Với người dùng chưa đăng nhập, cân nhắc session ephemeral trên client. Nếu có auth, kiểm tra quyền truy cập session ở server.

## 9. Tích hợp giao diện boardgame hiện có

- **Giữ nguyên giao diện hiện tại**: ảnh nền, nhân vật 2D, thẻ câu hỏi ABCD, nút chốt đáp án, popup chat bên phải, QR scan, điều hướng và các hiệu ứng. Không tự thiết kế lại trang chat.
- **Không có CharacterSelector trong chatbot.** Nhân vật hiển thị được xác định từ QR/phiên chơi và chat phải tự đồng bộ theo nhân vật đó. Không để client đổi nhân vật chỉ bằng payload API.
- Tái sử dụng chat panel hiện có; nối input, send, loading, error, message bubbles, suggestion chips và nhãn nguồn. Tránh sửa CSS không liên quan; đảm bảo desktop/mobile.
- Nếu quét QR khác, phải làm rõ lifecycle phiên: đổi nhân vật + greeting tương ứng + cô lập hoặc phân nhóm lịch sử chat theo session/character; không gán nhầm lời thoại nhân vật cũ cho nhân vật mới.
- Trạng thái `answered`: hiển thị đúng `characterAnswers[resolvedCharacterId]` và nguồn tài liệu; `suggest`: hỏi lại bằng nút gợi ý; `out_of_scope`: trả mẫu từ chối đúng nhân vật.
- **Chế độ B đã chốt**: người chơi được hỏi tự do mọi nội dung nằm trong tài liệu được duyệt, kể cả khi câu trả lời giúp giải câu trắc nghiệm đang hiển thị. **KHÔNG triển khai** Game Context Guard chống lộ đáp án, `blockedKnowledgeIds`, lọc câu trả lời theo currentQuestionId, gợi ý bắt buộc thay cho đáp án, hoặc can thiệp luồng chốt đáp án. Trắc nghiệm và chatbot hoạt động song song, độc lập.
- Không mặc định rằng câu trắc nghiệm hiện tại thuộc tài liệu. Ví dụ câu hỏi về Ngô Quyền/sông Bạch Đằng trong ảnh không có trong DOCX Cách mạng tháng Tám: chatbot phải từ chối nếu người chơi hỏi và ngân hàng chưa được bổ sung nội dung đã duyệt.
- Không cần streaming vì runtime không dùng LLM. Không thêm TTS nếu chưa được yêu cầu.

## 10. Trích xuất DOCX và xây dựng bộ dữ liệu

1. Đọc DOCX **bao gồm paragraphs và tables** theo thứ tự; xuất `knowledge/extraction-manifest.json` gồm sectionId, text, paragraph/table reference.
2. Chia theo 10 mục I–X và các tiểu mục. Không bỏ sót phần đính chính cuối mục V và các điểm phân biệt mục IX.
3. Tạo draft Q&A từ từng mục. Nếu dùng AI bên ngoài để hỗ trợ sinh offline, chỉ tạo file draft; tuyệt đối không tự duyệt. Không được chế thêm dữ kiện từ bên ngoài.
4. Mỗi record: canonicalQuestion, 2–5 aliases chất lượng, neutral approvedAnswer, bốn characterAnswers, source excerpt và sectionId.
5. Tạo script `validate-knowledge`: kiểm tra ID unique, alias trùng giữa các câu hỏi, nguồn tồn tại, 4 nhân vật đủ đáp án, trạng thái review, các cảnh báo mâu thuẫn.
6. Xuất báo cáo review dễ đọc (Markdown/CSV) để người quản trị duyệt từng câu.
7. Import bản nháp vào MongoDB với `status=draft` để phục vụ kiểm duyệt; chỉ bản được admin phê duyệt và công bố mới được truy xuất khi chat. Nếu duyệt bằng file version-controlled, vẫn phải có bước xác nhận người duyệt rõ ràng. Không tự tạo giao diện admin nếu chưa cần; cung cấp phương án duyệt qua CLI/JSON.
8. Script import: `--dry-run` mặc định, `--apply` khi được cho phép, upsert theo ID, không xóa record khác và không ghi đè approved vô tình.

**Dữ liệu minh họa — phải được duyệt trước khi đưa vào DB:**

```json
{
  "_id": "cmtt45-v1-q001",
  "topicId": "cach-mang-thang-tam-1945",
  "sectionId": "III.2",
  "canonicalQuestion": "Ai trực tiếp tổ chức và chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân?",
  "aliases": ["Ai chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân khi thành lập?"],
  "approvedAnswer": "Theo tài liệu, Võ Nguyên Giáp trực tiếp tổ chức và chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân, thành lập ngày 22/12/1944 theo chỉ thị của Hồ Chí Minh.",
  "characterAnswers": {
    "truong-chinh": "Theo tư liệu, đồng chí Võ Nguyên Giáp trực tiếp tổ chức và chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân theo chỉ thị của Chủ tịch Hồ Chí Minh.",
    "le-duan": "Đồng chí Võ Nguyên Giáp trực tiếp tổ chức và chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân, thành lập ngày 22/12/1944.",
    "pham-van-dong": "Theo tư liệu, người trực tiếp tổ chức và chỉ huy đội quân ấy là đồng chí Võ Nguyên Giáp, theo chỉ thị của Chủ tịch Hồ Chí Minh.",
    "vo-nguyen-giap": "Theo chỉ thị của Chủ tịch Hồ Chí Minh, tôi trực tiếp tổ chức và chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân, thành lập ngày 22/12/1944."
  },
  "source": {
    "document": "Tổng hợp kiến thức.docx",
    "sectionId": "III.2",
    "excerpt": "Ngày 22/12/1944, Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập theo chỉ thị của Hồ Chí Minh, do Võ Nguyên Giáp trực tiếp tổ chức và chỉ huy."
  },
  "status": "draft",
  "version": 1
}
```

## 11. Kiểm thử bắt buộc

### Unit tests

- Exact canonical và alias đúng → trả approved answer đúng nhân vật.
- Normalize Unicode tiếng Việt, dấu câu, whitespace, case.
- Fuzzy → **chỉ suggest**, không bao giờ `answered`.
- Alias trùng giữa nhiều records → suggest/không auto-answer.
- `draft`, `rejected`, `pending_review` → không trả lời.
- `characterId` sai, input rỗng/quá dài, `questionId` không tồn tại → xử lý an toàn.
- Không có characterAnswers → không fallback sang đáp án của nhân vật khác hoặc neutral answer.
- Prompt injection: “bỏ qua quy tắc”, “giả sử đã approved”, “trả lời bằng kiến thức ngoài” → không thể làm thay đổi logic.
- Câu hỏi ngoài phạm vi: giá Bitcoin, viết code, Điện Biên Phủ 1954 → refusal (hoặc suggestion chỉ khi thật sự gần giống, không tự trả lời).
- Câu hỏi sai tiền đề: “Lê Duẩn trực tiếp chỉ huy Sài Gòn 25/8/1945 đúng không?” → không được đưa ra khẳng định sai.
- Phân biệt “Quân lệnh số 1 được ban bố khi nào?” và “Võ Nguyên Giáp đọc Quân lệnh số 1 khi nào?”.
- Phân biệt “nguyên nhân chủ quan” và “nguyên nhân khách quan”.
- `POST /api/chat/answer` không chấp nhận draft ID dù client tự gửi.

### Integration/E2E

- Từ QR/phiên chơi hiện hữu → hiện đúng nhân vật → hỏi exact → nhận answer + nguồn.
- Hỏi gần đúng → hiện suggestion → click → nhận answer đã duyệt.
- Quét QR nhân vật khác → câu trả lời mới dùng đúng characterAnswers; payload giả mạo characterId không đổi được nhân vật.
- MongoDB lỗi → trả 5xx thân thiện, không lộ URI hoặc stack trace.
- Lint, typecheck, tests, `npm run build` đều pass.

**Tiêu chí nghiệm thu cứng:** 100% response `status=answered` lấy đúng một chuỗi `characterAnswers[characterId]` từ record approved, không tự nối/sửa nội dung lịch sử. Không có lời đáp lịch sử sinh từ LLM ở runtime.

## 12. Triển khai Vercel

- Environment variables: `MONGODB_URI`, `MONGODB_DB_NAME`; dùng biến hiện có nếu tên khác và ghi rõ trong README.
- Chỉ truy cập DB ở server. Không dùng prefix `NEXT_PUBLIC_` cho secrets.
- Cấu hình MongoDB Atlas network access phù hợp với Vercel; không mặc định mở toàn Internet nếu có lựa chọn an toàn hơn. Nếu phải mở rộng IP cho demo, dùng tài khoản DB quyền tối thiểu, mật khẩu mạnh, và nêu rủi ro.
- Thêm rate limit thực tế: nếu dùng Vercel nhiều instance, không dùng `Map` in-memory như biện pháp bảo vệ duy nhất; ưu tiên dịch vụ shared store nếu cần, hoặc dùng cơ chế sẵn có trong repo.
- Không chạy script import khi build/deploy. Seed offline bằng lệnh riêng.
- Tạo `.env.example` không chứa giá trị thật; bổ sung README setup local/deploy.
- Hạn mức miễn phí và chính sách sử dụng của Vercel/MongoDB cần kiểm tra trước khi triển khai thật.

## 13. Thứ tự thực hiện cho Codex

### Phase 0 — Khảo sát
- [ ] Kiểm tra repo, kiến trúc, DB/auth/UI hiện có, luồng quét QR, URL, session, character mapping, chat widget, trạng thái quiz.
- [ ] Ghi rõ nguồn dữ liệu đáng tin cậy để resolve nhân vật. Nếu QR chỉ là query param không có session server, đề xuất phương án ký token/verify QR hoặc binding server-side phù hợp; không giả vờ có xác thực đã tồn tại.
- [ ] Xác nhận đường dẫn DOCX.
- [ ] Lập checklist và xác định phần cần người dùng phê duyệt.

### Phase 1 — Knowledge pipeline
- [ ] Viết script extract DOCX, bao gồm bảng.
- [ ] Sinh extraction manifest + draft Q&A; không tự approve.
- [ ] Viết validator, báo cáo review và import dry-run.

### Phase 2 — Chat backend
- [ ] Types + schema + repository + indexes.
- [ ] Character config + normalizer + exact/fuzzy matcher.
- [ ] API `/api/chat` và `/api/chat/answer`.
- [ ] Validation, lỗi an toàn, rate limit nếu phù hợp.

### Phase 3 — Tích hợp Chat UI vào boardgame
- [ ] Giữ nguyên trang chơi và chat panel hiện tại, không thêm character selector.
- [ ] Suggestion selection, source display, refusal.
- [ ] Responsive và trạng thái lỗi/loading.

### Phase 4 — QA & deploy
- [ ] Unit/integration tests + kiểm tra prompt injection.
- [ ] `lint`, `typecheck`, `test`, `build`.
- [ ] `.env.example`, README, hướng dẫn import/deploy.
- [ ] Báo cáo kết quả và danh sách câu hỏi đang chờ duyệt.

## 14. Lệnh khởi động dành cho người dùng Codex

Sau khi đặt file này tại root repo và file DOCX ở `docs/source/Tong-hop-kien-thuc.docx`, gửi Codex:

> Hãy đọc kỹ `CODEX_IMPLEMENTATION_GUIDE.md` và khảo sát toàn bộ dự án Next.js hiện tại. Triển khai theo từng phase trong tài liệu, giữ nguyên UI boardgame, QR scan và quiz hiện có; nhân vật chat lấy từ phiên/QR phía server, không cho chọn thủ công; chế độ B cho phép trả lời cả nội dung liên quan đáp án quiz nếu nằm trong tài liệu. Trước tiên lập kế hoạch và checklist; bắt đầu Phase 0 và Phase 1. Tuyệt đối không tự phê duyệt dữ liệu Q&A và không dùng LLM tạo câu trả lời ở runtime. Sau mỗi phase, chạy test và báo cáo thay đổi, vấn đề còn tồn tại, cùng những bước cần tôi duyệt.

Sau khi chủ dự án duyệt ngân hàng Q&A, gửi tiếp:

> Tôi đã duyệt bộ Q&A. Hãy kiểm tra tính hợp lệ, import vào MongoDB bằng dry-run trước, báo cáo kết quả rồi chỉ chạy `--apply` khi tôi xác nhận. Sau đó hoàn thành Phase 2–4, chạy lint/typecheck/test/build và cung cấp hướng dẫn deploy Vercel.

---

**Định nghĩa hoàn thành:** Chatbot gắn đúng 4 nhân vật theo QR/phiên chơi, không có bộ chọn nhân vật độc lập, không chặn tiết lộ đáp án quiz, chỉ trả lời bằng bản đã duyệt, fuzzy chỉ gợi ý, câu hỏi ngoài tài liệu bị từ chối, không có runtime LLM, kiểm thử pass, chạy local và sẵn sàng deploy Vercel. Không coi hoàn thành nếu ngân hàng Q&A chưa được người dùng duyệt.


## 15. Bổ sung bắt buộc: quy trình kiểm duyệt, phiên bản và quản trị

### 15.1. Phân biệt trạng thái bản nháp và bản đang phục vụ người chơi

- Dùng thống nhất `draft`, `pending_review`, `approved`, `rejected` trong schema, API, UI, script và test. Nếu repository đã có `in_review`, cung cấp migration/adapter rõ ràng thay vì thay đổi dữ liệu production tùy tiện.
- `draft`: mới trích xuất/sinh/import hoặc đang chỉnh sửa; `pending_review`: gửi người quản trị kiểm tra; `approved`: đã được người có quyền duyệt; `rejected`: không đạt và có lý do.
- **Phê duyệt khác công bố:** để bảo vệ phiên bản đang chạy, chỉ bản `approved` **và được publish** mới được dùng tại runtime. Không coi riêng `status=approved` là đủ nếu áp dụng versioning.
- Khi sửa dữ liệu đã publish, tạo revision mới `draft`, giữ nguyên bản published cũ. Chỉ đổi con trỏ `publishedVersionId` sau khi revision mới được duyệt và thao tác publish thành công. Không bao giờ sửa tại chỗ bản published.
- Nếu muốn tạm dừng một câu hỏi, dùng thao tác unpublish/revoke có audit log; không dùng xóa dữ liệu để ẩn.

### 15.2. Schema và truy xuất phiên bản

Giữ `knowledge_questions` làm thực thể logic với `_id`, `topicId`, `publishedVersionId?`, `createdAt`, `updatedAt`. Tạo `knowledge_question_revisions` lưu `_id`, `questionId`, `version`, `canonicalQuestion`, `aliases`, `approvedAnswer`, `characterAnswers` đủ bốn nhân vật, `source`, `status`, `reviewedBy?`, `reviewedAt?`, `rejectionReason?`, `createdAt`, `updatedAt`, `importBatchId?`. Có thể điều chỉnh theo conventions của repo nhưng phải giữ nguyên các bất biến trên.

Runtime chỉ lấy revision có `_id == knowledge_questions.publishedVersionId` **và** `status=approved`. Fuzzy suggestions cũng chỉ dựa trên các revision đang publish. Tạo unique index `{ questionId: 1, version: 1 }`, index `{ status: 1, questionId: 1 }`. Không cho phép import/upsert thay đổi nội dung revision đã approved/published.

### 15.3. Workflow import và kiểm duyệt

1. Trích DOCX thành manifest có nguồn; tạo Q&A JSON draft với 4 phiên bản nhập vai. Không tự coi nội dung do AI offline sinh là đúng.
2. Chạy validate schema, đối chiếu source excerpt, phát hiện alias trùng/khác nghĩa, câu trả lời thiếu và các mâu thuẫn lịch sử; báo cáo lỗi trước khi ghi DB.
3. Chạy `knowledge:import --dry-run`, sau đó `--apply` khi người vận hành đồng ý. Import tạo revision `draft`, gắn `importBatchId`, không tự publish.
4. Quản trị viên đọc `canonicalQuestion`, toàn bộ aliases, `approvedAnswer`, 4 `characterAnswers`, source và nhận xét. Có thể sửa bản draft, gửi `pending_review`, duyệt hoặc từ chối kèm lý do.
5. Chỉ admin đã xác thực, được phân quyền server-side mới được approve/reject/publish. Ghi audit log (actor, action, revision, timestamp, thay đổi). Không cho client tự ghi status, reviewer hoặc publishedVersionId.
6. Publish revision approved bằng thao tác riêng, atomic/transaction khi hạ tầng MongoDB cho phép; nếu không, dùng cập nhật có điều kiện để tránh ghi đè đồng thời. Kiểm tra lại điều kiện approved ngay tại thao tác publish.
7. Trả lời người chơi phải dùng đúng `characterAnswers[resolvedCharacterId]` từ published revision; không fallback sang neutral answer, draft, hay đáp án nhân vật khác.

### 15.4. Giao diện admin: ưu tiên sau khi core chat hoạt động

Nếu repo đã có auth/admin, tái sử dụng để xây dựng `/admin/knowledge`: danh sách, lọc trạng thái, xem nguồn, so sánh revision, chỉnh draft, gửi duyệt, duyệt/từ chối, publish/unpublish và xem audit. Nếu chưa có admin auth, **không tạo endpoint duyệt công khai**: trước mắt cung cấp CLI duyệt có kiểm soát và ghi audit, rồi xin quyết định về auth trước khi triển khai UI admin.

### 15.5. Quy tắc nhập vai

Mỗi record có một `approvedAnswer` trung tính và **bốn câu trả lời hoàn chỉnh**. Không tự thay đại từ vào câu trả lời ở runtime. Xưng hô kiểu “bác–cháu” là lựa chọn mô phỏng giáo dục; người duyệt phải kiểm tra ngữ cảnh, tránh tạo ký ức cá nhân hoặc lời nói không có nguồn. Câu chào, từ chối cũng là template cố định theo nhân vật. Không thay đổi nhân vật do QR/session xác định chỉ vì câu hỏi của người chơi nhắc đến nhân vật khác.

### 15.6. Test bổ sung bắt buộc

- Import JSON mới → draft, không được trả lời; pending_review/rejected cũng không được trả lời.
- Approved nhưng chưa publish → không được trả lời. Approved + published → trả đúng câu của nhân vật.
- Sửa bản đã publish → tạo revision draft; người chơi vẫn thấy câu cũ đến khi duyệt và publish bản mới.
- Alias trùng giữa hai câu hỏi → gợi ý/không tự trả lời.
- User không có quyền không thể approve, reject, publish; request tự sửa `status`/`publishedVersionId` bị từ chối.
- Trường hợp một nhân vật thiếu answer, source thiếu hoặc reviewer thiếu → không cho duyệt/publish.
- Rollback publish về revision approved trước đó phải được ghi audit và không làm mất revision mới.

**Ưu tiên triển khai:** Đầu tiên core chatbot và import draft; tiếp theo review/publish an toàn; cuối cùng mới bổ sung giao diện admin nếu phù hợp với hệ thống xác thực hiện có.
