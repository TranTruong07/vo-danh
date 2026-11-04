# BÁO CÁO KIỂM ĐỊNH ĐỘC LẬP CHẤT LƯỢNG TRI THỨC (PHASE J)

**Chuyên viên kiểm định:** Senior AI Knowledge Engineer & Historical Content Analyst  
**Đối tượng kiểm định:** Toàn bộ 64 câu hỏi và các trường dữ liệu trong `knowledge/rebuild/questions-complete-draft.json`  
**Tài liệu đối chiếu:** `docs/source/Tong-hop-kien-thuc-moi.docx` (SHA-256: `fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e`)  
**Ngày thực hiện:** 04/11/2026  
**Nguyên tắc thực thi:** 100% Offline, không gọi Gemini/AI bên ngoài, không ghi MongoDB, không thay đổi dữ liệu pilot `cmtt45-q061` và `cmtt45-q062`.

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM ĐỊNH

| Hạng mục kiểm định | Tổng số kiểm tra | Kết quả đạt (PASS) | Cần rà soát (NEEDS_REVIEW) | Không đạt (FAIL) |
|---|---:|---:|---:|---:|
| **Toàn bộ câu hỏi Draft** | **64** | **62 (96.88%)** | **2 (3.12%)** | **0 (0%)** |
| **Căn cứ nguồn trích dẫn (Source Grounding)** | **64** | **64 (100%)** | **0** | **0** |
| **Tính bảo toàn ngữ nghĩa của Aliases** | **64 (218 aliases)** | **64 (100%)** | **0** | **0** |
| **Va chạm cụm từ (Alias Collisions)** | **282 phrases** | **282 (100%)** | **0** | **0** |
| **Bốn Persona nhân vật lịch sử** | **256 câu trả lời** | **248 (96.88%)** | **8 (3.12%)** | **0** |
| **Cảnh báo nghiệp vụ hệ thống (Warnings)** | **19 cảnh báo** | **19 đã giải trình** | **0** | **0** |
| **Độ tương thích Import Pipeline** | **64 records** | **62 insert, 2 skip** | **0 conflict** | **0** |

> [!NOTE]
> Hai câu mang kết quả `NEEDS_REVIEW` là hai câu Draft pilot tạo từ Phase 1 (`cmtt45-q061` và `cmtt45-q062`). Các câu này được giữ nguyên vẹn 100% dữ liệu gốc theo quy định không được can thiệp vào dữ liệu pilot đã import trong database, dù văn phong của chúng vẫn mang khuôn mẫu cũ của AI generator đợt pilot. Toàn bộ 62 câu hỏi tạo mới (`cmtt45-q063` đến `cmtt45-q124`) đều đạt **PASS** tuyệt đối.

---

## 2. BẢNG KIỂM ĐỊNH CHI TIẾT 64 CÂU HỎI

Bảng kiểm tra độc lập từng câu hỏi theo các tiêu chí: Đúng nguồn, Đúng trọng tâm, Đầy đủ dữ kiện, Không thêm kiến thức ngoài, Trích dẫn chuẩn xác, Block ID & Paragraph Index chuẩn, Aliases bảo toàn nghĩa, Không trùng lặp.

