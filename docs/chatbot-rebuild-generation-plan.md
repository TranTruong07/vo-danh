# Kế hoạch generation kiến thức mới — Phase 1

Cập nhật 2026-11-03 (Asia/Bangkok). **AWAITING_BATCH_APPROVAL**. Đây là kế hoạch biên tập, không phải bộ câu hỏi/đáp án đã được duyệt. Đợt tiếp tục: **0 Gemini calls, 0 MongoDB writes**.

## Nguồn và cách chia đơn vị

Nguồn duy nhất: `docs/source/Tong-hop-kien-thuc-moi.docx` (đường dẫn tính từ repository; dùng dấu / khi chạy lệnh). SHA-256: fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e. Đã đọc toàn bộ 395 blocks (394 không rỗng), 0 bảng, gồm I–V, VII–VIII và kết luận. Kiểm tra lại extractor với DOCX gốc thành công; không dùng tài liệu cũ để bổ sung lịch sử.

Một đơn vị là một **ý hỏi có mục đích rõ ràng**, có thể gộp thời gian/địa điểm/diễn biến/kết quả của cùng sự kiện. Chia riêng vai trò khác nhau, ngày khác nhau, nguyên nhân và ý nghĩa. Không đếm mỗi bullet, alias hoặc mỗi persona thành một đơn vị. Các mục lặp được dùng làm đối chiếu, không sinh lại: đảo chính I/II; Nhật đầu hàng I/IV; quân đội và khu giải phóng II/III; chức vụ chính phủ IV/V; kết luận lặp các mục trên. IV-HANOI-MORNING nói buổi sáng; IV-HANOI-TAKEOVER cần tập trung tiếp quản buổi chiều/kết quả, tránh tạo cùng một câu tổng quát.

Kết quả: **68 ý hỏi dự kiến**, gồm **2 Draft hiện có**, **62 ý đề xuất**, **4 ý giữ lại để rà soát**. 273 checklist facets trong JSON là nhãn biên tập, có chồng lấp, **không phải 273 dữ kiện độc lập**. Số 68 có thể giảm/gộp sau review hoặc generation; không phải quota bắt buộc phải đạt.

## Bao phủ hiện tại

Công thức: số ý hỏi có Draft đáp ứng phạm vi đã mô tả / tổng ý hỏi trong kế hoạch × 100. Hiện **2/68 = 2,94% Draft-intent coverage**. q061 bao phủ sự kiện trở về nước; q062 bao phủ thời gian/địa điểm/người đọc Tuyên ngôn. Không tính việc một đoạn context chứa nhiều dữ kiện là các dữ kiện đó đã được trả lời. Không dùng độ phủ từ khóa, số paragraph hoặc aliases để thay thế coverage nội dung. Chưa thực hiện một audit entailment độc lập cho mọi dữ kiện; 2,94% không phải xác suất lịch sử đúng.

**Approved/published coverage = 0/68 = 0%.** Các ý còn lại chưa có Draft phù hợp, kể cả các mục đã có span nguồn trong kế hoạch. Nếu B01 thành công cả ba thì dự kiến 5/68 = 7,35%; đây chưa phải kết quả đạt được. Không so trực tiếp với audit 92 đơn vị của tài liệu cũ vì nguồn và đơn vị đo khác nhau.

| Mục | Ý hỏi | Có Draft | Đề xuất thêm | Giữ rà soát | Draft coverage |
|---|---:|---:|---:|---:|---:|
| I | 8 | 0 | 8 | 0 | 0.00% |
| II | 11 | 1 | 10 | 0 | 9.09% |
| III | 8 | 0 | 7 | 1 | 0.00% |
| IV | 30 | 1 | 27 | 2 | 3.33% |
| V | 4 | 0 | 3 | 1 | 0.00% |
| VII | 5 | 0 | 5 | 0 | 0.00% |
| VIII | 2 | 0 | 2 | 0 | 0.00% |

## Danh mục ý hỏi và nguồn

