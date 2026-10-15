# Knowledge Coverage Audit cho chatbot lịch sử

Ngày audit: **14/10/2026**. Phạm vi: tài liệu *Cách mạng tháng Tám năm 1945* do dự án cung cấp và **40 câu hỏi draft revision 3**.

**Bao phủ đầy đủ: 61/92 đơn vị = 66,30%.** Có 15 đơn vị được bao phủ một phần và 16 đơn vị chưa được bao phủ. Đáp án trung tính riêng đạt 69/92 = 75,00%; nội dung chung của bốn lời đáp nhân vật đạt 61/92 = 66,30%. Khoảng cách này cho thấy việc biên tập persona đã lược một số chi tiết có trong neutral/source.

Đề xuất **19 ý định câu hỏi mới**, suy ra từ các khoảng trống: 17 có thể đưa vào bước soạn draft để người quản trị duyệt, 2 phải đối chiếu phần nguồn về Lê Duẩn/Nam Bộ trước. Đồng thời cần đề xuất revision cho **9 câu hiện hữu** và cải thiện aliases riêng. Audit không thực hiện các thay đổi đó.

File máy đọc: [knowledge/coverage-audit.json](../knowledge/coverage-audit.json). Mọi kết luận dưới đây là đối chiếu coverage của bản nháp, **không phải approval lịch sử, không phải tỷ lệ chatbot production đã trả lời được**. Không truy cập MongoDB trong tác vụ này; không import, approve, publish hoặc sửa input.

## 1. Nguồn và cách đọc

Đã đọc toàn bộ DOCX I–X, JSON revision 3, review report Phase 2 và knowledge pipeline. Chạy extractor hiện có bằng `--check`: manifest khớp DOCX, **189 block/paragraph, một bảng với 15 ô**; không ghi lại manifest. Có **153 block được ánh xạ kiến thức, 36 block tiêu đề/câu dẫn/nhãn bảng/đoạn trống được giải trình loại trừ** trong JSON. Tiêu đề mang thông tin thời kỳ hoặc bài học cũng được gắn vào đơn vị liên quan.

Đã đọc 40 canonical question, 80 aliases, neutral answers và nội dung của 160 characterAnswers. Đối chiếu toàn bộ characterAnswers với `proposeCharacterDialogue` cho kết quả giống nhau: trong mỗi câu, bốn persona dùng cùng hai đoạn nội dung, khác khung diễn đạt. Review report 2.323 dòng được đọc với phần lặp lại của JSON đối chiếu một lần; giữ nguyên 18 cảnh báo chưa duyệt.

Không tra nguồn lịch sử bên ngoài, không tự hòa giải nội dung mâu thuẫn. Hash input ở cuối báo cáo và trong JSON giúp tái kiểm tra đúng snapshot.

## 2. Đơn vị kiến thức và công thức

Phân rã thành **92 đơn vị có ý nghĩa (K001–K092), 136 khía cạnh chi tiết (facets)**. Một sự kiện gồm thời gian, nơi chốn, chủ thể và kết quả cần thiết; không biến từng từ/tên/ngày thành một đơn vị chỉ để tăng mẫu số. Các quan hệ độc lập như nguyên nhân, kết quả, ý nghĩa và bài học được tách riêng. Quan hệ so sánh bốn vai trò là một mục tiêu học tập, còn bốn cách diễn đạt cùng lời đáp không phải bốn kiến thức.

Gộp nội dung lặp ở phần khái quát, bảng vai trò, IX và X bằng ID chung; giữ mọi vị trí nguồn. Có **151 lượt xuất hiện đơn vị theo mục nhưng chỉ 92 ID duy nhất**. Quan hệ mới hoặc bối cảnh thời kỳ khác vẫn được tách: chuẩn bị du kích 1941–1944 không thể được coi đã có chỉ vì q011 nhắc lực lượng vũ trang trong cao trào 1945.

Các nhóm được gắn trong JSON: sự kiện, thời gian, địa điểm, nhân vật/lực lượng, nguyên nhân, diễn biến, kết quả, ý nghĩa và bài học. Một đơn vị có thể thuộc nhiều nhóm, không nhân trọng số theo số nhãn.

### Quy tắc phân loại

- **covered**: mọi facet có chứng cứ trong neutral và nội dung phục vụ của cả bốn persona, ở một hoặc nhiều câu được chỉ rõ. Không yêu cầu phải có canonical riêng cho mỗi facet.
- **partially_covered**: có ít nhất một facet trong đáp án nhưng thiếu facet khác, hoặc neutral có mà persona lược bỏ. Chỉ có source excerpt chưa được đưa vào đáp án không được tính covered.
- **uncovered**: không có facet đáp án đủ đúng phạm vi. Trùng từ khóa/chủ đề hoặc thông tin của giai đoạn khác không được xem là chứng cứ.

Có thể dùng nhiều câu để xác nhận nội dung tồn tại trong kho. Điều này **không có nghĩa runtime ghép nhiều đáp án**: chatbot hiện trả một characterAnswer. Việc người chơi tìm được câu đó được đánh giá riêng ở mục 5.

Đặt C = covered, P = partially_covered, U = uncovered, N = C + P + U. Tất cả đơn vị trọng số 1; importance chỉ để ưu tiên xử lý:

```text
Bao phủ đầy đủ        = C / N × 100
Chỉ số quy đổi        = (C + 0,5 × P) / N × 100
Có ít nhất một phần  = (C + P) / N × 100
```

Toàn bộ tài liệu: **61/92 = 66,30%**; quy đổi **(61 + 0,5×15)/92 = 74,46%**; có một phần **76/92 = 82,61%**. Hệ số 0,5 là quy ước so sánh minh bạch, không khẳng định mỗi partial có đúng một nửa nội dung. Không gọi 82,61% là đã phủ đầy đủ.

Theo từng mục: chỉ xét unique units và **facets thực sự có trong nguồn tại mục đó**. Ví dụ thiếu ý thời cơ cho các dân tộc khác ở II không làm giảm IV/IX khi các mục này chỉ nói Việt Nam. Không cộng mẫu số các mục hoặc lấy trung bình không trọng số để ra tỷ lệ toàn tài liệu.

Độ hạt là lựa chọn biên tập được công khai, không phải mẫu số khách quan duy nhất. Nếu reviewer đổi cách phân rã, cần version audit mới và tính lại; các phần trăm này chính xác theo rubric và ánh xạ đang công bố.

## 3. Bao phủ theo mục I–X