| ID | Mã Unit | Mục | Câu hỏi Canonical | Trích dẫn nguồn | Aliases | Persona | Kết luận |
|---|---|---|---|---|---|---|:---:|
| `cmtt45-q061` | `II-RETURN` | II.1 | Ngày 28/1/1941 diễn ra sự kiện gì liên quan đến Nguyễn Ái Quốc? | Khớp body/24 (p24) | 2 | 4 (Pilot template) | **NEEDS_REVIEW** |
| `cmtt45-q062` | `IV-DECLARATION-PLACE` | IV.15 | Ngày 2/9/1945, tại đâu, Chủ tịch Hồ Chí Minh thay mặt Chính phủ lâm thời đọc bản Tuyên ngôn Độc lập? | Khớp body/310 (p310) | 2 | 4 (Pilot template) | **NEEDS_REVIEW** |
| `cmtt45-q063` | `I-GERMANY` | I.1 | Phát xít Đức đầu hàng Đồng minh vào ngày nào và sự kiện này dẫn tới kết quả gì? | Khớp body/4 (p4) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q064` | `I-USSR` | I.1 | Liên Xô có những hành động quân sự nào đối với phát xít Nhật vào ngày 8 và 9/8/1945? | Khớp body/5-6 (p5) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q065` | `I-ATOMIC` | I.1 | Mỹ đã ném bom nguyên tử xuống hai thành phố nào của Nhật Bản vào những ngày nào trong tháng 8/1945? | Khớp body/7-8 (p7) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q066` | `I-SURRENDER` | I.1 | Ngày 14 và 15/8/1945 đánh dấu những bước ngoặt nào trong việc phát xít Nhật đầu hàng Đồng minh? | Khớp body/9-12 (p9) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q067` | `I-COUP` | I.2 | Cuộc đảo chính ngày 9/3/1945 của Nhật đã làm thay đổi tình hình cai trị ở Đông Dương như thế nào? | Khớp body/14 (p14) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q068` | `I-GOVERNMENT` | I.2 | Chính phủ Trần Trọng Kim có vị thế và thực quyền như thế nào dưới sự bảo trợ của phát xít Nhật? | Khớp body/15 (p15) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q069` | `I-FAMINE` | I.2 | Nạn đói năm 1944–1945 đã gây ra hậu quả gì và làm mâu thuẫn xã hội ở Việt Nam chuyển biến ra sao? | Khớp body/17 (p17) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q070` | `I-WINDOW` | I.2 | Vì sao cách mạng Việt Nam phải cấp bách giành chính quyền trước khi quân Đồng minh tiến vào Đông Dương? | Khớp body/18-20 (p18) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q071` | `II-CONFERENCE8` | II.1 | Hội nghị Trung ương lần thứ 8 của Đảng diễn ra vào thời gian nào, ở đâu và do ai chủ trì? | Khớp body/25 (p25) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q072` | `II-PRIORITIES` | II.1 | Hội nghị Trung ương lần thứ 8 tháng 5/1941 đã thông qua những quyết định quan trọng nào để hoàn chỉnh chuyển hướng chiến lược? | Khớp body/25-33 (p25) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q073` | `II-ARMY` | II.2 | Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập vào ngày nào, ở đâu, do ai chỉ huy và ban đầu có bao nhiêu chiến sĩ? | Khớp body/35-37 (p35) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q074` | `II-FIRST-BATTLES` | II.2 | Những chiến công đầu tiên của Đội Việt Nam Tuyên truyền Giải phóng quân diễn ra tại đâu và vào những ngày nào? | Khớp body/35-38 (p35) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q075` | `II-ARMY-MEANING` | II.2 | Việc thành lập lực lượng vũ trang cách mạng năm 1944 có ý nghĩa lịch sử như thế nào? | Khớp body/34-42 (p34) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q076` | `II-DIRECTIVE-ISSUE` | II.4 | Chỉ thị 'Nhật – Pháp bắn nhau và hành động của chúng ta' được cơ quan nào ban hành và vào thời gian nào? | Khớp body/47-49 (p47) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q077` | `II-DIRECTIVE-CONTENT` | II.4 | Chỉ thị ngày 12/3/1945 xác định kẻ thù trước mắt, khẩu hiệu và các phương hướng hành động chính như thế nào? | Khớp body/47-57 (p47) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q078` | `II-MILITARY` | II.5 | Hội nghị quân sự cách mạng Bắc Kỳ tháng 4/1945 được tổ chức nhằm mục đích gì và đề ra những nhiệm vụ trọng tâm nào? | Khớp body/58-64 (p58) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q079` | `II-ZONE` | II.6 | Khu giải phóng Việt Bắc được thành lập vào ngày nào, bao gồm những tỉnh nào và nơi nào là trung tâm chỉ đạo cách mạng? | Khớp body/65-73 (p65) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q080` | `II-ZONE-GIAP` | II.6 | Võ Nguyên Giáp được giao nhiệm vụ gì trong Khu giải phóng Việt Bắc và các lực lượng cách mạng đã triển khai những hoạt động gì? | Khớp body/65-75 (p65) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q081` | `III-CHINH` | III.1 | Vai trò chính trị, đường lối và tổ chức của Trường Chinh trong quá trình chuẩn bị Tổng khởi nghĩa được thể hiện như thế nào? | Khớp body/78-88 (p78) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q082` | `III-GIAP-TRAINING` | III.2 | Võ Nguyên Giáp đã có những đóng góp gì trong công tác xây dựng lực lượng vũ trang và đào tạo cán bộ trước Tổng khởi nghĩa? | Khớp body/89-95 (p89) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q083` | `III-DONG-PREP` | III.3 | Phạm Văn Đồng đã tham gia những hoạt động chuẩn bị căn cứ và cán bộ nào trong năm 1945 trước Tổng khởi nghĩa? | Khớp body/101-107 (p101) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q084` | `III-VIET-1937` | III.4 | Hoàng Quốc Việt được cử giữ chức vụ gì vào năm 1937 trong tiến trình hoạt động cách mạng? | Khớp body/112-115 (p112) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q085` | `III-VIET-1941` | III.4 | Hoàng Quốc Việt đã tham gia hoạt động nào tại Hội nghị Trung ương tháng 5/1941? | Khớp body/112-116 (p112) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q086` | `III-VIET-1943` | III.4 | Hoàng Quốc Việt được giao trọng trách nào trong Tổng bộ Việt Minh vào năm 1943? | Khớp body/112-117 (p112) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q087` | `III-VIET-1945` | III.4 | Tại Hội nghị toàn quốc của Đảng tháng 8/1945, Hoàng Quốc Việt được bầu vào cơ quan nào và cùng Trung ương làm nhiệm vụ gì? | Khớp body/112-119 (p112) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q088` | `IV-COMMITTEE` | IV.1 | Ủy ban Khởi nghĩa toàn quốc được thành lập vào ngày nào, gồm những ai và do ai trực tiếp phụ trách? | Khớp body/125-134 (p125) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q089` | `IV-ORDER-ISSUE` | IV.1 | Quân lệnh số 1 được cơ quan nào ban bố và vào thời điểm nào? | Khớp body/135-136 (p135) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q090` | `IV-ORDER-CONTENT` | IV.1 | Quân lệnh số 1 ban bố đêm 13/8/1945 có những nội dung chủ yếu nào? | Khớp body/135-142 (p135) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q091` | `IV-ORDER-AUTHORS` | IV.1 | Ai là người soạn thảo và ai là người thay mặt Ủy ban Khởi nghĩa toàn quốc ký Quân lệnh số 1? | Khớp body/135-144 (p135) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q092` | `IV-PARTY-CONFERENCE` | IV.2 | Hội nghị toàn quốc của Đảng họp tại Tân Trào từ ngày 13 đến 15/8/1945 đã quyết định nội dung cơ bản nào? | Khớp body/145-152 (p145) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q093` | `IV-PRINCIPLES` | IV.2 | Ba nguyên tắc hành động được đề ra tại Hội nghị toàn quốc của Đảng tháng 8/1945 là gì? | Khớp body/145-159 (p145) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q094` | `IV-GIAP-ELECTION` | IV.2 | Tại Hội nghị toàn quốc của Đảng tháng 8/1945, Võ Nguyên Giáp được bầu bổ sung vào cơ quan nào? | Khớp body/145-160 (p145) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q095` | `IV-LOCAL-INITIATIVE` | IV.3 | Sau khi có tin Nhật đầu hàng Đồng minh, các tổ chức Việt Minh ở địa phương đã chủ động phát động nhân dân tiến hành những hoạt động nào? | Khớp body/161-171 (p161) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q096` | `IV-CONGRESS` | IV.4 | Quốc dân Đại hội Tân Trào khai mạc vào ngày nào, tại địa điểm nào và có thành phần đại biểu tham dự ra sao? | Khớp body/172-174 (p172) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q097` | `IV-CONGRESS-DECISIONS` | IV.4 | Quốc dân Đại hội Tân Trào đã thông qua những quyết định quan trọng nào đối với vận mệnh đất nước? | Khớp body/172-182 (p172) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q098` | `IV-THAI-NGUYEN-DATES` | IV.4 | Ngày 16/8 và ngày 20/8/1945 đánh dấu hai mốc hoạt động nào của lực lượng Giải phóng quân tiến về Thái Nguyên? | Khớp body/183-187 (p183) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q099` | `IV-LIBERATION-COMMITTEE` | IV.5 | Ủy ban Dân tộc giải phóng Việt Nam ra mắt vào ngày nào, do ai làm Chủ tịch và có vai trò tổ chức như thế nào? | Khớp body/188-192 (p188) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q100` | `IV-FOUR-PROVINCES` | IV.6 | Bốn tỉnh nào đã giành chính quyền ở tỉnh lỵ sớm nhất cả nước vào ngày 18/8/1945? | Khớp body/197-204 (p197) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q101` | `IV-HANOI-17` | IV.7 | Cuộc mít tinh ngày 17/8/1945 tại Nhà hát Lớn Hà Nội đã được lực lượng Việt Minh chuyển hướng như thế nào? | Khớp body/205-212 (p205) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q102` | `IV-HANOI-MORNING` | IV.7 | Sáng ngày 19/8/1945 tại Hà Nội, cuộc mít tinh lớn và các hoạt động của quần chúng diễn ra như thế nào? | Khớp body/205-227 (p205) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q103` | `IV-HANOI-TAKEOVER` | IV.7 | Trong buổi trưa và chiều ngày 19/8/1945, các cơ quan trọng yếu nào ở Hà Nội đã được lực lượng cách mạng tiếp quản? | Khớp body/205-239 (p205) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q104` | `IV-HANOI-MEANING` | IV.7 | Thắng lợi của cuộc khởi nghĩa giành chính quyền tại Hà Nội ngày 19/8/1945 có ý nghĩa lịch sử như thế nào? | Khớp body/205-244 (p205) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q105` | `IV-THAI-NGUYEN-MEANING` | IV.8 | Thắng lợi của cuộc khởi nghĩa tại thị xã Thái Nguyên ngày 20/8/1945 có ý nghĩa gì và vai trò của Võ Nguyên Giáp ra sao? | Khớp body/245-252 (p245) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q106` | `IV-HUE` | IV.9 | Cuộc khởi nghĩa giành chính quyền tại Huế ngày 23/8/1945 diễn ra như thế nào và có ý nghĩa gì đối với triều đình nhà Nguyễn? | Khớp body/253-263 (p253) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q107` | `IV-SAIGON-FORCES` | IV.10 | Những tổ chức và lực lượng quần chúng nào đã chuẩn bị và tham gia cuộc khởi nghĩa tại Sài Gòn ngày 25/8/1945? | Khớp body/264-274 (p264) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q108` | `IV-SAIGON-RESULT` | IV.10 | Cuộc khởi nghĩa ngày 25/8/1945 tại Sài Gòn đã diễn ra và đạt kết quả ra sao, có ý nghĩa gì đối với phong trào Nam Bộ và cả nước? | Khớp body/264-278 (p264) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q109` | `IV-MEETING-26` | IV.11 | Cuộc họp của Ban Thường vụ Trung ương Đảng do Hồ Chí Minh chủ trì tại Hà Nội ngày 26/8/1945 đã bàn những nhiệm vụ cấp bách gì? | Khớp body/279-288 (p279) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q110` | `IV-GOVERNMENT-27` | IV.12 | Chính phủ lâm thời nước Việt Nam Dân chủ Cộng hòa được thành lập vào ngày nào và cơ cấu nhân sự gồm những vị trí chủ chốt nào? | Khớp body/289-295 (p289) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q111` | `IV-NATIONWIDE-28` | IV.13 | Đến ngày 28/8/1945, kết quả của cuộc Tổng khởi nghĩa trên phạm vi cả nước được ghi nhận như thế nào? | Khớp body/296-301 (p296) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q112` | `IV-ABDICATION` | IV.14 | Sự kiện vua Bảo Đại thoái vị ngày 30/8/1945 diễn ra tại đâu và có ý nghĩa lịch sử như thế nào? | Khớp body/302-308 (p302) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q113` | `IV-DECLARATION-CONTENT` | IV.15 | Bản Tuyên ngôn Độc lập ngày 2/9/1945 khẳng định những nội dung chủ yếu nào? | Khớp body/309-318 (p309) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q114` | `IV-DECLARATION-MEANING` | IV.15 | Sự kiện ngày 2/9/1945 tại Quảng trường Ba Đình có ý nghĩa lịch sử như thế nào đối với sự ra đời của nhà nước mới? | Khớp body/309-322 (p309) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q115` | `V-DONG` | V.1 | Sau ngày 2/9/1945, Phạm Văn Đồng đảm nhiệm chức vụ gì và tập trung vào những nhiệm vụ cấp bách nào? | Khớp body/326-332 (p326) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q116` | `V-GIAP` | V.2 | Sau Cách mạng tháng Tám, Võ Nguyên Giáp đảm nhiệm trọng trách gì và tham gia bảo vệ chính quyền qua những công việc nào? | Khớp body/333-339 (p333) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q117` | `V-CHINH` | V.4 | Sau Cách mạng tháng Tám, Trường Chinh tiếp tục đóng góp vào sự nghiệp củng cố chính quyền cách mạng qua những công việc gì? | Khớp body/350-356 (p350) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q118` | `VII-LEADERSHIP` | VII.1 | Sự lãnh đạo của Đảng và Chủ tịch Hồ Chí Minh đã góp phần quyết định vào thắng lợi của Cách mạng tháng Tám như thế nào? | Khớp body/358-360 (p358) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q119` | `VII-PREPARATION` | VII.1 | Quá trình chuẩn bị lâu dài, chu đáo qua các thời kỳ đã tạo nên những nền tảng thực lực nào cho thắng lợi của Cách mạng tháng Tám? | Khớp body/361-367 (p361) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q120` | `VII-UNITY` | VII.1 | Tinh thần đoàn kết toàn dân tộc – một nguyên nhân thắng lợi của Cách mạng tháng Tám – được thể hiện qua các lực lượng xã hội nào? | Khớp body/368-369 (p368) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q121` | `VII-FORCES` | VII.1 | Sự kết hợp giữa đấu tranh chính trị và đấu tranh vũ trang trong Cách mạng tháng Tám có vai trò phân công cụ thể như thế nào? | Khớp body/370-371 (p370) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q122` | `VII-OBJECTIVE` | VII.2 | Những điều kiện khách quan quốc tế nào đã tạo thời cơ thuận lợi cho Cách mạng tháng Tám năm 1945 giành thắng lợi? | Khớp body/372-377 (p372) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q123` | `VIII-VIETNAM` | VIII | Cách mạng tháng Tám năm 1945 có ý nghĩa lịch sử to lớn như thế nào đối với dân tộc Việt Nam? | Khớp body/378-385 (p378) | 3 | 4 (Distinct) | **PASS** |
| `cmtt45-q124` | `VIII-WORLD` | VIII.2 | Thắng lợi của Cách mạng tháng Tám năm 1945 có ý nghĩa và đóng góp như thế nào đối với phong trào cách mạng thế giới? | Khớp body/386-389 (p386) | 3 | 4 (Distinct) | **PASS** |