Các câu dưới đây là hướng biên tập, không phải canonical/aliases do Gemini đã tạo. Source locator zero-based. JSON private `knowledge/new-generation-plan.json` lưu nguyên văn context, facets, supportingRanges, các trạng thái và batch. Chưa tạo thêm answers hoặc revisions.

| Mã ý | Phạm vi dự kiến | Span chính | Trạng thái | Cảnh báo riêng |
|---|---|---|---|---|
| I-GERMANY | Đức đầu hàng Đồng minh vào ngày nào và sự kiện đó đánh dấu điều gì? | body/4–4 | Đề xuất | R10 |
| I-USSR | Liên Xô có những hành động nào đối với Nhật Bản trong ngày 8 và 9/8/1945? | body/5–6 | Đề xuất | R10 |
| I-ATOMIC | Hai thành phố Nhật Bản bị Mỹ ném bom nguyên tử vào những ngày nào? | body/7–8 | Đề xuất | R10 |
| I-SURRENDER | Ngày 14 và 15/8/1945 đánh dấu hai bước nào trong việc Nhật Bản đầu hàng? | body/9–12 | Đề xuất | R10, R05 |
| I-COUP | Cuộc đảo chính ngày 9/3/1945 làm thay đổi quyền cai trị ở Đông Dương như thế nào? | body/14–14 | Đề xuất | R10 |
| I-GOVERNMENT | Chính phủ Trần Trọng Kim có vị thế như thế nào dưới sự bảo trợ của Nhật? | body/15–15 | Đề xuất | R10 |
| I-FAMINE | Nạn đói 1944–1945 ảnh hưởng thế nào đến mâu thuẫn xã hội Việt Nam? | body/17–17 | Đề xuất | R10 |
| I-WINDOW | Vì sao cần giành chính quyền trước khi quân Đồng minh tiến vào Đông Dương? | body/18–20 | Đề xuất | R10 |
| II-RETURN | Ngày 28/1/1941 diễn ra sự kiện gì liên quan đến Nguyễn Ái Quốc? | body/24–24 | cmtt45-q061 | R10, R09 |
| II-CONFERENCE8 | Hội nghị Trung ương lần thứ 8 diễn ra khi nào, ở đâu và do ai chủ trì? | body/25–25 | Đề xuất | R10 |
| II-PRIORITIES | Hội nghị Trung ương lần thứ 8 đặt ra những nhiệm vụ gì để tập trung giải phóng dân tộc? | body/25–33 | Đề xuất | R10 |
| II-ARMY | Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập trong hoàn cảnh tổ chức nào? | body/35–37 | Đề xuất | R10 |
| II-FIRST-BATTLES | Những chiến công đầu tiên của Đội Việt Nam Tuyên truyền Giải phóng quân diễn ra ở đâu, khi nào? | body/35–38 | Đề xuất | R10 |
| II-ARMY-MEANING | Việc thành lập lực lượng vũ trang cách mạng năm 1944 có ý nghĩa gì? | body/34–42 | Đề xuất | R10 |
| II-DIRECTIVE-ISSUE | Chỉ thị Nhật – Pháp bắn nhau và hành động của chúng ta được ban hành khi nào, bởi cơ quan nào? | body/47–49 | Đề xuất | R10 |
| II-DIRECTIVE-CONTENT | Chỉ thị ngày 12/3/1945 xác định kẻ thù và phương hướng hành động như thế nào? | body/47–57 | Đề xuất | R10 |
| II-MILITARY | Hội nghị quân sự cách mạng Bắc Kỳ tháng 4/1945 nhằm chuẩn bị những gì cho khởi nghĩa? | body/58–64 | Đề xuất | R10 |
| II-ZONE | Khu giải phóng Việt Bắc được thành lập khi nào, gồm những tỉnh nào và có trung tâm ở đâu? | body/65–73 | Đề xuất | R10, R02 |
| II-ZONE-GIAP | Võ Nguyên Giáp được giao nhiệm vụ gì trong Khu giải phóng Việt Bắc? | body/65–75 | Đề xuất | R10, R02 |
| III-CHINH | Vai trò chính trị và tổ chức của Trường Chinh trong chuẩn bị Tổng khởi nghĩa được thể hiện thế nào? | body/78–88 | Đề xuất | R10, R04 |
| III-GIAP-TRAINING | Võ Nguyên Giáp tham gia công tác đào tạo cán bộ trước Tổng khởi nghĩa như thế nào? | body/89–95 | Đề xuất | R10 |
| III-DONG-PREP | Phạm Văn Đồng tham gia chuẩn bị căn cứ và cán bộ trong năm 1945 như thế nào? | body/101–107 | Đề xuất | R10, R04 |
| III-VIET-1937 | Hoàng Quốc Việt được giao chức vụ nào vào năm 1937? | body/112–115 | Đề xuất | R10 |
| III-VIET-1941 | Hoàng Quốc Việt tham gia hoạt động nào tại Hội nghị Trung ương tháng 5/1941? | body/112–116 | Đề xuất | R10 |
| III-VIET-1943 | Hoàng Quốc Việt được giao trọng trách nào trong Tổng bộ Việt Minh năm 1943? | body/112–117 | Đề xuất | R10 |
| III-VIET-1945 | Tại Hội nghị toàn quốc của Đảng tháng 8/1945, Hoàng Quốc Việt được bầu vào cơ quan nào? | body/112–119 | Đề xuất | R10, R04 |
| III-VIET-SOUTH | Nhiệm vụ đặc phái viên vào Nam Bộ của Hoàng Quốc Việt được tài liệu mô tả ra sao? | body/112–122 | HOLD | R10, R03 |
| IV-COMMITTEE | Ủy ban Khởi nghĩa toàn quốc được thành lập khi nào, gồm những ai và do ai trực tiếp phụ trách? | body/125–134 | Đề xuất | R10, R04 |
| IV-ORDER-ISSUE | Quân lệnh số 1 được cơ quan nào ban bố, vào thời điểm nào? | body/135–136 | Đề xuất | R10, R04 |
| IV-ORDER-CONTENT | Quân lệnh số 1 yêu cầu quân và dân hành động như thế nào? | body/135–142 | Đề xuất | R10, R04 |
| IV-ORDER-AUTHORS | Người soạn và người ký Quân lệnh số 1 có phải cùng một người không? | body/135–144 | Đề xuất | R10, R04 |
| IV-PARTY-CONFERENCE | Hội nghị toàn quốc của Đảng tại Tân Trào tháng 8/1945 quyết định điều gì trước tình hình mới? | body/145–152 | Đề xuất | R10, R04 |
| IV-PRINCIPLES | Ba nguyên tắc hành động tại Hội nghị toàn quốc của Đảng tháng 8/1945 là gì? | body/145–159 | Đề xuất | R10, R04 |
| IV-GIAP-ELECTION | Võ Nguyên Giáp được bầu bổ sung vào cơ quan nào tại Hội nghị toàn quốc tháng 8/1945? | body/145–160 | Đề xuất | R10, R04 |
| IV-LOCAL-INITIATIVE | Sau tin Nhật đầu hàng, các địa phương chủ động khởi nghĩa và tổ chức những hoạt động nào? | body/161–171 | Đề xuất | R10 |
| IV-CONGRESS | Quốc dân Đại hội Tân Trào có địa điểm và thành phần đại biểu như thế nào? | body/172–174 | Đề xuất | R10 |
| IV-CONGRESS-DECISIONS | Quốc dân Đại hội Tân Trào thông qua những quyết định quan trọng nào? | body/172–182 | Đề xuất | R10 |
| IV-THAI-NGUYEN-DATES | Ngày 16/8 và 20/8 đánh dấu hai hoạt động nào của lực lượng tiến về Thái Nguyên? | body/183–187 | Đề xuất | R10, R05 |
| IV-LIBERATION-COMMITTEE | Ủy ban Dân tộc giải phóng Việt Nam ra mắt với tổ chức và vai trò như thế nào? | body/188–192 | Đề xuất | R10 |
| IV-CALL | Lời kêu gọi sau khi Ủy ban Dân tộc giải phóng ra mắt nhấn mạnh tinh thần gì? | body/188–196 | HOLD | R10, R06 |
| IV-FOUR-PROVINCES | Những tỉnh nào giành chính quyền ở tỉnh lỵ sớm ngày 18/8/1945? | body/197–204 | Đề xuất | R10, R05 |
| IV-HANOI-17 | Cuộc mít tinh ngày 17/8/1945 tại Hà Nội được Việt Minh chuyển hướng như thế nào? | body/205–212 | Đề xuất | R10, R05 |
| IV-HANOI-MORNING | Buổi sáng ngày 19/8/1945 tại Hà Nội diễn ra những hoạt động gì? | body/205–227 | Đề xuất | R10, R05 |
| IV-HANOI-TAKEOVER | Trong ngày 19/8/1945, lực lượng cách mạng tại Hà Nội tiếp quản chính quyền như thế nào? | body/205–239 | Đề xuất | R10, R05 |
| IV-HANOI-MEANING | Thắng lợi ở Hà Nội tác động thế nào đến Tổng khởi nghĩa? | body/205–244 | Đề xuất | R10, R05 |
| IV-THAI-NGUYEN-MEANING | Thắng lợi ở Thái Nguyên ngày 20/8 có ý nghĩa gì? | body/245–252 | Đề xuất | R10, R05 |
| IV-HUE | Cuộc khởi nghĩa ở Huế ngày 23/8/1945 diễn ra và tác động đến triều Nguyễn như thế nào? | body/253–263 | Đề xuất | R10, R05 |
| IV-SAIGON-FORCES | Những tổ chức và lực lượng nào chuẩn bị, tham gia khởi nghĩa Sài Gòn ngày 25/8? | body/264–274 | Đề xuất | R10, R05 |
| IV-SAIGON-RESULT | Khởi nghĩa Sài Gòn ngày 25/8 giành chính quyền bằng những hoạt động nào và có kết quả gì? | body/264–278 | Đề xuất | R10, R05 |
| IV-MEETING-26 | Cuộc họp của Trung ương tại Hà Nội ngày 26/8/1945 bàn những nhiệm vụ gì? | body/279–288 | Đề xuất | R10 |
| IV-GOVERNMENT-27 | Chính phủ lâm thời ngày 27/8/1945 được hình thành và tổ chức như thế nào? | body/289–295 | Đề xuất | R10 |
| IV-NATIONWIDE-28 | Đến ngày 28/8/1945, kết quả Tổng khởi nghĩa trên cả nước được ghi nhận như thế nào? | body/296–301 | Đề xuất | R10 |
| IV-ABDICATION | Sự kiện Bảo Đại thoái vị ngày 30/8/1945 diễn ra như thế nào và có ý nghĩa gì? | body/302–308 | Đề xuất | R10 |
| IV-DECLARATION-PLACE | Ngày 2/9/1945, tại đâu, Chủ tịch Hồ Chí Minh thay mặt Chính phủ lâm thời đọc bản Tuyên ngôn Độc lập? | body/310–310 | cmtt45-q062 | R10, R05 |
| IV-DECLARATION-CONTENT | Tuyên ngôn Độc lập khẳng định những nội dung chính nào? | body/309–318 | Đề xuất | R10 |
| IV-DECLARATION-QUOTE | Câu tuyên bố về quyền tự do và độc lập được tài liệu trích như thế nào? | body/309–320 | HOLD | R10, R06 |
| IV-DECLARATION-MEANING | Sự kiện ngày 2/9/1945 có ý nghĩa gì đối với sự ra đời của nhà nước mới? | body/309–322 | Đề xuất | R10 |
| V-DONG | Sau Cách mạng tháng Tám, công việc của Phạm Văn Đồng tập trung vào lĩnh vực nào? | body/326–332 | Đề xuất | R10 |
| V-GIAP | Võ Nguyên Giáp tham gia bảo vệ và tổ chức chính quyền mới qua những công việc nào? | body/333–339 | Đề xuất | R10 |
| V-VIET | Hoàng Quốc Việt thực hiện những công việc gì ở Nam Bộ sau thắng lợi Tổng khởi nghĩa? | body/340–349 | HOLD | R10, R03 |
| V-CHINH | Trường Chinh tiếp tục đóng góp vào củng cố chính quyền sau Cách mạng tháng Tám như thế nào? | body/350–356 | Đề xuất | R10 |
| VII-LEADERSHIP | Sự lãnh đạo của Đảng và Hồ Chí Minh góp phần vào thắng lợi như thế nào? | body/358–360 | Đề xuất | R10 |
| VII-PREPARATION | Quá trình chuẩn bị lâu dài đã xây dựng những nền tảng nào cho thắng lợi? | body/361–367 | Đề xuất | R10 |
| VII-UNITY | Tinh thần đoàn kết toàn dân được thể hiện qua những lực lượng nào? | body/368–369 | Đề xuất | R10 |
| VII-FORCES | Đấu tranh chính trị và đấu tranh vũ trang phối hợp với vai trò như thế nào? | body/370–371 | Đề xuất | R10 |
| VII-OBJECTIVE | Những điều kiện khách quan nào tạo thời cơ cho Cách mạng tháng Tám? | body/372–377 | Đề xuất | R10 |
| VIII-VIETNAM | Cách mạng tháng Tám có ý nghĩa gì đối với Việt Nam? | body/378–385 | Đề xuất | R10 |
| VIII-WORLD | Cách mạng tháng Tám có ý nghĩa gì đối với thế giới? | body/386–389 | Đề xuất | R10 |

