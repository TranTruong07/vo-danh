# Phase 2.5 — Hoàn thiện dữ liệu lịch sử và kiểm tra coverage

Ngày hoàn thành: **14/10/2026**. Phạm vi chỉ gồm biên tập bản nháp, công cụ offline, kiểm thử và báo cáo. **Không kết nối/import MongoDB, không approve/publish, không sửa API chatbot hoặc logic quiz, QR, TTS, PWA và thanh toán.** Dừng sau Phase 2.5 để chủ dự án kiểm tra.

## 1. Kết quả

| Hạng mục | Kết quả |
| --- | --- |
| Logical questions | **59**, từ 40 câu cũ + 19 câu mới |
| Revision mới | **37**: 19 câu mới version 1; 9 sửa nội dung version 4; 9 chỉ thêm aliases version 4 |
| Revision giữ nguyên | 22 bản version 3 giữ nguyên mọi trường; file chứa toàn bộ 40 revision 3 cũ vẫn nguyên vẹn |
| N01–N19 | Đã soạn 19 draft có canonical, 2 aliases, neutral, 4 persona, excerpt và locator |
| R01–R09 | Đã tạo 9 revision 4 cùng logical ID, giữ mọi mệnh đề neutral cũ và đưa đầy đủ vào từng persona |
| Câu bị chặn hoàn toàn do thiếu nguồn | **0 trong phạm vi đã giới hạn**; N17/N18 vẫn cần duyệt đặc biệt, không đủ nguồn để mở rộng ra ngày/chức trách cụ thể |
| Phê duyệt | 0 approved, 0 published; không tạo reviewer/reviewedAt |
| Validation | 59 hợp lệ, **0 lỗi / 23 cảnh báo**; 18 cảnh báo cũ vẫn mở |

Tên `draft-questions-phase-2-v4.json` là phiên bản **snapshot bộ dữ liệu**, không phải yêu cầu mọi record có `version=4`. Không đổi version của các bản không chỉnh sửa; không đặt lại version cho logical ID đã tồn tại. File v4 có 59 dòng duy nhất, không chứa nhiều revision cùng logical ID. Bản v3 riêng giữ lịch sử trước khi biên tập.

## 2. Nguồn đã đọc và giới hạn sử dụng

Đã đọc `CODEX_IMPLEMENTATION_GUIDE.md`, các quy tắc `.agents/rules/`, `docs/chatbot-phase-0.md`, `docs/chatbot-phase-2.md`, `docs/knowledge-pipeline.md`, audit cũ, JSON v3 và báo cáo review Phase 2. Phase 1 được ghi trong `knowledge-pipeline.md`, không tạo tài liệu thay thế. Đọc lại DOCX qua extractor của repository và kiểm tra manifest khớp: **189 blocks, 1 bảng/15 ô, đủ mục I–X**. JSON audit cũ chứa bản nguồn/đáp án trùng lặp được đối chiếu với manifest và dataset.

Nguồn lịch sử duy nhất là `docs/source/Tong-hop-kien-thuc.docx`, SHA-256 `e6e605448defbca119fcd114682fd61604a0cf2ba48d6dfd614fd91c8223ec7b`. Không thêm dữ kiện từ trí nhớ, web hoặc LLM. Các diễn đạt về thiếu thông tin là giới hạn của đoạn nguồn, không phải phát ngôn lịch sử của nhân vật.

Lời đáp mô phỏng dùng bốn nhịp diễn đạt: Trường Chinh phân tích theo ý; Lê Duẩn trực tiếp và khích lệ; Phạm Văn Đồng nhẹ nhàng giải thích; Võ Nguyên Giáp trình bày các điểm cần nhớ. Với 28 câu mới/sửa nội dung, từng mệnh đề neutral được giữ nguyên trong cả bốn lời đáp; chỉ thay lời dẫn, xưng hô, chuyển ý và trình bày. Đây là lựa chọn thiết kế, **không xác nhận cách nói có thật hoặc hồi ức của bốn nhân vật**. Lời đáp dài ở các câu tổng hợp vẫn cần reviewer đánh giá tính dễ đọc.