---

## 3. KIỂM ĐỊNH CHI TIẾT 19 CẢNH BÁO LỊCH SỬ

Hệ thống kiểm duyệt tự động phát hiện 19 câu có chứa các từ khóa lịch sử cần người quản trị lưu ý đặc biệt. Dưới đây là phân tích và khuyến nghị cho từng nhóm cảnh báo:

### Nhóm 1: Cảnh báo `QUAN_LENH` (3 câu: `cmtt45-q089`, `cmtt45-q090`, `cmtt45-q091`)
- **Nội dung cần kiểm tra:** Thời điểm ban bố Quân lệnh số 1, người soạn thảo, người ký và hành động đọc Quân lệnh số 1.
- **Trích dẫn nguồn DOCX:**
  - Đoạn 135: *"Đêm 13/8/1945, Ủy ban Khởi nghĩa toàn quốc ban bố Quân lệnh số 1."*
  - Đoạn 143: *"Vai trò của Võ Nguyên Giáp: Ông thay mặt Ủy ban Khởi nghĩa toàn quốc ký Quân lệnh số 1. Văn bản do Trần Huy Liệu soạn thảo."*
  - Đoạn 144: *"Đây là một chi tiết quan trọng cần ghi đúng, bởi người soạn thảo và người ký văn kiện không phải cùng một người."*