R01–R10 trong [báo cáo review](chatbot-rebuild-knowledge-review.md) vẫn mở. R02 về citation không đầy đủ và R08 về xác minh lịch sử áp dụng toàn bộ nguồn; cột trên chỉ nhấn mạnh cảnh báo từng ý. Bốn HOLD không được đưa vào các batch hiện tại: III-VIET-SOUTH và V-VIET cần làm rõ nhiệm vụ trước/sau thắng lợi (có thể gộp sau review); IV-CALL và IV-DECLARATION-QUOTE cần chứng cứ nguyên bản cho lời trích. Không tự quyết định các mốc đã đúng.

## Context và pipeline trước khi gọi

7/68 spans gồm một paragraph (trong đó có 2 Draft); 61 spans cần nhiều paragraph liên tục. B01 dùng body/4, body/25 và body/58–64. Các context lấy nguyên văn từng paragraph, nối bằng newline, giữ đầy đủ blockIds/section/paragraph đầu-cuối và hash. SupportingRanges chỉ để người biên tập đối chiếu, **không nối các đoạn rời thành evidence giả**. Không dùng bullet đại từ “ông” nếu thiếu chủ ngữ trong đoạn trước. Tối đa 6.000 ký tự context theo kế hoạch này; trích dẫn và factual core phải liên tục trong cùng một chunk.