| Mục | N | C | P | U | Đầy đủ | Quy đổi |
| --- | --- | --- | --- | --- | --- | --- |
| I. Khái quát chung | 12 | 10 | 1 | 1 | 83.33% | 87.50% |
| II. Bối cảnh lịch sử | 11 | 5 | 1 | 5 | 45.45% | 50.00% |
| III. Quá trình chuẩn bị cho Cách mạng tháng Tám | 20 | 13 | 2 | 5 | 65.00% | 70.00% |
| IV. Diễn biến chính của Cách mạng tháng Tám năm 1945 | 20 | 18 | 0 | 2 | 90.00% | 90.00% |
| V. Vai trò của các đồng chí Trường Chinh, Lê Duẩn, Phạm Văn Đồng và Võ Nguyên Giáp | 29 | 19 | 8 | 2 | 65.52% | 79.31% |
| VI. Kết quả và ý nghĩa lịch sử | 13 | 10 | 3 | 0 | 76.92% | 88.46% |
| VII. Nguyên nhân thắng lợi | 12 | 11 | 1 | 0 | 91.67% | 95.83% |
| VIII. Bài học kinh nghiệm | 7 | 6 | 0 | 1 | 85.71% | 85.71% |
| IX. Những vấn đề lịch sử cần phân biệt khi giảng dạy | 16 | 16 | 0 | 0 | 100.00% | 100.00% |
| X. Kết luận tổng hợp | 11 | 11 | 0 | 0 | 100.00% | 100.00% |

### Nhận xét từng mục

- **I:** Có tính chất cách mạng, lãnh đạo, kết quả, bước ngoặt, Tuyên ngôn. Thiếu danh sách cụ thể các tầng lớp tham gia và quan hệ khởi nghĩa nông thôn–thành thị. Không cần tạo lại các câu về 2/9 chỉ vì chúng được đặt ở mục IV.
- **II:** Khoảng trống lớn nhất: khởi đầu chiến tranh, Đức–Liên Xô, Nhật ở châu Á–Thái Bình Dương, Nhật vào Đông Dương tháng 9/1940 và nạn đói. Đã có đảo chính, chỉ thị, mâu thuẫn/nhiệm vụ và hai mốc đầu hàng. Phạm vi thời cơ cho các dân tộc khác mới có trong nguồn.
- **III:** Đã có hội nghị 1939/1941, Nguyễn Ái Quốc về nước, Đội Việt Nam Tuyên truyền Giải phóng quân, các hoạt động kháng Nhật và Việt Bắc. Thiếu chuẩn bị cứu quốc/du kích/cán bộ 1941–1944, Cao Bằng và Hội nghị quân sự Bắc Kỳ. q009 lược tên đầy đủ Việt Minh; q011 chưa nêu khung tháng 3–8/1945.
- **IV:** Đã có các quyết định ở Tân Trào, ngày thắng lợi Hà Nội/Huế/Sài Gòn và đặc điểm diễn biến. Thiếu riêng các ngày 14–18/8 và mốc 28/8/kiện toàn Chính phủ. Phân biệt ban bố Quân lệnh 13/8 với đọc ngày 16/8 ở mục V.
- **V:** Đã có các vai trò lớn và đính chính Lê Duẩn, nhưng thiếu tiểu sử cơ bản và một số chi tiết cơ quan/hoạt động bị lược trong persona. V.2/bảng V.5 phải đọc cùng body/111 và IX.4; không biến khoảng trống coverage thành khẳng định Lê Duẩn chỉ huy tháng 8.
- **VI:** Các kết quả và ý nghĩa lớn đều có. Lời đáp nhân vật thiếu cơ sở chính trị–pháp lý, việc xây thể chế/giáo dục/kinh tế–xã hội và quy mô hàng triệu người. Cần sửa revision hiện có hoặc bổ sung câu lực lượng; không cần tạo lại toàn bộ mục.
- **VII:** Các nhóm chủ quan/khách quan và quan hệ giữa chúng đã có trong q031–q033. Chi tiết lãnh đạo đưa chủ trương/quyết định khởi nghĩa kịp thời có ở neutral q031 nhưng persona nói khái quát. Tách nguyên nhân cụ thể khỏi bài học chung để không tự lấp khoảng trống.
- **VIII:** Các bài học mục tiêu dân tộc, chuẩn bị lực lượng, đoàn kết, thời cơ, chính trị–vũ trang đã hiện diện, kể cả trong câu thuộc mục khác. Thiếu bài học chỉ đạo thống nhất gắn chủ động địa phương. Vì vậy không dùng 3 câu gán mục VIII chia 6 tiêu đề để báo coverage.
- **IX:** Nội dung năm điểm phân biệt có thể tìm thấy ở q025/q027/q033/q037/q038 và các câu liên quan. 100% ở bảng chỉ nghĩa tồn tại nội dung, không phải mọi cách hỏi nhận diện được: probe về Nhật đầu hàng/tự động độc lập chưa match, câu hỏi chỉ-quân-sự chưa gợi ý đúng câu giải thích trực tiếp.
- **X:** Kết luận lặp lại và liên hệ các kiến thức trước đó; đã được q039 cùng các câu vai trò/nguyên nhân hỗ trợ. Không đếm lại thành kiến thức toàn tài liệu mới hoặc nhân số lượng lên theo bốn nhân vật. 100% nội dung không phải phê duyệt lịch sử.

### So sánh lớp đáp án

| Lớp kiểm tra | Đầy đủ | Một phần | Chưa có | Tỷ lệ đầy đủ |
| --- | --- | --- | --- | --- |
| Neutral answer | 69 | 7 | 16 | 75,00% |
| Bốn persona (cùng nội dung) | 61 | 13 | 18 | 66,30% |
| Cả neutral và persona — phân loại chính | 61 | 15 | 16 | 66,30% |

Hai đơn vị K057 (thông tin Trường Chinh) và K077 (cơ sở chính trị–pháp lý) chỉ còn chứng cứ ở neutral, nên persona đánh uncovered nhưng phân loại tổng là partial. Tám đơn vị neutral đầy đủ nhưng persona chưa đầy đủ: K028, K059, K068, K072, K074, K077, K079, K083. Đây là thiếu nội dung lời đáp, không khắc phục chỉ bằng aliases.

## 4. Khoảng trống và phương án bổ sung

### Kiến thức quan trọng chưa có câu trả lời tương ứng

Ưu tiên: kết hợp nông thôn–thành thị; Nhật vào Đông Dương tháng 9/1940 trong khi bộ máy Pháp còn tồn tại; nạn đói cuối 1944–đầu 1945 và tác động; chuẩn bị tổ chức cứu quốc/du kích/cán bộ 1941–1944; căn cứ Cao Bằng; Hội nghị quân sự Bắc Kỳ tháng 4/1945; diễn biến 14–18/8 và mốc 28/8; bài học chỉ đạo thống nhất gắn chủ động địa phương. Bối cảnh chiến tranh 1939/1941 và các hồ sơ tiểu sử cũng có khoảng trống nhưng có thể xếp sau các mốc cốt lõi của boardgame.