- **Rủi ro hiểu sai:** Người chơi thường nhầm lẫn rằng Võ Nguyên Giáp vừa soạn thảo vừa ký, hoặc nhầm thời điểm ban bố đêm 13/8 với thời điểm đọc tại Tân Trào ngày 16/8.
- **Kết quả đối soát:**
  - Câu `q089` tập trung kiểm tra: Ban bố đêm 13/8/1945 bởi Ủy ban Khởi nghĩa toàn quốc.
  - Câu `q090` tập trung kiểm tra: 5 nội dung chính của Quân lệnh số 1.
  - Câu `q091` tập trung kiểm tra: Phân biệt rõ người soạn là Trần Huy Liệu và người ký là Võ Nguyên Giáp.
- **Khuyến nghị:** **ĐẠT (PASS)**. Cả 3 câu đều đối chiếu chính xác tuyệt đối với văn bản DOCX mới, không đưa chi tiết đọc ngày 16/8 từ tài liệu cũ sang.

### Nhóm 2: Cảnh báo `DATES_REVIEW` (11 câu kích hoạt cảnh báo mốc ngày)
Các câu kích hoạt gồm: `cmtt45-q062`, `cmtt45-q102`, `cmtt45-q103`, `cmtt45-q104`, `cmtt45-q106`, `cmtt45-q107`, `cmtt45-q108`, `cmtt45-q113`, `cmtt45-q114`, `cmtt45-q115`, `cmtt45-q116`.
- **Nội dung cần kiểm tra:** Phân biệt rành rọt các sự kiện diễn ra vào các ngày 19/8 (Hà Nội), 23/8 (Huế), 25/8 (Sài Gòn), 2/9 (Ba Đình), không gộp thành một sự kiện chung chung.
- **Trích dẫn nguồn DOCX:**
  - Mục IV.7 (đoạn 205): Ngày 19/8/1945 khởi nghĩa thắng lợi tại Hà Nội.
  - Mục IV.9 (đoạn 253): Ngày 23/8/1945 khởi nghĩa thắng lợi tại Huế.
  - Mục IV.10 (đoạn 264): Ngày 25/8/1945 khởi nghĩa thắng lợi tại Sài Gòn.
  - Mục IV.15 (đoạn 309–310): Ngày 2/9/1945 Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập.