Pilot CLI cũ chỉ có hai source blocks cố định và checkpoint đã hết; **không chạy lại hoặc reset**. Khi B01 được xác nhận, cần bổ sung điều phối batch có ledger mới và context adapter cho spans liên tục, tái sử dụng provider/parser/importer; không thay grounding hoặc giả xác nhận nguồn. Source locator của export phải trỏ các blocks gốc tương ứng, không lưu planning:key làm block DOCX. Adapter chưa được chạy live trong đợt này. File mới hiện chưa được upload/confirm trong Mongo source management; đó không phải lỗi hai Draft private tĩnh. Nếu chọn UI thay CLI, admin thật phải upload đúng DOCX, đọc và xác nhận nguồn; không tự tạo confirmedBy.

Luồng sau xác nhận: đọc lại env/budget/state → khóa batch và checkpoint trước mỗi request → reserve đúng 1 lượt qua repository hiện có → gọi provider 1 proposal → lưu raw output riêng → parse schema/citation/grounding/persona → kiểm tra duplicates với revisions và proposals hiện hành → export Draft riêng batch → validate/dry-run → chỉ import Draft thuộc batch được xác nhận → đọc lại và dry-run idempotency. Mỗi lỗi/timeout vẫn tính một attempt; không retry tự động hoặc gọi bù. insufficientEvidence/duplicates không được tự sửa để import.