## 3. Quyết định N17 và N18

**N17 → cmtt45-q057:** đối chiếu mô tả hoạt động tại `body/87`, lưu ý `body/90`, bảng `body/109/row/2/cell/1/1`, đính chính `body/111` và IX.4 `body/167`. Có căn cứ để tạo câu trả lời về quá trình xây dựng cơ sở Đảng, tổ chức lực lượng, vận động quần chúng khi Pháp đàn áp, **kèm giới hạn thời kỳ**. Mọi lời đáp giữ mốc bị bắt năm 1940, Côn Đảo, trở về đất liền sau thắng lợi và kháng chiến Nam Bộ sau đó. Đáp án nói rõ nguồn không định ngày/chức trách riêng cho từng hoạt động; không gán hoạt động trực tiếp vào tháng 8/1945.

**N18 → cmtt45-q058:** đọc `body/86,88,89,90`, bảng V.5, `body/111` và IX.4. Câu mới nói về điều kiện/lực lượng/diễn biến riêng của Nam Bộ và sức mạnh của các tổ chức Đảng, phong trào tại chỗ, quần chúng; giữ ngày Sài Gòn 25/8/1945 và đính chính về Lê Duẩn. Không biến mô tả phong trào tập thể thành chiến công của riêng ông.

Hai quyết định là **đề xuất draft có giới hạn**, không phải người quản trị đã hòa giải hoặc phê duyệt nguồn. `sourceReconciliation.resolved=false` ở change manifest/audit. Không có đủ căn cứ cho ngày Lê Duẩn về đất liền chính xác, chức trách cụ thể trong từng hoạt động, tên các tỉnh khởi nghĩa sớm hoặc năm Phạm Văn Đồng bắt đầu hoạt động. Không tạo câu trả lời suy đoán cho những yêu cầu đó.

## 4. Revision và aliases

| Đề xuất | Logical ID giữ nguyên | Nội dung sửa |
| --- | --- | --- |
| R01 | cmtt45-q013 | Thời cơ cho các dân tộc giải phóng, thêm nguồn body/18; nguồn xếp theo thứ tự nên section chính chuyển IV.1 → II.1 |
| R02 | cmtt45-q009 | Khôi phục tên Mặt trận Việt Nam Độc lập Đồng minh trong bốn persona |
| R03 | cmtt45-q011 | Khung tháng 3–8/1945 và sau đảo chính 9/3, thêm body/42–43 |
| R04 | cmtt45-q022 | Hội nghị Ban Thường vụ Trung ương Đảng mở rộng, cương vị và các chi tiết neutral |
| R05 | cmtt45-q024 | Công việc trọng yếu của Ban Thường trực thời chuyển tiếp, địa điểm Tân Trào |
| R06 | cmtt45-q025 | Thống nhất lực lượng, bảo vệ/mở rộng địa bàn, giữ chủ thể đọc Quân lệnh |
| R07 | cmtt45-q028 | Cơ sở chính trị–pháp lý của quốc gia độc lập |
| R08 | cmtt45-q029 | Thể chế, chính quyền, giáo dục, kinh tế–xã hội, quy mô quần chúng |
| R09 | cmtt45-q031 | Đường lối phù hợp, chủ trương/quyết định khởi nghĩa kịp thời và toàn bộ nguyên nhân chủ quan |

Chín revision chỉ bổ sung aliases: **q001, q002, q003, q017, q018, q020, q023, q026, q033**. Không sửa đáp án hoặc nguồn của nhóm này. Các aliases mới xử lý cách hỏi đã bộc lộ trong audit cũ; một số aliases cũng được thêm vào R02/R03/R05/R06. Giữ giới hạn 2–5 aliases, không sửa normalizer hay Fuse threshold 0.25. Có **59 canonical + 134 aliases = 193 chuỗi chuẩn hóa duy nhất**, không có alias collision; một ý hỏi thuộc nhiều facet vẫn chỉ là một logical question.