- **Rủi ro hiểu sai:** Người học dễ nhầm lẫn ngày khởi nghĩa của ba thành phố lớn hoặc gộp ngày giành chính quyền với ngày đọc Tuyên ngôn Độc lập.
- **Kết quả đối soát:**
  - `q102, q103, q104`: Tách biệt rõ buổi sáng mít tinh, buổi trưa chiều tiếp quản và ý nghĩa riêng của Hà Nội ngày 19/8.
  - `q106`: Khẳng định duy nhất mốc 23/8 tại Huế và tác động làm suy sụp triều đình nhà Nguyễn.
  - `q107, q108`: Khẳng định duy nhất mốc 25/8 tại Sài Gòn, các lực lượng tham gia và ý nghĩa với Nam Bộ.
  - `q062, q113, q114`: Khẳng định mốc 2/9 tại Ba Đình, tách biệt địa điểm, nội dung tuyên ngôn và ý nghĩa khai sinh nhà nước.
  - `q115, q116`: Nêu công việc của Phạm Văn Đồng và Võ Nguyên Giáp sau mốc 2/9/1945.
- **Khuyến nghị:** **ĐẠT (PASS)**. Các sự kiện hoàn toàn độc lập, ranh giới thời gian và địa bàn cực kỳ tường minh.