Danh sách đầy đủ **16 uncovered**, kèm mọi đề xuất xử lý:

| ID | Kiến thức | Nguồn | Đề xuất |
| --- | --- | --- | --- |
| K011 | Kết hợp khởi nghĩa nông thôn và thành thị | body/8 | N02 |
| K013 | Chiến tranh thế giới thứ hai bùng nổ và bối cảnh 1939–1945 | body/13, body/14 | N03 |
| K014 | Đức tấn công Liên Xô | body/15 | N04 |
| K015 | Nhật mở rộng chiến tranh châu Á – Thái Bình Dương | body/16 | N05 |
| K018 | Nhật vào Đông Dương và bộ máy Pháp cùng tồn tại | body/20 | N06 |
| K021 | Nạn đói cuối 1944 – đầu 1945 và tác động chính trị | body/23 | N07 |
| K030 | Phát triển tổ chức cứu quốc 1941–1944 | body/35, body/36, body/37 | N08 |
| K031 | Xây dựng căn cứ Cao Bằng | body/35, body/38 | N09 |
| K032 | Du kích và lực lượng vũ trang giai đoạn 1941–1944 | body/35, body/39 | N08 |
| K033 | Đào tạo cán bộ và phương án khởi nghĩa 1941–1944 | body/35, body/40 | N08 |
| K041 | Hội nghị quân sự cách mạng Bắc Kỳ | body/50 | N10 |
| K049 | Địa phương khởi nghĩa ngày 14–18/8 | body/61 | N11 |
| K053 | Mốc 28/8 và kiện toàn Chính phủ lâm thời | body/65 | N12 |
| K063 | Đặc thù và lực lượng cách mạng Nam Bộ | body/86, body/88, body/89 | N18 |
| K066 | Tiểu sử cơ bản Phạm Văn Đồng | body/92 | N15 |
| K090 | Lãnh đạo thống nhất và chủ động địa phương | body/160, body/161 | N19 |

### Những chi tiết chỉ có một phần

| ID | Phần còn thiếu ở neutral hoặc persona | Câu có liên quan | Đề xuất |
| --- | --- | --- | --- |
| K003 | Nêu cụ thể công nhân, nông dân, thanh niên, trí thức và các tầng lớp yêu nước. / Hàng triệu người thuộc các giai cấp, tầng lớp và địa phương tham gia. [neutral có; persona thiếu] | q001, q009, q029 | N01 |
| K017 | Thời cơ cũng thuận lợi cho các dân tộc đấu tranh giải phóng khác, không riêng Việt Nam. | q013, q032 | R01 |
| K028 | Thành lập Mặt trận Việt Nam Độc lập Đồng minh, gọi tắt Việt Minh. [neutral có; persona thiếu] | q009 | R02 |
| K035 | Giai đoạn cao trào được xác định tháng 3–8/1945. | q005 | R03 |
| K057 | Trường Chinh sinh 1907, mất 1988, tên thật Đặng Xuân Khu. / Là Tổng Bí thư Đảng Cộng sản Đông Dương giai đoạn chuẩn bị và tiến hành cách mạng. [neutral có; persona thiếu] | q022 | N13 |
| K059 | Đó là Hội nghị Ban Thường vụ Trung ương Đảng mở rộng. [neutral có; persona thiếu] | q022 | R04 |
| K061 | Lê Duẩn sinh 1907, mất 1986. | q023, q038 | N14 |
| K062 | Hoạt động gắn xây dựng cơ sở Đảng, tổ chức lực lượng, vận động quần chúng khi Pháp đàn áp. | q023, q038 | N17 |
| K068 | Ban Thường trực đảm nhiệm công việc trọng yếu của chính quyền thời chuyển tiếp. [neutral có; persona thiếu] | q024, q016 | R05 |
| K070 | Võ Nguyên Giáp sinh 1911, mất 2013. | q025, q040 | N16 |
| K072 | Góp phần tổ chức, thống nhất lực lượng vũ trang chuẩn bị giành chính quyền. [neutral có; persona thiếu] | q025 | R06 |
| K074 | Hoạt động Võ Nguyên Giáp góp phần bảo vệ và mở rộng địa bàn cách mạng. [neutral có; persona thiếu] | q025, q036 | R06 |
| K077 | Sự ra đời nhà nước 2/9/1945 mở cơ sở chính trị – pháp lý cho quốc gia Việt Nam độc lập. [neutral có; persona thiếu] | q028 | R07 |
| K079 | Xây thể chế, tổ chức chính quyền, giáo dục và giải quyết vấn đề kinh tế – xã hội. [neutral có; persona thiếu] | q029 | R08 |
| K083 | Chủ trương và quyết định khởi nghĩa của lãnh đạo được đưa ra kịp thời. [neutral có; persona thiếu] | q031, q039 | R09 |

### Vì sao đề xuất 19 câu mới, không 31 hoặc một số định trước?

Có 31 đơn vị chưa đầy đủ = 16 uncovered + 15 partial. Trong đó **10 partial có thể sửa bằng 9 revision hiện hữu** (q025 xử lý hai đơn vị). **21 đơn vị còn lại** cần ý định hỏi mới theo phương án này; gộp K030/K032/K033 vào một câu cùng mục tiêu chuẩn bị 1941–1944, nên **21 − 2 = 19 câu mới**. Không nhân với bốn nhân vật và không tính aliases là câu knowledge mới.

Đây là phương án biên tập có thể thực hiện, không tuyên bố là nghiệm tối thiểu toán học. 17 đề xuất có thể chuyển sang bước soạn draft theo nguồn hiện có; 2 đề xuất N17/N18 phải giải quyết phạm vi nguồn trước. Nếu tất cả được chấp nhận, số câu logical từ 40 thành **59**, còn các revision sửa không làm tăng số câu logical. Chưa tạo câu hỏi/revision nào trong audit.

#### 19 ý định câu hỏi mới — chỉ là đề xuất