N01–N19 được cấp ID q041–q059 theo đúng thứ tự; R01–R09 không tăng số logical questions. `knowledge/phase-2-5-changes.json` ghi từng ID/proposal/version/loại sửa và các mệnh đề cần giữ. Script từ chối ghi đè file đích có sẵn và từ chối nguồn khác hash hoặc đầu vào không phải 40 draft v3.

## 5. Coverage trước và sau

Giữ nguyên **92 đơn vị / 136 facets** của audit cũ. Không đếm aliases hoặc bốn persona thành đơn vị lịch sử mới. So sánh nguồn, các mệnh đề cũ được giữ nguyên và 43 chú giải facet mới/sửa trong từng lớp đáp án; không đánh covered chỉ vì câu hỏi hoặc source excerpt chứa từ khóa.

| Lớp | Trước: C/P/U | Trước: đầy đủ | Sau: C/P/U | Sau: đầy đủ |
| --- | --- | --- | --- | --- |
| Neutral | 69 / 7 / 16 | 75,00% | 92 / 0 / 0 | 100,00% |
| Trường Chinh | 61 / 13 / 18 | 66,30% | 92 / 0 / 0 | 100,00% |
| Lê Duẩn | 61 / 13 / 18 | 66,30% | 92 / 0 / 0 | 100,00% |
| Phạm Văn Đồng | 61 / 13 / 18 | 66,30% | 92 / 0 / 0 | 100,00% |
| Võ Nguyên Giáp | 61 / 13 / 18 | 66,30% | 92 / 0 / 0 | 100,00% |
| Neutral và cả bốn persona | 61 / 15 / 16 | 66,30% | 92 / 0 / 0 | 100,00% |

Đầy đủ = C/N×100; quy đổi = (C+0,5P)/N×100; có ít nhất một phần = (C+P)/N×100. Quy đổi chung: 74,46% → 100%. Báo cáo [coverage v4](knowledge-coverage-audit-v4.md) có số liệu riêng I–X và ma trận đủ 92 đơn vị; JSON chứa từng facet, nguồn, ID/version/đường dẫn đáp án của từng persona. Audit cũ được giữ nguyên để so sánh.

**100% ở đây chỉ là nội dung tồn tại trong bản nháp theo rubric 92 đơn vị hiện tại.** Không chứng nhận lịch sử, không đóng cảnh báo, không có nghĩa mọi câu hỏi người chơi đều matching được, không khẳng định dữ liệu đang published. N17/N18 vẫn giữ điều kiện rà soát. Việc hợp chứng cứ nhiều câu để đo coverage không cho phép runtime tự ghép nhiều câu trả lời.

## 6. Matching độc lập và khoảng trống còn lại

Fixture `tests/fixtures/knowledge-phase-2-5-holdout.mjs` gồm **36 câu thử**, lưu trước khi biên tập aliases: 6 hỏi ngắn, 6 đảo trật tự, 6 không dấu, 6 phủ định, 6 nhiều ý, 6 ngoài phạm vi. Không có câu nào trùng canonical/alias sau chuẩn hóa; không đưa holdout vào aliases sau khi xem kết quả. Tuy độc lập với chuỗi đã khai báo, bộ này cùng người biên tập soạn, chưa phải benchmark do người dùng thực cung cấp.

| Kiểm tra | v3 | v4 |
| --- | --- | --- |
| Exact / suggest / none trên 36 câu | 0 / 4 / 32 | 0 / 9 / 27 |
| Tìm đúng ứng viên top-3 trên 27 ý hỏi có đáp án | 2/27 = 7,41% | **7/27 = 25,93%** |
| Nhóm 13 ý hỏi có ID ứng viên đã tồn tại ở v3 | 2/13 | 4/13 |
| Nhóm 14 ý hỏi cần ID câu mới | 0/14 | 3/14 |
| Tự trả lời chắc chắn không an toàn | 0 | 0 |