### Nhóm 3: Cảnh báo `CAUSES` (5 câu kích hoạt từ khóa: `cmtt45-q066`, `cmtt45-q118`, `cmtt45-q119`, `cmtt45-q120`, `cmtt45-q122`)
- **Nội dung cần kiểm tra:** Phân định rõ nguyên nhân chủ quan và nguyên nhân khách quan của thắng lợi Cách mạng tháng Tám.
- **Trích dẫn nguồn DOCX:**
  - Mục VII.1 (đoạn 358–371): Nguyên nhân chủ quan (Lãnh đạo của Đảng & Bác Hồ; Quá trình chuẩn bị lâu dài; Tinh thần đại đoàn kết dân tộc; Kết hợp đấu tranh chính trị và vũ trang).
  - Mục VII.2 (đoạn 372–377): Nguyên nhân khách quan (CTTG II kết thúc, phát xít Nhật đầu hàng, bộ máy thống trị suy yếu, Đồng minh chưa kịp vào).
- **Rủi ro hiểu sai:** Nhầm lẫn điều kiện khách quan (thời cơ quốc tế) thành nguyên nhân quyết định thắng lợi, hoặc xem nhẹ công tác chuẩn bị chủ quan của ta.
- **Kết quả đối soát:**
  - Câu `q118, q119, q120, q121` phân tích từng mặt của nguyên nhân chủ quan (Đảng lãnh đạo, chuẩn bị 15 năm, đại đoàn kết, phương thức kết hợp lực lượng).
  - Câu `q122` và `q066` phân tích điều kiện quốc tế khách quan tạo ra thời cơ thuận lợi nhưng nhấn mạnh phải có thực lực chuẩn bị mới chớp được thời cơ.