Importer hiện có chặn conflict ID/version nhưng **duplicateAliases là báo cáo, chưa tự chặn apply**. Vì vậy orchestration của batch phải dừng nếu có collision hoặc possible duplicate chưa được review; không được coi dry-run exit 0 là đủ. Giữ ID q061/q062 v1, không gộp hay ghi đè. Cấp ID mới theo repository từ cả audit và câu đang có; dự kiến bắt đầu q063, phải tính lại ngay trước export.

## Trùng lặp và chất lượng hai Draft

Read-only duplicate candidates từ repository: 3 (2 revisions và một proposal có nội dung; không chỉ so câu Published). Kết quả exact chỉ là hai ý có sẵn q061/q062 và đã loại khỏi generation. Chưa thấy trùng chính xác ở 62 ý đề xuất. Có hai cặp possible_duplicate trong chính kế hoạch:

- III-VIET-1945 / IV-GIAP-ELECTION: cùng hội nghị nhưng **khác nhân vật và chức vụ**; giữ tách tạm thời, aliases tương lai phải có tên nhân vật rõ ràng.
- VIII-VIETNAM / VIII-WORLD: cùng chủ đề ý nghĩa nhưng khác phạm vi; aliases phải phân biệt trong nước/quốc tế.

Đây là heuristic biên tập hiện có, không chứng minh mọi diễn đạt tương đương. Cần chạy lại sau khi có canonical/aliases/neutral thật; không tự hạ threshold hoặc bỏ cảnh báo. Các ý cùng context vẫn có thể sinh trùng nếu AI bỏ qua intent.