Mẫu số 27 loại 6 ngoài phạm vi và 3 câu đa ý chưa có đáp án kết hợp/toàn bộ. So sánh 2/27 → 7/27 gồm cả tác dụng bổ sung dữ liệu lẫn aliases; không gọi là cải thiện thuần túy thuật toán matching. Riêng 20 probe đã biết từ audit cũ dùng làm development đạt 17 exact / 3 suggest; **không dùng kết quả đó làm recall độc lập**. 193/193 chuỗi khai báo exact đúng ID chỉ là kiểm tra nhất quán.

H28 vẫn chỉ gợi ý q010 cho một phần câu hỏi đa ý; hệ thống không có bộ phân tích nghĩa để khẳng định đã trả lời hết các ý. Các câu phủ định/không dấu/hỏi ngắn còn nhiều trường hợp không có gợi ý. Đây là khoảng trống cần cải thiện sau khi reviewer duyệt aliases và có bộ query độc lập mới. Không giảm fuzzy threshold, không tự động trả lời từ fuzzy, không nối đáp án, không đổi API trong tác vụ này. `productionCoveragePercent` để null.

## 7. Cảnh báo lịch sử

Giữ **18/18 cảnh báo cũ** ở trạng thái `needs_admin_review`, không có cảnh báo nào được công cụ tự đánh resolved:

- DATES_REVIEW (8): q002, q003, q017–q020, q028, q037. Đối chiếu body/17 và body/62–66; tuyên bố đầu hàng Nhật 15/8 khác ký văn kiện 2/9; Hà Nội/Huế/Sài Gòn/Tuyên ngôn là các sự kiện riêng.
- QUAN_LENH (4): q014, q022, q025, q026. Ban bố đêm 13/8 tại body/57 khác đọc ngày 16/8 tại Tân Trào ở body/105; giữ đúng cơ quan/chủ thể/hành động.
- LE_DUAN (3): q023, q038, q039. Đọc V.2, bảng V.5 cùng body/111, IX.4 và X; không suy diễn trực tiếp lãnh đạo khởi nghĩa Nam Bộ tháng 8.
- CAUSES (3): q031, q032, q033. Chủ quan ở body/135–139, khách quan body/141–144, quan hệ body/146–148; thời cơ không tự tạo thắng lợi.

V4 có **5 cảnh báo bổ sung**: q013 CAUSES; q054 và q057 LE_DUAN; q058 LE_DUAN và DATES_REVIEW. Tổng validator là **23**. Các cảnh báo này là bộ dò dấu hiệu trong code, không bao quát mọi vấn đề lịch sử: reviewer vẫn cần đọc các mốc mới 9/1939, 6/1941, 9/1940, 4/1945, 14–18/8, 28/8 và năm sinh/mất theo locator, cùng phạm vi nạn đói “chết hoặc rơi vào cảnh đói khổ”.

## 8. File tạo mới

Năm deliverable bắt buộc:

- `knowledge/draft-questions-phase-2-v4.json` — snapshot 59 draft.
- `knowledge/review-report-phase-2-v4.md` — đủ canonical/aliases, neutral, bốn persona, nguồn, 18 cảnh báo cũ và cảnh báo mới.
- `knowledge/coverage-audit-v4.json` — machine-readable, riêng từng persona, before/after và kết quả matching.
- `docs/knowledge-coverage-audit-v4.md` — báo cáo coverage lần hai.
- `docs/chatbot-phase-2.5.md` — báo cáo này.

Công cụ và kiểm thử:

- `scripts/knowledge/phase-2-5.ts` — 19 đề xuất, 9 repair, aliases và bộ dựng snapshot/revision.
- `scripts/knowledge/phase-2-5-evidence.ts` — chú giải facet/anchors nguồn riêng cho audit.
- `scripts/knowledge/phase-2-5-audit.mjs` — tính coverage từng lớp, đánh giá matcher, xuất Markdown.
- `scripts/expand-knowledge-phase-2-5.ts` — generator offline từ chối ghi đè, sinh review/change manifest.
- `scripts/audit-knowledge-phase-2-5.mjs` — audit và holdout, hỗ trợ đường dẫn output khác để so sánh.
- `tests/fixtures/knowledge-phase-2-5-holdout.mjs` — fixture thử độc lập.
- `tests/knowledge-phase-2-5.test.mjs` — 16 tests.
- `knowledge/phase-2-5-changes.json` — manifest biên tập, không import artifact này.

Không chỉnh file code runtime, package, env, nguồn DOCX, draft v3 hoặc audit cũ. `public/pwa-assets.json` được lệnh build có sẵn tái sinh để khớp build ID và 80 assets; đây là artifact build được ignore, không sửa logic PWA hoặc đưa knowledge vào cache. Kiểm tra SHA-256 208 input/file được bảo vệ: **207 không đổi**, ngoại lệ duy nhất là manifest build vừa nêu. Không reset/revert các thay đổi hiện có của dự án.

JSON và review Markdown knowledge vẫn được `.gitignore` hiện hữu bảo vệ; không đưa vào `public/`, bundle client hoặc PWA. Cần giữ bản sao private khi chuyển máy/deploy; báo cáo phân tích không có schema để import knowledge. Không cài package hay tạo biến môi trường mới.

## 9. Kết quả kiểm thử và chạy lại

| Kiểm tra đã chạy | Kết quả |
| --- | --- |
| DOCX extraction `--check` | Khớp manifest: 189 blocks, 1 bảng |
| Validator CLI trên v4 | 59 records, 0 lỗi, 23 cảnh báo |
| Test riêng Phase 2.5 | **16/16 đạt** |
| Toàn bộ Node unit tests | **117 pass, 5 fail, 1 skip / 123** |
| Chat/backend và knowledge tests hiện có | Đạt trong lần chạy toàn bộ |
| Mongo integration | Skip: không có môi trường `MONGODB_TEST_URI` riêng; không dùng production thay thế |
| TypeScript `tsc --noEmit` | Đạt |
| ESLint 7 file code/test mới | Đạt |
| Full lint | 5 lỗi / 2 cảnh báo có trước Phase 2.5 |
| Production build | Đạt, 31 trang generate; 80 public assets |

Năm unit test auth lỗi cũ do loader tìm `server/services/character.ts` không tồn tại khi đi qua dependency hiện hữu. Full lint có `no-assign-module-variable` tại `tests/character-images.test.mjs`, `character-questions.test.mjs`, `history-game.test.mjs`, `orders.test.mjs`, `support/load-typescript.mjs`; cảnh báo `<img>` ở `app/author/page.tsx` và biến không dùng trong helper audit cũ `.local/knowledge-coverage-audit.mjs`. Không sửa các phần ngoài phạm vi, không tuyên bố toàn repo xanh.

Tests mới kiểm tra version/ID/bất biến v3, source locator/excerpt, đủ mệnh đề cả bốn persona, đính chính và mốc thời gian, 18 cảnh báo vẫn mở, fixed 92/136, công thức/per-persona, mutation làm mất một lời đáp hoặc chi tiết phải hạ coverage, holdout không trùng, ambiguous exact và fuzzy không tự trả lời. Fixture thử dùng dữ liệu trong bộ nhớ, không gọi API/session/quota và không publish để test.

Lệnh kiểm tra lại (chỉ local):