| ID | Đơn vị được xử lý | Ý định đề xuất | Điều kiện |
| --- | --- | --- | --- |
| N01 | K003 | Những giai cấp, tầng lớp nào tham gia Cách mạng tháng Tám và quy mô tham gia ra sao? | Soạn draft rồi review, chưa approve |
| N02 | K011 | Khởi nghĩa ở nông thôn và thành thị được kết hợp như thế nào theo tài liệu? | Soạn draft rồi review, chưa approve |
| N03 | K013 | Chiến tranh thế giới thứ hai bùng nổ khi nào và làm thay đổi bối cảnh ra sao? | Soạn draft rồi review, chưa approve |
| N04 | K014 | Đức tấn công Liên Xô khi nào và tác động gì tới chiến tranh? | Soạn draft rồi review, chưa approve |
| N05 | K015 | Việc Nhật mở rộng chiến tranh ở châu Á – Thái Bình Dương đe dọa điều gì? | Soạn draft rồi review, chưa approve |
| N06 | K018 | Nhật vào Đông Dương khi nào; bộ máy cai trị Pháp lúc đó còn tồn tại không? | Soạn draft rồi review, chưa approve |
| N07 | K021 | Nạn đói cuối 1944 – đầu 1945 diễn ra ở đâu, quy mô và tác động tới phong trào là gì? | Soạn draft rồi review, chưa approve |
| N08 | K030, K032, K033 | Giai đoạn 1941–1944 chuẩn bị tổ chức cứu quốc, du kích, cán bộ và phương án khởi nghĩa thế nào? | Soạn draft rồi review, chưa approve |
| N09 | K031 | Căn cứ Cao Bằng được xây dựng và mở rộng trong giai đoạn nào? | Soạn draft rồi review, chưa approve |
| N10 | K041 | Hội nghị quân sự cách mạng Bắc Kỳ tháng 4/1945 nhằm mục đích gì? | Soạn draft rồi review, chưa approve |
| N11 | K049 | Trong các ngày 14–18/8/1945, các địa phương giành chính quyền như thế nào? | Soạn draft rồi review, chưa approve |
| N12 | K053 | Mốc 28/8/1945 và việc kiện toàn Chính phủ lâm thời có ý nghĩa gì? | Soạn draft rồi review, chưa approve |
| N13 | K057 | Trường Chinh tên thật là gì, sống trong những năm nào và giữ cương vị gì khi đó? | Soạn draft rồi review, chưa approve |
| N14 | K061 | Lê Duẩn sống trong những năm nào và hoạt động gắn với địa bàn nào theo từng thời kỳ? | Soạn draft rồi review, chưa approve |
| N15 | K066 | Phạm Văn Đồng sống trong những năm nào và tham gia phong trào từ khi nào theo tài liệu? | Soạn draft rồi review, chưa approve |
| N16 | K070 | Võ Nguyên Giáp sống trong những năm nào và được giới thiệu ở vai trò gì? | Soạn draft rồi review, chưa approve |
| N17 | K062 | Hoạt động xây dựng cơ sở và vận động quần chúng của Lê Duẩn cần đặt vào những thời kỳ nào? | Chờ đối chiếu V.2/V.5/đính chính/IX.4 |
| N18 | K063 | Điều kiện riêng và sức mạnh tập thể tại Nam Bộ góp phần giành chính quyền thế nào? | Chờ đối chiếu V.2/V.5/đính chính/IX.4 |
| N19 | K090 | Bài học kết hợp chỉ đạo thống nhất với chủ động địa phương là gì? | Soạn draft rồi review, chưa approve |

#### 9 câu hiện hữu cần revision đề xuất

| ID | Câu | Đơn vị | Nội dung cần giữ/bổ sung |
| --- | --- | --- | --- |
| R01 | q013 | K017 | Bổ sung phạm vi thời cơ đối với các dân tộc giải phóng, không riêng Việt Nam. |
| R02 | q009 | K028 | Giữ tên đầy đủ Mặt trận Việt Nam Độc lập Đồng minh trong bốn lời đáp. |
| R03 | q011 | K035 | Nêu khung thời gian cao trào tháng 3–8/1945. |
| R04 | q022 | K059 | Khôi phục tên Hội nghị Ban Thường vụ Trung ương Đảng mở rộng. |
| R05 | q024 | K068 | Giải thích nhiệm vụ Ban Thường trực thời chuyển tiếp. |
| R06 | q025 | K072, K074 | Giữ thống nhất lực lượng vũ trang và bảo vệ/mở rộng địa bàn trong lời đáp. |
| R07 | q028 | K077 | Giữ ý cơ sở chính trị – pháp lý của quốc gia độc lập. |
| R08 | q029 | K079 | Nêu thể chế, chính quyền, giáo dục, kinh tế – xã hội khi giải thích nhà nước mới. |
| R09 | q031 | K083 | Giữ ý chủ trương và quyết định khởi nghĩa kịp thời của lãnh đạo. |

R01/R03 cần bổ sung locator nguồn tương ứng trước khi đề xuất revision; editor Phase 3 hiện kế thừa source. Audit không sửa source/revision để vượt giới hạn đó. Các câu mới/phiên bản mới phải được reviewer đối chiếu lại toàn bộ năm lời đáp và aliases.

## 5. Coverage cách diễn đạt là phép đo khác

Hiện có **40 canonical + 80 aliases = 120 chuỗi chuẩn hóa khác nhau**. Có 5 alias chỉ thêm lời xưng hô vào canonical; chúng hỗ trợ giao tiếp nhưng không thêm kiến thức hay ý định mới. Tự đưa 120 chuỗi đã khai báo vào matcher cho **120/120 exact đúng ID** chỉ là kiểm tra nhất quán, không phải recall trên câu hỏi thực tế.

Chạy matcher hiện có trực tiếp trong bộ nhớ với index draft giả lập để chẩn đoán; không gọi API, không ghi quota, không publish. Bộ 20 probe dưới đây do audit lựa chọn, **không phải mẫu ngẫu nhiên hoặc benchmark đại diện người chơi**:

- 0 exact, 5 suggest, 15 none.
- Trong 15 probe gắn đơn vị đã đầy đủ nội dung, 4/15 (26,67%) đưa đúng câu giải thích được chọn trước vào top-3; 1 probe đưa các câu liên quan nhưng thiếu câu giải thích trực tiếp mong đợi; 10 probe không có gợi ý.
- 5 probe còn lại gắn nội dung thiếu/một phần; tìm được từ khóa cũng không chứng minh có đáp án đầy đủ.

Không dùng 26,67% để ước lượng coverage ngôn ngữ toàn hệ thống. Chưa có bộ câu hỏi người dùng độc lập với phân bố xác định, nên tỷ lệ đó **chưa đo được**. JSON ghi `productionCoveragePercent: null`; không lấy 40 draft suy ra dữ liệu approved/published đang phục vụ.