Hai Draft hiện có vẫn giữ nguyên byte nội dung Mongo theo snapshot, version/status/reviewer. Schema và evidence đúng nguồn; 8/8 persona giữ nguyên factual core, mỗi câu có 4 lời dẫn khác nhau và 2 aliases. Nhưng mỗi persona lặp cùng một frame ở cả hai câu (2/2), nên độ tự nhiên còn hạn chế. q061 còn R09 về “hơn 30 năm”; q062 còn R05 về timeline/địa điểm. Khớp nguồn không thay cho kiểm định lịch sử.

## Đề xuất persona — chưa áp dụng

Giữ nguyên factual core và whitelist hiện tại. Hai frame có sẵn của mỗi persona đã qua kiểm thử mock, có thể dùng làm phương án luân phiên khi batch được duyệt; không sửa hai Draft để tạo cảm giác đa dạng. Trường Chinh nhấn ý cốt lõi/hệ thống; Phạm Văn Đồng điềm đạm dẫn giải; Hoàng Quốc Việt gần gũi, rõ việc; Võ Nguyên Giáp điềm tĩnh, dứt khoát. Không gán ký ức, trải nghiệm hoặc lời nói lịch sử cho persona.

Hướng biên tập thử riêng: tăng các lời dẫn ngắn không mang dữ kiện, tránh câu “tài liệu nêu” ở mọi lời đáp. Test minh họa frame mới “Mình cùng khám phá câu chuyện này nhé:” **bị parser hiện tại đánh insufficientEvidence**, đúng kỳ vọng. Chưa thêm frame đó vào whitelist, chưa sửa prompt. Muốn mở rộng cần người duyệt xem từng frame và bộ kiểm thử chống thêm dữ kiện; không đổi sang paraphrase tự do của thân đáp án. Các mutation ngày/người/địa danh, lược factual core, ngôi thứ nhất trực tiếp tham gia và thêm câu ngoài nguồn đều bị chặn trong tests.

## Quota và batch đề xuất