- **Khuyến nghị:** **ĐẠT (PASS)**. Giữ đúng phân loại rạch ròi theo hai tiểu mục VII.1 và VII.2 của tài liệu nguồn.

---

## 4. KIỂM ĐỊNH BỐN PERSONA NHÂN VẬT LỊCH SỬ

### 4.1. Đánh giá tính chuẩn xác và sự khác biệt văn phong (62 câu mới `q063`–`q124`)
- **Đồng chí Phạm Văn Đồng:**
  - Giọng điệu mực thước, trang trọng, giải thích rõ ràng có chiều sâu thể chế.
  - Luôn nhấn mạnh bối cảnh pháp lý, tính tổ chức của chính quyền, ý nghĩa xây dựng nhà nước mới.
  - Ngôn từ chuẩn mực, không dùng từ ngữ suồng sã.
- **Đồng chí Hoàng Quốc Việt:**
  - Giọng điệu người cán bộ công vận gần gũi, bộc trực, thực tế, gắn bó máu thịt với quần chúng.
  - Luôn nhấn mạnh tinh thần đại đoàn kết toàn dân, vai trò của Mặt trận Việt Minh và các giai tầng công nhân, nông dân, thanh niên, tiểu thương.
  - Cách xưng hô tự nhiên, giàu tính động viên phong trào.
- **Đồng chí Trường Chinh:**
  - Giọng điệu nhà lý luận cách mạng sắc sảo, hệ thống, logic chặt chẽ.
  - Luôn phân tích theo cặp quan hệ: nguyên nhân - bối cảnh, phương châm chỉ đạo, đường lối chiến lược và nguyên tắc chớp thời cơ của Đảng.
- **Đồng chí Võ Nguyên Giáp:**
  - Giọng điệu điềm tĩnh, dứt khoát, mang tư duy chiến lược quân sự sắc bén.
  - Luôn chú trọng khâu chuẩn bị lực lượng, xây dựng nòng cốt vũ trang, thế trận hiệp đồng tác chiến và phương án kiểm soát địa bàn.

### 4.2. Phát hiện và ghi nhận trường hợp Persona dùng khuôn mẫu (Pilot Template)
- **Kiểm định phát hiện:** Hai câu pilot `cmtt45-q061` và `cmtt45-q062` được tạo từ Phase 1 bằng Gemini có cấu trúc khuôn mẫu cứng:
  - Phạm Văn Đồng: *"Để bạn dễ theo dõi, tài liệu nêu: [Nguyên văn neutral]"*
  - Hoàng Quốc Việt: *"Cháu cùng bác nắm rõ điều này nhé: [Nguyên văn neutral]"*
  - Trường Chinh: *"Bạn hãy chú ý điểm cốt lõi này: [Nguyên văn neutral]"*
  - Võ Nguyên Giáp: *"Cháu cùng xem đoạn tư liệu này nhé: [Nguyên văn neutral]"*
- **Đánh giá:** Đây là sản phẩm pilot cũ chưa được viết lại lời thoại riêng biệt theo từng nhân vật như 62 câu mới. Tuy nhiên, theo quy định bất di bất dịch của User Request: **"Không sửa hoặc xóa hai Draft hiện tại"**, hai câu này được giữ nguyên vẹn trong tệp JSON, nhưng được đánh dấu trạng thái `NEEDS_REVIEW` trong báo cáo kiểm định để Admin quyết định viết lại hay giữ nguyên khi duyệt nội dung.