| Cách hỏi thử | Đơn vị | Matcher | ID trả về | Câu đối chiếu mong đợi |
| --- | --- | --- | --- | --- |
| Ai lãnh đạo Cách mạng tháng Tám? | K002 | none | — | q001 |
| Người dân trở thành người làm chủ đất nước sau thắng lợi nào? | K008 | none | — | q002 |
| Nhật đầu hàng vào ngày nào? | K016 | none | — | q003 |
| Nhật đảo chính Pháp lúc nào? | K019 | suggest | q004 | q004 |
| Nguyễn Ái Quốc về nước ngày mấy? | K027 | suggest | q008 | q008 |
| Ai chỉ huy đội tuyên truyền giải phóng quân? | K034 | suggest | q010 | q010 |
| Phá kho thóc có tác dụng gì? | K038 | none | — | q011 |
| Hà Nội giành chính quyền ngày nào? | K050 | none | — | q017 |
| Huế khởi nghĩa thắng lợi hôm nào? | K051 | none | — | q018 |
| Ai đọc Tuyên ngôn Độc lập ở Ba Đình? | K012 | suggest | q020 | q020 |
| Phạm Văn Đồng làm bộ trưởng bộ nào sau cách mạng? | K069 | none | — | q024 |
| Võ Nguyên Giáp tiến về giải phóng nơi nào? | K073 | none | — | q026 |
| Lê Duẩn bị giam ở đâu năm 1940? | K065 | none | — | q023 |
| Nhật đầu hàng thì Việt Nam tự động độc lập phải không? | K087 | none | — | q033 |
| Cách mạng tháng Tám có phải chỉ là một chiến dịch quân sự? | K076 | suggest | q021, q029, q030 | q025 |
| Việt Minh là viết tắt của tên gì? | K028 | none | — | q009 |
| Trường Chinh tên thật là gì? | K057 | none | — | Chưa có đáp án cho ý hỏi |
| Nạn đói năm 1945 ảnh hưởng đến phong trào ra sao? | K021 | none | — | Chưa có đáp án cho ý hỏi |
| Hội nghị quân sự Bắc Kỳ tháng 4 năm 1945 nhằm mục đích gì? | K041 | none | — | Chưa có đáp án cho ý hỏi |
| Ngày 28/8/1945 có sự kiện gì? | K053 | none | — | Chưa có đáp án cho ý hỏi |

Ưu tiên rà soát thêm aliases/cách hỏi cho: lãnh đạo (q001), bước ngoặt (q002), hai mốc Nhật đầu hàng (q003), tác dụng phá kho thóc (q011), Hà Nội/Huế (q017/q018), chức vụ Phạm Văn Đồng (q024), Thái Nguyên (q026), nơi giam Lê Duẩn (q023), không tự động độc lập (q033), không chỉ quân sự (q025). Câu “Việt Minh viết tắt của gì?” cần sửa lời đáp q009 trước, rồi mới thêm cách hỏi tương ứng.

Không tự giảm ngưỡng fuzzy hoặc cho fuzzy tự trả lời để làm đẹp số liệu. Giữ việc gợi ý khi chưa exact/mơ hồ; các biến thể đảo ai/khi nào/ở đâu, viết không dấu, phủ định, tên viết tắt, hỏi nhiều ý cần một tập test có expected answers do người review xác lập. Mỗi revision hiện chỉ cho 2–5 aliases, nên chọn các biến thể có ích trong giới hạn này; muốn thay giới hạn phải là yêu cầu riêng.

## 6. Cảnh báo lịch sử và thứ tự cải thiện

Giữ nguyên **18 cảnh báo** từ báo cáo Phase 2: DATES_REVIEW 8; QUAN_LENH 4; LE_DUAN 3; CAUSES 3. JSON lưu từng question ID. Audit không đóng cảnh báo, không tạo reviewer và không gọi tên field `approvedAnswer` là nội dung đã được duyệt.

Với Lê Duẩn, V.2 và bảng V.5 nói hoạt động miền Nam khái quát, trong khi body/111 và IX.4 nêu bị bắt năm 1940, Côn Đảo, về đất liền sau cách mạng thành công. N17/N18 phải giữ ranh giới đó. Không viết thêm ngày trở về, tên tỉnh khởi nghĩa sớm, tên tác phẩm hay tiểu sử ngoài DOCX để lấp coverage.

Thứ tự đề xuất:

1. **Khôi phục chi tiết bị lược:** rà soát 9 revision R01–R09, đặc biệt nguồn mở rộng và lời đáp persona; giữ draft, không thay revision cũ.
2. **Bổ sung 10 ý hỏi cốt lõi:** N01, N02, N06–N12, N19 (lực lượng, địa bàn, bối cảnh trong nước, chuẩn bị, diễn biến, bài học).
3. **Bổ sung 7 ý hỏi bối cảnh/tiểu sử:** N03–N05, N13–N16 theo mức ưu tiên học tập.
4. **Đối chiếu nguồn rồi mới quyết định 2 ý hỏi:** N17/N18. Nếu chưa có căn cứ diễn đạt an toàn, tiếp tục để gap có lý do.
5. **Đánh giá cách hỏi độc lập:** soạn bộ câu hỏi tự nhiên/ngoài phạm vi/phủ định, review aliases và đo exact, top-3 suggestions, wrong-answer/abstention riêng. Sau khi được phép mới import/review/publish qua workflow hiện có.

## 7. Ma trận toàn bộ đơn vị kiến thức

Mã qNNN trong bảng là `cmtt45-qNNN`. Cột trạng thái là toàn đơn vị trên toàn tài liệu, có thể khác trạng thái giới hạn theo mục. Locator `body/N` là chỉ số XML body zero-based, **không phải số trang**. Các ô bảng giữ đường dẫn row/cell; JSON chứa nguyên văn nguồn, facets, evidence và lý do cho từng đơn vị.