```powershell
rtk proxy npm run knowledge:extract -- --check
rtk proxy npm run knowledge:validate -- --file knowledge/draft-questions-phase-2-v4.json --report .local/phase-2-5-validation.md
rtk proxy node --test tests/knowledge-phase-2-5.test.mjs
rtk proxy npx tsc --noEmit
rtk proxy npm run build
```

Không dùng CLI validation để ghi đè `knowledge/review-report-phase-2-v4.md`: CLI chỉ xuất báo cáo validation chung, sẽ làm mất phần đối chiếu biên tập bổ sung. Dùng `.local/` như lệnh trên.

Generator đã chạy: `rtk proxy npx tsx scripts/expand-knowledge-phase-2-5.ts`. Chạy lần nữa khi output tồn tại sẽ dừng để bảo vệ bản nháp. Audit có thể chạy lại ra **đường dẫn chưa tồn tại** rồi so sánh, không sửa audit cũ:

```powershell
rtk proxy npx tsx scripts/audit-knowledge-phase-2-5.mjs --json .local/coverage-v4-recheck.json --report .local/coverage-v4-recheck.md
```

## 10. Các bước cần làm ở Phase 3 sau xác nhận

1. Quản trị viên đọc bộ v4 và review report; rà soát N17/N18, 23 cảnh báo, ý nghĩa aliases và toàn bộ năm lời đáp. Nếu cần biên tập tiếp, cấp revision mới theo trạng thái thực tế, giữ bản cũ; không tự đổi JSON thành approved.
2. Kiểm tra trạng thái MongoDB bằng quy trình Phase 3 khi được giao. Không suy đoán DB hiện vẫn rỗng chỉ từ báo cáo cũ. Đối chiếu revision đã có để tránh ID/version xung đột.
3. Dùng importer chung với **đường dẫn v4 tường minh** cho dry-run. `knowledge:import:phase3` hiện trỏ v3 và ép `--required-version 3`; **không dùng shortcut này cho snapshot có version 1/3/4**. Chỉ sau khi nhận tác vụ Phase 3 mới chạy bước đọc DB dưới đây:

```powershell
rtk proxy npm run knowledge:import -- --dry-run --file knowledge/draft-questions-phase-2-v4.json --report knowledge/import-report-phase-2-v4.json
```

4. Báo cáo dry-run và xin xác nhận trước bất kỳ `--apply` nào. Giải quyết conflict bằng revision mới, không overwrite. Không chạy import lúc build/deploy. **Phase 2.5 chưa chạy dry-run DB hoặc apply.**
5. Hạ tầng admin review/publishing đã có từ Phase 3 trước đó. Đăng nhập bằng tài khoản admin cấu hình hiện có, mở `/admin/knowledge`. Preview khi DB rỗng trong `server/repositories/knowledge-source.ts` vẫn trỏ file v3; chưa đổi runtime trong Phase 2.5. Khi được giao Phase 3, cần quyết định cập nhật preview/đóng gói file v4 hoặc dùng dữ liệu DB sau import có xác nhận; đừng nhầm preview 40 câu với bộ v4 đã công bố.
6. Qua workflow thật: submit để pending_review, approve hoặc reject bằng tài khoản admin thực, rồi publish riêng từng revision được duyệt; giữ audit log. Không approve/publish tự động cả batch. Kiểm tra `/api/chat` chỉ đọc revision approved được `publishedVersionId` trỏ tới; draft/pending/rejected hoặc unpublish vẫn không được trả lời.
7. Chạy integration Mongo trên môi trường thử nghiệm riêng và thử phiên chơi thật với câu exact, fuzzy, phủ định, ngoài nguồn. Với matching hiện còn thấp, cần bộ query do reviewer/người chơi cung cấp và vòng biên tập aliases mới, không tái dùng holdout hiện tại làm bằng chứng độc lập nếu đã dùng nó để chỉnh dữ liệu.

Không triển khai thêm UI/chat API hay Phase 4 trong đợt này. Chờ chủ dự án xác nhận sau khi đọc kết quả Phase 2.5.