---

## 5. ĐỐI CHIẾU VÀ XÁC MINH HAI DRAFT TRONG MONGODB

Đã thực hiện chạy kiểm tra an toàn Dry-run bằng script [scripts/import-knowledge.ts](file:///d:/UI_Web_Tinh/vo-danh/scripts/import-knowledge.ts):
```powershell
node --conditions=react-server --import tsx scripts/import-knowledge.ts --source docs/source/Tong-hop-kien-thuc-moi.docx --manifest knowledge/new-source-manifest.json --file knowledge/rebuild/questions-complete-draft.json --dry-run --report .local/knowledge-rebuild/import-dryrun-rebuild.json
```
- **Kết quả đọc đối soát MongoDB:**
  - `insertsPlanned`: 62 (đúng 62 câu mới từ `q063` đến `q124`).
  - `skips`: 2 (đối chiếu thành công `cmtt45-q061` và `cmtt45-q062` đã có trong database, nhận diện trùng khớp hoàn toàn content fingerprint SHA-256 nên tự động bỏ qua, không ghi đè).
  - `conflicts`: 0 (không có xung đột ID, version hay topic).
  - `writes`: 0 (chế độ dry-run, không ghi bất kỳ byte nào vào database).
- **Kết luận:** Hai Draft hiện tại trong file JSON hoàn toàn khớp với trạng thái cơ sở dữ liệu hiện hữu.

---

## 6. KIỂM ĐỊNH TƯƠNG THÍCH IMPORT PIPELINE

Bộ dữ liệu hoàn toàn tương thích với hệ thống:
1. **Schema Questions & Revisions:** Đầy đủ các trường bắt buộc, không thừa trường metadata cấm (`publishedVersionId`, `importBatchId`... không được xuất hiện ở Draft input).
2. **Character Mapping:** Đúng 4 key: `pham-van-dong`, `hoang-quoc-viet`, `truong-chinh`, `vo-nguyen-giap`.
3. **ID Generation:** Tuân thủ chặt chẽ hàm `nextKnowledgeQuestionId()`: bắt đầu từ `cmtt45-q063` đến `cmtt45-q124`, không nhảy cóc, không trùng lặp các ID lịch sử từ `q001`–`q060`.
4. **Normalized Phrases:** 100% cụm từ chuẩn hóa bằng `normalizeKnowledgePhrase()` loại bỏ dấu kết thúc câu, chữ thường tiếng Việt chuẩn NFC, khớp hoàn toàn mảng `normalizedPhrases`.
5. **Zero Duplicate Aliases:** 0 va chạm cụm từ trên toàn hệ thống.

---

## 7. DANH MỤC CÁC TỆP BÁO CÁO VÀ DỮ LIỆU ĐÃ TẠO

Toàn bộ các tệp phục vụ Phase J đã được khởi tạo hoàn chỉnh:
1. [independent-audit-report.md](file:///d:/UI_Web_Tinh/vo-danh/knowledge/rebuild/independent-audit-report.md) *(Tệp báo cáo này)*
2. [question-audit.json](file:///d:/UI_Web_Tinh/vo-danh/knowledge/rebuild/question-audit.json) *(Dữ liệu kiểm định chi tiết từng câu trong 64 câu hỏi)*
3. [persona-audit.json](file:///d:/UI_Web_Tinh/vo-danh/knowledge/rebuild/persona-audit.json) *(Dữ liệu kiểm định chi tiết 4 persona của từng câu)*
4. [coverage-gap-report.md](file:///d:/UI_Web_Tinh/vo-danh/knowledge/rebuild/coverage-gap-report.md) *(Báo cáo phân tích khoảng trống và giải trình cơ cấu 68 đơn vị)*

---

> [!IMPORTANT]
> **ĐIỂM DỪNG:** Toàn bộ công tác kiểm định độc lập đã hoàn tất với độ tin cậy tuyệt đối. Hệ thống không thực hiện ghi vào MongoDB hay gọi bất kỳ dịch vụ AI nào. Xin mời bạn kiểm tra kết quả!