| ID | Đơn vị | Mục | Nguồn | Câu đối ứng | Phân loại |
| --- | --- | --- | --- | --- | --- |
| K001 | Tính chất giải phóng dân tộc của Cách mạng tháng Tám | I | body/3 | q001 | covered |
| K002 | Lực lượng lãnh đạo chung | I, V, VII, IX, X | body/3, body/6, body/75, body/110, body/135, body/168, body/170 | q001, q027, q031, q039 | covered |
| K003 | Các lực lượng nhân dân tham gia | I, VI | body/3, body/7, body/124 | q001, q009, q029 | partially_covered |
| K004 | Chấm dứt bộ máy thân Nhật và thống trị phát xít Nhật | I, VI | body/3, body/115 | q001, q028 | covered |
| K005 | Sụp đổ chế độ quân chủ nhà Nguyễn | I, IV, VI | body/3, body/63, body/116, body/122 | q001, q018, q028, q029 | covered |
| K006 | Chính quyền về tay nhân dân trên cả nước | I, IV, VI | body/3, body/9, body/65, body/117 | q019, q028 | covered |
| K007 | Ra đời nước Việt Nam Dân chủ Cộng hòa | I, IV, VI, IX | body/4, body/10, body/66, body/118, body/164 | q002, q020, q028, q037 | covered |
| K008 | Bước ngoặt từ thuộc địa sang độc lập và người dân làm chủ | I, VI, X | body/4, body/121, body/122, body/170 | q002, q029 | covered |
| K009 | Thời gian cao trào tổng khởi nghĩa | I, IX | body/5, body/164 | q037 | covered |
| K010 | Kết hợp chính trị và vũ trang | I, IV, V, VIII, IX | body/8, body/71, body/106, body/107, body/158, body/159, body/166 | q021, q025, q036 | covered |
| K011 | Kết hợp khởi nghĩa nông thôn và thành thị | I | body/8 | — | uncovered |
| K012 | Sự kiện đọc Tuyên ngôn Độc lập | I, IV, IX | body/10, body/66, body/164 | q020, q037 | covered |
| K013 | Chiến tranh thế giới thứ hai bùng nổ và bối cảnh 1939–1945 | II | body/13, body/14 | — | uncovered |
| K014 | Đức tấn công Liên Xô | II | body/15 | — | uncovered |
| K015 | Nhật mở rộng chiến tranh châu Á – Thái Bình Dương | II | body/16 | — | uncovered |
| K016 | Hai mốc đầu hàng của Nhật | II, IV, VII | body/17, body/55, body/142 | q003, q013 | covered |
| K017 | Nhật thất bại tạo thời cơ giải phóng | II, IV, VII, IX | body/18, body/55, body/56, body/142, body/165 | q013, q032 | partially_covered |
| K018 | Nhật vào Đông Dương và bộ máy Pháp cùng tồn tại | II | body/20 | — | uncovered |
| K019 | Cuộc đảo chính Nhật – Pháp | II, III, V | body/21, body/43, body/80 | q004, q022 | covered |
| K020 | Chỉ thị ngày 12/3/1945 | II, V | body/22, body/80 | q005 | covered |
| K021 | Nạn đói cuối 1944 – đầu 1945 và tác động chính trị | II | body/23 | — | uncovered |
| K022 | Mâu thuẫn dân tộc với đế quốc, phát xít | II | body/25 | q006 | covered |
| K023 | Nhiệm vụ giải phóng dân tộc và tập hợp lực lượng | II, VIII | body/26, body/151, body/150 | q006, q009 | covered |
| K024 | Chuẩn bị lâu dài tạo thế và lực, không thắng lợi ngẫu nhiên | III, VII, VIII, X | body/28, body/52, body/136, body/146, body/147, body/148, body/153, body/172 | q031, q033, q034, q025, q039 | covered |
| K025 | Chuyển hướng chiến lược giai đoạn 1939–1941 | III | body/29, body/30, body/31, body/33 | q007, q009 | covered |
| K026 | Hội nghị Trung ương tháng 11/1939 | III | body/31 | q007 | covered |
| K027 | Nguyễn Ái Quốc về nước | III | body/32 | q008 | covered |
| K028 | Hội nghị Trung ương 8 hoàn chỉnh chuyển hướng | III | body/33 | q009 | partially_covered |
| K029 | Việt Minh tập hợp đại đoàn kết dân tộc | III, VII | body/34, body/137 | q009, q031 | covered |
| K030 | Phát triển tổ chức cứu quốc 1941–1944 | III | body/35, body/36, body/37 | — | uncovered |
| K031 | Xây dựng căn cứ Cao Bằng | III | body/35, body/38 | — | uncovered |
| K032 | Du kích và lực lượng vũ trang giai đoạn 1941–1944 | III | body/35, body/39 | — | uncovered |
| K033 | Đào tạo cán bộ và phương án khởi nghĩa 1941–1944 | III | body/35, body/40 | — | uncovered |
| K034 | Thành lập Đội Việt Nam Tuyên truyền Giải phóng quân | III, V | body/41, body/102, body/109/row/4/cell/2/1 | q010, q025 | covered |
| K035 | Cao trào kháng Nhật tháng 3–8/1945 sau đảo chính | III | body/42, body/43 | q005 | partially_covered |
| K036 | Tuyên truyền và vận động chống Nhật | III | body/45 | q011 | covered |
| K037 | Phát triển lực lượng trong cao trào kháng Nhật | III | body/46 | q011 | covered |
| K038 | Phá kho thóc giải quyết nạn đói | III | body/47 | q011 | covered |
| K039 | Mở rộng căn cứ chuẩn bị tổng khởi nghĩa | III | body/48 | q011 | covered |
| K040 | Khởi nghĩa từng phần | III | body/49 | q011 | covered |
| K041 | Hội nghị quân sự cách mạng Bắc Kỳ | III | body/50 | — | uncovered |
| K042 | Khu giải phóng Việt Bắc | III | body/51 | q012 | covered |
| K043 | Khủng hoảng bộ máy Nhật và chính quyền thân Nhật | IV, VII | body/55, body/143 | q013, q032 | covered |
| K044 | Khoảng thời cơ trước khi quân Đồng minh vào | IV, VII | body/56, body/144 | q013, q032 | covered |
| K045 | Ủy ban Khởi nghĩa toàn quốc ra đời | IV, V | body/57, body/81, body/109/row/1/cell/2/1 | q014, q022 | covered |
| K046 | Ban bố Quân lệnh số 1 | IV, V | body/57, body/81 | q014, q022 | covered |
| K047 | Hội nghị toàn quốc của Đảng ở Tân Trào | IV | body/58 | q015 | covered |
| K048 | Quốc dân Đại hội và Ủy ban Dân tộc giải phóng | IV | body/59 | q016 | covered |
| K049 | Địa phương khởi nghĩa ngày 14–18/8 | IV | body/61 | — | uncovered |
| K050 | Khởi nghĩa Hà Nội | IV | body/62, body/67 | q017 | covered |
| K051 | Khởi nghĩa Huế | IV | body/63, body/67 | q018 | covered |
| K052 | Khởi nghĩa Sài Gòn | IV, V | body/64, body/67, body/89 | q019 | covered |
| K053 | Mốc 28/8 và kiện toàn Chính phủ lâm thời | IV | body/65 | — | uncovered |
| K054 | Diễn biến nhanh, rộng cả ba miền | IV | body/69, body/70 | q021 | covered |
| K055 | Hành động chủ động và quần chúng làm nền tảng | IV, VI | body/72, body/73, body/123, body/124 | q021, q029 | covered |
| K056 | Đặt vai trò cá nhân trong sức mạnh tập thể | V, VIII, IX | body/75, body/110, body/155, body/168, body/154 | q027, q038 | covered |
| K057 | Tiểu sử cơ bản và cương vị Trường Chinh | V | body/77 | q022 | partially_covered |
| K058 | Trường Chinh hoạch định đường lối và chỉ đạo toàn quốc | V, IX, X | body/79, body/83, body/109/row/1/cell/1/1, body/167, body/171, body/76, body/109/row/1/cell/0/1 | q022, q038 | covered |
| K059 | Trường Chinh chủ trì hội nghị sau đảo chính | V | body/80 | q022 | partially_covered |
| K060 | Đóng góp tư tưởng, lý luận của Trường Chinh | V | body/82 | q022 | covered |
| K061 | Tiểu sử và địa bàn hoạt động Lê Duẩn | V | body/85, body/84, body/109/row/2/cell/0/1, body/111 | q023, q038 | partially_covered |
| K062 | Lê Duẩn xây dựng cơ sở, vận động ở miền Nam theo thời kỳ | V | body/87, body/109/row/2/cell/1/1, body/111 | q023, q038 | partially_covered |
| K063 | Đặc thù và lực lượng cách mạng Nam Bộ | V | body/86, body/88, body/89 | — | uncovered |
| K064 | Không gán Lê Duẩn chỉ huy khởi nghĩa Nam Bộ/toàn quốc | V, IX, X | body/90, body/109/row/2/cell/2/1, body/111, body/167, body/171 | q023, q038, q001, q027 | covered |
| K065 | Lê Duẩn bị giam và trở về sau thắng lợi | V, IX, X | body/111, body/167, body/171 | q023, q038 | covered |
| K066 | Tiểu sử cơ bản Phạm Văn Đồng | V | body/92 | — | uncovered |
| K067 | Phạm Văn Đồng làm công tác chính trị, tổ chức | V, IX, X | body/94, body/98, body/109/row/3/cell/1/1, body/167, body/171, body/91, body/109/row/3/cell/0/1 | q024, q038 | covered |
| K068 | Phạm Văn Đồng trong Ủy ban Dân tộc giải phóng | V | body/95, body/96, body/109/row/3/cell/2/1 | q024, q016 | partially_covered |
| K069 | Phạm Văn Đồng làm Bộ trưởng Tài chính | V | body/97 | q024 | covered |
| K070 | Tiểu sử cơ bản Võ Nguyên Giáp | V | body/100 | q025, q040 | partially_covered |
| K071 | Võ Nguyên Giáp xây lực lượng, đào tạo, căn cứ | V | body/103 | q025 | covered |
| K072 | Võ Nguyên Giáp tổ chức, thống nhất lực lượng trong cao trào | V | body/104 | q025 | partially_covered |
| K073 | Võ Nguyên Giáp đọc Quân lệnh và tiến về Thái Nguyên | V | body/105 | q025, q026 | covered |
| K074 | Quân sự hỗ trợ phong trào và địa bàn cách mạng | V | body/106 | q025, q036 | partially_covered |
| K075 | Đóng góp quân sự nổi bật của Võ Nguyên Giáp | V, IX, X | body/107, body/109/row/4/cell/1/1, body/167, body/171, body/99, body/109/row/4/cell/0/1 | q025, q040 | covered |
| K076 | Tổng khởi nghĩa không chỉ là chiến dịch quân sự | V, IX | body/107, body/166 | q025 | covered |
| K077 | Cơ sở chính trị – pháp lý của nhà nước độc lập | VI | body/118 | q028 | partially_covered |
| K078 | Độc lập phải tiếp tục bảo vệ | VI | body/119, body/127, body/128 | q028, q029 | covered |
| K079 | Nội dung xây dựng nhà nước mới | VI | body/125, body/126 | q029 | partially_covered |
| K080 | Cổ vũ phong trào giải phóng dân tộc quốc tế | VI | body/130 | q030 | covered |
| K081 | Góp phần tan rã hệ thống thuộc địa cũ | VI | body/131 | q030 | covered |
| K082 | Khẳng định quyền tự quyết | VI | body/132 | q030 | covered |
| K083 | Lãnh đạo đúng và quyết định khởi nghĩa kịp thời | VII, X | body/135, body/170, body/172 | q031, q039 | partially_covered |
| K084 | Tinh thần yêu nước và ý chí đấu tranh | VII | body/138 | q031 | covered |
| K085 | Chớp thời cơ Nhật đầu hàng | VII | body/139, body/147 | q013, q021, q031, q033 | covered |
| K086 | Chiến tranh thế giới đi đến kết thúc | VII | body/141 | q032 | covered |
| K087 | Quan hệ chủ quan – khách quan | VII, IX, X | body/146, body/147, body/148, body/165, body/170, body/172 | q033, q039 | covered |
| K088 | Bài học tổ chức, chuẩn bị lực lượng từ sớm | VIII | body/152, body/153 | q034 | covered |
| K089 | Bài học đánh giá và hành động trong thời cơ ngắn | VIII | body/156, body/157 | q035 | covered |
| K090 | Lãnh đạo thống nhất và chủ động địa phương | VIII | body/160, body/161 | — | uncovered |
| K091 | Phân biệt tổng khởi nghĩa và Quốc khánh | IX | body/164 | q037 | covered |
| K092 | Phân biệt vai trò bốn nhân vật | IX, X | body/167, body/171 | q038, q039 | covered |