Preflight lúc 2026-11-03T00:47:07.080Z. Đích database đọc từ env: **vo_danh**, không hardcode trong script. Model hiện tại **gemini-3.5-flash-lite**, API v1beta, maxPerRequest=1; không đổi flags/model/env/billing. App counter ngày UTC **2026-11-03: 0/5, còn 5**. Ngày 2026-11-02 đã dùng 2/5; sang ngày mới đọc ra 0/5, **không reset counter/ledger cũ**. Đây là ngân sách ứng dụng; quota token/RPM/RPD và Free Tier phía provider chưa kiểm tra lại live trong đợt planning. Trước batch thật cần xác nhận điều kiện provider hiện hành, không tự bật billing.

Đề xuất **B01: tối đa 3 calls, mỗi call tối đa 1 proposal, tổng tối đa 3 Draft mới hợp lệ**:

1. I-GERMANY — body/4: mốc Đức đầu hàng và kết quả.
2. II-CONFERENCE8 — body/25: thời gian, nơi họp, người chủ trì Hội nghị Trung ương 8.
3. II-MILITARY — body/58–64: nội dung chuẩn bị quân sự tháng 4/1945; thử context nhiều paragraph.

Chưa có quyền dùng 3 lượt này. Ngân sách 2 pilot trước đã hết; counter còn lại không phải authorization. Không hứa 3 calls sẽ cho đủ 3 Draft: provider lỗi, insufficientEvidence hoặc duplicate có thể khiến ít hơn. Với 62 ý đủ để lập kế hoạch, dự kiến 62 lượt tối thiểu nếu mỗi lượt thành công 1 proposal; **không phải xin phép chạy cả 62 lượt**. Chia 21 batch tối đa 3 lượt; dừng review mỗi batch. Với daily cap 5 và không có tác vụ khác, tối thiểu 13 ngày UTC cho 62 lượt, không cam kết lịch/quota provider. 4 HOLD cần quyết định nguồn trước khi ước lượng thêm.

| Batch | Ý hỏi | Tối đa calls | Tối đa Draft | Quyền |
|---|---|---:|---:|---|
| B01 | I-GERMANY, II-CONFERENCE8, II-MILITARY | 3 | 3 | Chưa được phép |
| B02 | I-USSR, I-ATOMIC, I-SURRENDER | 3 | 3 | Chưa được phép |
| B03 | I-COUP, I-GOVERNMENT, I-FAMINE | 3 | 3 | Chưa được phép |
| B04 | I-WINDOW, II-PRIORITIES, II-ARMY | 3 | 3 | Chưa được phép |
| B05 | II-FIRST-BATTLES, II-ARMY-MEANING, II-DIRECTIVE-ISSUE | 3 | 3 | Chưa được phép |
| B06 | II-DIRECTIVE-CONTENT, II-ZONE, II-ZONE-GIAP | 3 | 3 | Chưa được phép |
| B07 | III-CHINH, III-GIAP-TRAINING, III-DONG-PREP | 3 | 3 | Chưa được phép |
| B08 | III-VIET-1937, III-VIET-1941, III-VIET-1943 | 3 | 3 | Chưa được phép |
| B09 | III-VIET-1945, IV-COMMITTEE, IV-ORDER-ISSUE | 3 | 3 | Chưa được phép |
| B10 | IV-ORDER-CONTENT, IV-ORDER-AUTHORS, IV-PARTY-CONFERENCE | 3 | 3 | Chưa được phép |
| B11 | IV-PRINCIPLES, IV-GIAP-ELECTION, IV-LOCAL-INITIATIVE | 3 | 3 | Chưa được phép |
| B12 | IV-CONGRESS, IV-CONGRESS-DECISIONS, IV-THAI-NGUYEN-DATES | 3 | 3 | Chưa được phép |
| B13 | IV-LIBERATION-COMMITTEE, IV-FOUR-PROVINCES, IV-HANOI-17 | 3 | 3 | Chưa được phép |
| B14 | IV-HANOI-MORNING, IV-HANOI-TAKEOVER, IV-HANOI-MEANING | 3 | 3 | Chưa được phép |
| B15 | IV-THAI-NGUYEN-MEANING, IV-HUE, IV-SAIGON-FORCES | 3 | 3 | Chưa được phép |
| B16 | IV-SAIGON-RESULT, IV-MEETING-26, IV-GOVERNMENT-27 | 3 | 3 | Chưa được phép |
| B17 | IV-NATIONWIDE-28, IV-ABDICATION, IV-DECLARATION-CONTENT | 3 | 3 | Chưa được phép |
| B18 | IV-DECLARATION-MEANING, V-DONG, V-GIAP | 3 | 3 | Chưa được phép |
| B19 | V-CHINH, VII-LEADERSHIP, VII-PREPARATION | 3 | 3 | Chưa được phép |
| B20 | VII-UNITY, VII-FORCES, VII-OBJECTIVE | 3 | 3 | Chưa được phép |
| B21 | VIII-VIETNAM, VIII-WORLD | 2 | 2 | Chưa được phép |