## 8. Ánh xạ ngược đủ 40 câu hiện có

| Câu | Canonical question | Đơn vị có chứng cứ nội dung |
| --- | --- | --- |
| q001 | Cách mạng tháng Tám năm 1945 là cuộc cách mạng gì? | K001, K002, K003, K004, K005, K064 |
| q002 | Thắng lợi Cách mạng tháng Tám mở ra bước ngoặt nào? | K007, K008 |
| q003 | Nhật Bản tuyên bố đầu hàng và ký văn kiện đầu hàng vào những ngày nào? | K016 |
| q004 | Nhật đảo chính Pháp ở Đông Dương vào ngày nào? | K019 |
| q005 | Chỉ thị Nhật – Pháp bắn nhau và hành động của chúng ta được ban hành khi nào? | K020, K035 |
| q006 | Mâu thuẫn cơ bản và nhiệm vụ cấp bách của cách mạng Việt Nam lúc bấy giờ là gì? | K022, K023 |
| q007 | Hội nghị Trung ương tháng 11/1939 xác định nhiệm vụ hàng đầu là gì? | K025, K026 |
| q008 | Nguyễn Ái Quốc trở về nước trực tiếp lãnh đạo cách mạng khi nào? | K027 |
| q009 | Hội nghị Trung ương lần thứ 8 và Việt Minh có ý nghĩa gì trong chuẩn bị cách mạng? | K003, K023, K025, K028, K029 |
| q010 | Ai trực tiếp tổ chức và chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân? | K034 |
| q011 | Cao trào kháng Nhật cứu nước có những hoạt động nổi bật nào? | K036, K037, K038, K039, K040 |
| q012 | Khu giải phóng Việt Bắc được thành lập khi nào? | K042 |
| q013 | Thời cơ tổng khởi nghĩa xuất hiện như thế nào trong tháng 8/1945? | K016, K017, K043, K044, K085 |
| q014 | Quân lệnh số 1 được ban bố khi nào? | K045, K046 |
| q015 | Hội nghị toàn quốc của Đảng tại Tân Trào tháng 8/1945 quyết định điều gì? | K047 |
| q016 | Quốc dân Đại hội tại Tân Trào tháng 8/1945 có những quyết định nào? | K048, K068 |
| q017 | Khởi nghĩa giành chính quyền ở Hà Nội thắng lợi ngày nào? | K050 |
| q018 | Khởi nghĩa giành chính quyền ở Huế thắng lợi ngày nào? | K005, K051 |
| q019 | Khởi nghĩa giành chính quyền ở Sài Gòn thắng lợi ngày nào? | K006, K052 |
| q020 | Ngày 2/9/1945 diễn ra sự kiện gì tại Ba Đình? | K007, K012 |
| q021 | Diễn biến Cách mạng tháng Tám có những đặc điểm nổi bật nào? | K010, K054, K055, K085 |
| q022 | Trường Chinh đóng góp như thế nào trong Cách mạng tháng Tám? | K019, K045, K046, K057, K058, K059, K060 |
| q023 | Tài liệu đính chính điều gì về vai trò của Lê Duẩn trong tháng 8/1945? | K061, K062, K064, K065 |
| q024 | Phạm Văn Đồng có vai trò gì trong Cách mạng tháng Tám và xây dựng chính quyền mới? | K067, K068, K069 |
| q025 | Võ Nguyên Giáp có những đóng góp nào trước và trong Cách mạng tháng Tám? | K010, K024, K034, K070, K071, K072, K073, K074, K075, K076 |
| q026 | Võ Nguyên Giáp đọc Quân lệnh số 1 khi nào? | K073 |
| q027 | Cần nhìn nhận đóng góp của bốn đồng chí trong quan hệ với những lực lượng nào? | K002, K056, K064 |
| q028 | Cách mạng tháng Tám giành được những kết quả căn bản nào? | K004, K005, K006, K007, K077, K078 |
| q029 | Cách mạng tháng Tám có ý nghĩa lịch sử gì đối với Việt Nam? | K003, K005, K008, K055, K078, K079 |
| q030 | Cách mạng tháng Tám có ý nghĩa quốc tế như thế nào? | K080, K081, K082 |
| q031 | Những nguyên nhân chủ quan nào dẫn đến thắng lợi Cách mạng tháng Tám? | K002, K024, K029, K083, K084, K085 |
| q032 | Những nguyên nhân khách quan nào dẫn đến thắng lợi Cách mạng tháng Tám? | K017, K043, K044, K086 |
| q033 | Nguyên nhân chủ quan và khách quan có quan hệ thế nào trong thắng lợi tháng Tám? | K024, K085, K087 |
| q034 | Bài học xây dựng lực lượng từ sớm được trình bày như thế nào? | K024, K088 |
| q035 | Bài học chủ động nhận định và chớp thời cơ là gì? | K089 |
| q036 | Bài học kết hợp đấu tranh chính trị với đấu tranh vũ trang là gì? | K010, K074 |
| q037 | Cách mạng tháng Tám và Quốc khánh 2/9 khác nhau như thế nào? | K007, K009, K012, K091 |
| q038 | Vì sao không được đồng nhất vai trò của bốn đồng chí? | K056, K058, K061, K062, K064, K065, K067, K092 |
| q039 | Tài liệu kết luận như thế nào về Cách mạng tháng Tám? | K002, K024, K083, K087, K092 |
| q040 | Bảng tổng hợp ghi trọng tâm đóng góp và điểm cần nhớ về Võ Nguyên Giáp là gì? | K070, K075 |