## Xác minh và kiểm thử

Mongo before/after: 2 questions, 2 draft revisions v1, 0 approved/published/runtime, 0 orphan/broken pointer/duplicate version. Cả **11 collections knowledge** có count và SHA-256 BSON bằng nhau, gồm budget/audit/source/chunks/proposals. Không kiểm kê byte toàn bộ chat/quiz/payment, nhưng không có code ghi các collection đó. Dry-run 0 insert, 2 skip, 0 conflict, 0 alias collision, 0 write; một cảnh báo DATES_REVIEW q062 giữ nguyên.

- Unit/mock/regression: **256/257 PASS, 1 FAIL**; failure có sẵn Phase 2.5 snapshot matching, đã tái hiện trên bản HEAD cô lập đợt trước. Không chỉnh matcher/nhãn để làm xanh.
- Planning/grounding/duplicate mới: **9/9 PASS**, trong suite trên; đã chạy lại sau điều chỉnh locator đầu span.
- Python DOCX extraction: **3/3 PASS**; DOCX/PDF TypeScript: **11/11 PASS** (cảnh báo fallback font PDF fixture).
- TypeScript và ESLint phạm vi sửa: **PASS**.
- Production build cô lập: **PASS**, 45 static pages; không sao chép .env.local, guard chặn fetch/Mongo. Có cảnh báo multiple-lockfiles và socket retry trong build, không phải generation calls.
- Mongo destructive/fixtures/concurrency/rollback integration: **NOT_RUN**, không an toàn trên database hiện tại; service behavior được kiểm thử bằng mock, không tuyên bố đã chứng minh transaction thật của đợt này. Không yêu cầu MONGODB_TEST_URI.
- Browser E2E: **NOT_RUN**; đợt planning không thay UI, không tạo tài khoản hoặc dữ liệu để thử.

Artifacts mới ở .local/knowledge-rebuild-planning/; giữ nguyên .local/knowledge-rebuild/ và mọi ledger cũ. JSON plan là file private đang bị gitignore, không đưa vào public/PWA.

## Lệnh tái kiểm tra chỉ đọc/offline

```powershell
rtk proxy node scripts/plan-knowledge-rebuild.mjs
rtk proxy node --conditions=react-server --import tsx scripts/inspect-rebuild-plan.ts
rtk proxy node --conditions=react-server --import tsx scripts/import-knowledge.ts --source docs/source/Tong-hop-kien-thuc-moi.docx --manifest knowledge/new-source-manifest.json --file knowledge/new-questions-draft.json --dry-run --report .local/knowledge-rebuild-planning/import-dry-run.json
rtk proxy node scripts/check-knowledge-rebuild.mjs test --planning
rtk proxy node scripts/check-knowledge-rebuild.mjs build --planning
```

## Điểm dừng

Chờ chủ dự án xác nhận **B01 tối đa 3 generation calls và chỉ import tối đa 3 Draft hợp lệ thuộc batch**, không approve/publish. Yêu cầu xác nhận xuất phát từ mục 6 và mục 10 của tệp CONTINUE PHASE 1 do chủ dự án gửi. Không chạy cleanup/apply/generation hoặc chuyển Phase 2 trong đợt này.