Không có câu nào bị bỏ khỏi đối chiếu. Một câu có thể có nhiều đơn vị; một đơn vị có thể xuất hiện ở nhiều câu nhưng toàn tài liệu chỉ tính một lần.

## 9. JSON và kiểm tra tính toàn vẹn

`knowledge/coverage-audit.json` là artifact phân tích, `artifactType=knowledge_coverage_audit`, `doNotImportAsKnowledge=true`, `humanReviewRequired=true`; **không đúng schema draft để import**. Các nhóm dữ liệu:

- `inputFingerprints`, `scope`, `methodology`: snapshot, nguồn, phạm vi và công thức.
- `units[].facets`: claim, source block IDs, câu hỗ trợ neutral/persona, phần thiếu và đề xuất.
- `sections[].assessments`: các facets thực sự thuộc từng mục và phân loại riêng tại mục.
- `questionEvidence`, `sourceBlocks`, `sourceBlockDisposition`: nội dung đối chiếu và xử lý đủ 189 blocks.
- `summary`, `proposals`, `proposalSummary`, `expressionAudit`, `warningReview`: chỉ số, kế hoạch đề xuất, probe matcher và cảnh báo.

Kiểm tra đã thực hiện: DOCX tái trích khớp manifest; 40/40 revision 3 draft; 160/160 persona khớp nội dung/template hiện hành; mọi unit/facet/source/question/proposal ID có tham chiếu hợp lệ; không block nguồn nào chưa được giải trình; đủ 40 câu trong ánh xạ ngược; số liệu phân loại/công thức tính lại từ JSON; mọi input giữ nguyên SHA-256 trước/sau. Không chạy build/test ứng dụng vì không sửa code runtime.

Tạo hai deliverable: báo cáo này và JSON. Helper phân tích local `.local/knowledge-coverage-audit.mjs` chứa chú giải ngữ nghĩa thủ công, chỉ đọc input và sinh hai artifact; không nằm trong đường chạy ứng dụng. JSON tiếp tục được ignore theo quy tắc private knowledge của dự án, không đưa vào public/PWA. Không chỉnh tài liệu nguồn, draft, review report, pipeline, env, DB hoặc tính năng hiện có.

### SHA-256 input

| File | SHA-256 |
| --- | --- |
| docs/source/Tong-hop-kien-thuc.docx | e6e605448defbca119fcd114682fd61604a0cf2ba48d6dfd614fd91c8223ec7b |
| knowledge/draft-questions-phase-2-v3.json | 88eadd13039a5a87d4c1c871ed8f75c49aa36990ddef4e2cbbb642eabaec1dba |
| knowledge/review-report-phase-2.md | 00330722f10475bf315f535f02577877cce31cb8345d85d8333bd2f2e0c3483a |
| docs/knowledge-pipeline.md | 4cc311cb026c1f42f578943fffbd77d7ba26e83e4e7deaea22f272404aafb566 |
| knowledge/extraction-manifest.json | 4e783bcad9fdd2d8b9356b3856f19054c877d599660b48fee69c94f35685a254 |

Các quyết định ngữ nghĩa trong audit cần người quản trị có chuyên môn xem lại trước khi dùng làm kế hoạch biên tập cuối cùng. Các tỷ lệ là coverage của snapshot đã nêu, không chứng nhận sự thật lịch sử và không thay quy trình approve/publish.
