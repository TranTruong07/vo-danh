# -*- coding: utf-8 -*-
"""
Rebuild Data for Section III: Vai trò của bốn nhân vật trong chuẩn bị và lãnh đạo Cách mạng
Contains 7 proposed units:
- III-CHINH
- III-GIAP-TRAINING
- III-DONG-PREP
- III-VIET-1937
- III-VIET-1941
- III-VIET-1943
- III-VIET-1945
(Note: III-VIET-SOUTH is held for source review due to R03/R10)
"""

SECTION_3_DATA = [
    # 19. III-CHINH (III.1)
    {
        "key": "III-CHINH",
        "sectionId": "III.1",
        "canonicalQuestion": "Vai trò chính trị, đường lối và tổ chức của Trường Chinh trong quá trình chuẩn bị Tổng khởi nghĩa được thể hiện như thế nào?",
        "aliases": [
            "Những đóng góp chủ yếu của Tổng Bí thư Trường Chinh trước và trong Cách mạng tháng Tám là gì?",
            "Trường Chinh có vai trò gì trong việc lãnh đạo đường lối và tổ chức Tổng khởi nghĩa?",
            "Vị trí và nhiệm vụ của Trường Chinh trong Ủy ban Khởi nghĩa toàn quốc là gì?"
        ],
        "approvedAnswer": "Trường Chinh là Tổng Bí thư Đảng Cộng sản Đông Dương trong giai đoạn trước và trong Cách mạng tháng Tám. Ông tham gia lãnh đạo Đảng chuẩn bị lực lượng, chỉ đạo phong trào kháng Nhật cứu nước sau ngày 9/3/1945, tham gia Hội nghị toàn quốc của Đảng tại Tân Trào (13–15/8/1945), nhấn mạnh yêu cầu hành động nhanh chóng không bỏ lỡ thời cơ, tham gia lãnh đạo phát động Tổng khởi nghĩa và trực tiếp phụ trách Ủy ban Khởi nghĩa toàn quốc. Ông có vai trò đặc biệt quan trọng ở phương diện chính trị, đường lối và tổ chức, chuyển nhận định tình hình thành chủ trương hành động cụ thể.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu khắc họa rất sâu sắc vai trò của đồng chí Trường Chinh: trên cương vị Tổng Bí thư, đồng chí lãnh đạo Đảng chuẩn bị lực lượng, chỉ đạo phong trào kháng Nhật sau ngày 9/3/1945, dự Hội nghị Tân Trào, nhấn mạnh không bỏ lỡ thời cơ, tham gia phát động Tổng khởi nghĩa và trực tiếp phụ trách Ủy ban Khởi nghĩa toàn quốc. Vai trò của đồng chí đặc biệt quan trọng ở phương diện chính trị, đường lối và tổ chức.",
            "hoang-quoc-viet": "Anh em và đồng bào đều ghi nhận công lao của đồng chí Tổng Bí thư Trường Chinh: đồng chí cùng Trung ương lãnh đạo chuẩn bị lực lượng, chỉ đạo cao trào kháng Nhật sau đảo chính 9/3, dự Hội nghị Tân Trào, kiên quyết chủ trương hành động nhanh không lỡ thời cơ, trực tiếp phụ trách Ủy ban Khởi nghĩa toàn quốc. Đó là người chỉ huy mẫu mực trên mặt trận chính trị và đường lối.",
            "truong-chinh": "Tư liệu lịch sử phản ánh trung thực trọng trách của tôi trước Đảng và dân tộc: với trách nhiệm Tổng Bí thư Đảng Cộng sản Đông Dương, tôi cùng Trung ương lãnh đạo chuẩn bị lực lượng cách mạng, chỉ đạo phong trào kháng Nhật sau ngày 9/3/1945, dự Hội nghị Tân Trào từ 13 đến 15/8/1945, quán triệt nguyên tắc hành động khẩn trương không bỏ lỡ thời cơ, và trực tiếp phụ trách Ủy ban Khởi nghĩa toàn quốc để chuyển hóa nhận định chiến lược thành chủ trương hành động giành chính quyền.",
            "vo-nguyen-giap": "Dưới góc độ phối hợp chiến lược: đồng chí Tổng Bí thư Trường Chinh giữ vai trò lãnh đạo tối cao về chính trị, đường lối và tổ chức Tổng khởi nghĩa. Đồng chí chỉ đạo phong trào sau ngày 9/3/1945, dự Hội nghị Tân Trào, yêu cầu hành động kịp thời, trực tiếp phụ trách Ủy ban Khởi nghĩa toàn quốc và cùng Trung ương chỉ đạo phát động Tổng khởi nghĩa trên toàn quốc."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "III.1",
            "excerpt": "Vị trí: Tổng Bí thư Đảng Cộng sản Đông Dương trong giai đoạn trước và trong Cách mạng tháng Tám.\nNhững đóng góp chủ yếu:\nTham gia lãnh đạo Đảng trong quá trình chuẩn bị lực lượng cách mạng.\nCùng Trung ương Đảng chỉ đạo phong trào kháng Nhật cứu nước sau ngày 9/3/1945.\nTham gia Hội nghị toàn quốc của Đảng tại Tân Trào từ ngày 13 đến 15/8/1945.\nNhấn mạnh yêu cầu phải hành động nhanh chóng, không bỏ lỡ thời cơ.\nTham gia lãnh đạo việc phát động Tổng khởi nghĩa trên cả nước.\nTrực tiếp phụ trách Ủy ban Khởi nghĩa toàn quốc.\nVai trò của Trường Chinh đặc biệt quan trọng ở phương diện chính trị, đường lối và tổ chức.\nÔng góp phần chuyển những nhận định về tình hình quốc tế và trong nước thành chủ trương hành động cụ thể để giành chính quyền.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/78", "body/79", "body/80", "body/81", "body/82", "body/83", "body/84", "body/85", "body/86", "body/87", "body/88"],
            "paragraphIndex": 78
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 20. III-GIAP-TRAINING (III.2)
    {
        "key": "III-GIAP-TRAINING",
        "sectionId": "III.2",
        "canonicalQuestion": "Võ Nguyên Giáp đã có những đóng góp gì trong công tác xây dựng lực lượng vũ trang và đào tạo cán bộ trước Tổng khởi nghĩa?",
        "aliases": [
            "Vai trò của Võ Nguyên Giáp trong đào tạo cán bộ tại Trường Quân chính kháng Nhật là gì?",
            "Võ Nguyên Giáp tham gia công tác quân sự và huấn luyện cán bộ trước Cách mạng tháng Tám ra sao?",
            "Những đóng góp quân sự của Võ Nguyên Giáp trong giai đoạn chuẩn bị Tổng khởi nghĩa gồm những gì?"
        ],
        "approvedAnswer": "Võ Nguyên Giáp là cán bộ lãnh đạo quân sự của cách mạng. Những đóng góp của ông gồm: trực tiếp tổ chức và chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân năm 1944, tham gia xây dựng lực lượng vũ trang cách mạng, được giao phụ trách quân sự trong Ủy ban Chỉ huy lâm thời Khu giải phóng, và tham gia tổ chức Trường Quân chính kháng Nhật để đào tạo cán bộ.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu ghi nhận những cống hiến nền tảng của đồng chí Võ Nguyên Giáp: với vai trò cán bộ lãnh đạo quân sự, đồng chí trực tiếp tổ chức và chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân năm 1944, xây dựng lực lượng vũ trang, phụ trách quân sự trong Ủy ban Chỉ huy lâm thời Khu giải phóng, và tham gia tổ chức Trường Quân chính kháng Nhật để đào tạo đội ngũ cán bộ cách mạng.",
            "hoang-quoc-viet": "Bà con và đồng chí thấy rõ tâm huyết của anh Văn: đồng chí Võ Nguyên Giáp trực tiếp lập và chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân năm 1944, xây dựng lực lượng vũ trang từ nhân dân, phụ trách quân sự Khu giải phóng, và đặc biệt tham gia mở Trường Quân chính kháng Nhật để rèn luyện cán bộ cho phong trào khởi nghĩa.",
            "truong-chinh": "Về mặt xây dựng lực lượng nòng cốt cho khởi nghĩa vũ trang: đồng chí Võ Nguyên Giáp giữ vai trò cán bộ lãnh đạo quân sự của cách mạng, trực tiếp tổ chức và chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân năm 1944, phụ trách quân sự trong Ủy ban Chỉ huy lâm thời Khu giải phóng và tham gia tổ chức Trường Quân chính kháng Nhật nhằm đào tạo đội ngũ cán bộ chỉ huy thực tiễn.",
            "vo-nguyen-giap": "Theo phân công của Trung ương và Bác Hồ: với tư cách cán bộ lãnh đạo quân sự, tôi trực tiếp tổ chức và chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân năm 1944, tham gia xây dựng lực lượng vũ trang, phụ trách quân sự trong Ủy ban Chỉ huy lâm thời Khu giải phóng và tham gia tổ chức Trường Quân chính kháng Nhật để đào tạo cán bộ đáp ứng yêu cầu tác chiến."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "III.2",
            "excerpt": "Vị trí: Cán bộ lãnh đạo quân sự của cách mạng.\nNhững đóng góp:\nTrực tiếp tổ chức và chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân năm 1944.\nTham gia xây dựng lực lượng vũ trang cách mạng.\nĐược giao phụ trách quân sự trong Ủy ban Chỉ huy lâm thời Khu giải phóng.\nTham gia tổ chức Trường Quân chính kháng Nhật để đào tạo cán bộ.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/89", "body/90", "body/91", "body/92", "body/93", "body/94", "body/95"],
            "paragraphIndex": 89
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 21. III-DONG-PREP (III.3)
    {
        "key": "III-DONG-PREP",
        "sectionId": "III.3",
        "canonicalQuestion": "Phạm Văn Đồng đã tham gia những hoạt động chuẩn bị căn cứ và cán bộ nào trong năm 1945 trước Tổng khởi nghĩa?",
        "aliases": [
            "Những hoạt động của Phạm Văn Đồng tại căn cứ Tân Trào năm 1945 là gì?",
            "Phạm Văn Đồng đóng góp gì vào việc xây dựng Khu giải phóng và đào tạo cán bộ năm 1945?",
            "Vai trò của Phạm Văn Đồng trước Cách mạng tháng Tám được tài liệu ghi nhận thế nào?"
        ],
        "approvedAnswer": "Phạm Văn Đồng là cán bộ lãnh đạo cách mạng, hoạt động trong hệ thống lãnh đạo và tổ chức Việt Minh. Những hoạt động quan trọng trong năm 1945 gồm: hoạt động tại căn cứ cách mạng Tân Trào, tham gia xây dựng Khu giải phóng, tham gia công tác đào tạo cán bộ tại Trường Quân chính kháng Nhật, và tham dự Hội nghị toàn quốc của Đảng từ ngày 13 đến 15/8/1945.",
        "characterAnswers": {
            "pham-van-dong": "Theo tư liệu ghi chép lại: trên cương vị cán bộ lãnh đạo cách mạng hoạt động trong hệ thống Mặt trận Việt Minh, trong năm 1945 tôi hoạt động tại căn cứ Tân Trào, cùng các đồng chí tham gia xây dựng Khu giải phóng, tham gia đào tạo cán bộ tại Trường Quân chính kháng Nhật và dự Hội nghị toàn quốc của Đảng từ ngày 13 đến 15/8/1945.",
            "hoang-quoc-viet": "Bà con và đồng chí cùng nhớ lại những ngày ở căn cứ: đồng chí Phạm Văn Đồng là cán bộ lãnh đạo hoạt động trong Mặt trận Việt Minh, bám sát căn cứ Tân Trào năm 1945, tham gia dựng xây Khu giải phóng, bồi dưỡng cán bộ tại Trường Quân chính kháng Nhật và dự Hội nghị toàn quốc của Đảng từ 13 đến 15/8/1945.",
            "truong-chinh": "Về mặt chuẩn bị nhân sự và tổ chức cơ quan lãnh đạo: đồng chí Phạm Văn Đồng hoạt động trong hệ thống lãnh đạo và tổ chức Việt Minh, bám trụ căn cứ Tân Trào trong năm 1945, tích cực tham gia xây dựng Khu giải phóng, giảng dạy đào tạo cán bộ tại Trường Quân chính kháng Nhật và tham dự Hội nghị toàn quốc của Đảng từ 13 đến 15/8/1945.",
            "vo-nguyen-giap": "Dưới góc độ phối hợp tại chiến khu Tân Trào: đồng chí Phạm Văn Đồng hoạt động trong hệ thống lãnh đạo Việt Minh, sát cánh cùng chúng tôi xây dựng Khu giải phóng năm 1945, tham gia công tác đào tạo cán bộ tại Trường Quân chính kháng Nhật và tham dự Hội nghị toàn quốc của Đảng từ ngày 13 đến 15/8/1945."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "III.3",
            "excerpt": "Vị trí: Cán bộ lãnh đạo cách mạng, hoạt động trong hệ thống lãnh đạo và tổ chức Việt Minh.\nNhững hoạt động quan trọng:\nHoạt động tại căn cứ cách mạng Tân Trào trong năm 1945.\nTham gia xây dựng Khu giải phóng.\nTham gia công tác đào tạo cán bộ tại Trường Quân chính kháng Nhật.\nTham dự Hội nghị toàn quốc của Đảng từ ngày 13 đến 15/8/1945.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/101", "body/102", "body/103", "body/104", "body/105", "body/106", "body/107"],
            "paragraphIndex": 101
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 22. III-VIET-1937 (III.4)
    {
        "key": "III-VIET-1937",
        "sectionId": "III.4",
        "canonicalQuestion": "Hoàng Quốc Việt được cử giữ chức vụ gì vào năm 1937 trong tiến trình hoạt động cách mạng?",
        "aliases": [
            "Năm 1937, Hoàng Quốc Việt được Đảng giao đảm nhiệm trọng trách nào?",
            "Vào năm 1937, chức vụ của Hoàng Quốc Việt là gì?",
            "Hoàng Quốc Việt được cử làm Bí thư Xứ ủy Bắc Kỳ vào năm nào?"
        ],
        "approvedAnswer": "Năm 1937, Hoàng Quốc Việt được cử làm Bí thư Xứ ủy Bắc Kỳ.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu lịch sử ghi nhận mốc hoạt động phong trào: vào năm 1937, đồng chí Hoàng Quốc Việt đã được Đảng tin cậy cử làm Bí thư Xứ ủy Bắc Kỳ, trực tiếp lãnh đạo phong trào đấu tranh của quần chúng.",
            "hoang-quoc-viet": "Theo tư liệu ghi nhận về quá trình hoạt động của tôi: vào năm 1937, tôi được tổ chức Đảng tín nhiệm cử làm Bí thư Xứ ủy Bắc Kỳ để cùng anh em gây dựng phong trào cách mạng trong công nhân và quần chúng lao động.",
            "truong-chinh": "Về mặt bố trí cán bộ lãnh đạo địa bàn trọng yếu: năm 1937, đồng chí Hoàng Quốc Việt được cử làm Bí thư Xứ ủy Bắc Kỳ, đóng góp tích cực vào công tác xây dựng tổ chức Đảng và vận động quần chúng ở miền Bắc.",
            "vo-nguyen-giap": "Theo biên niên hoạt động cách mạng: năm 1937, đồng chí Hoàng Quốc Việt được Đảng cử làm Bí thư Xứ ủy Bắc Kỳ, phụ trách phong trào quần chúng và củng cố cơ sở cách mạng thời kỳ Mặt trận Dân chủ."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "III.4",
            "excerpt": "Năm 1937, được cử làm Bí thư Xứ ủy Bắc Kỳ.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/112", "body/113", "body/114", "body/115"],
            "paragraphIndex": 112
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 23. III-VIET-1941 (III.4)
    {
        "key": "III-VIET-1941",
        "sectionId": "III.4",
        "canonicalQuestion": "Hoàng Quốc Việt đã tham gia hoạt động nào tại Hội nghị Trung ương tháng 5/1941?",
        "aliases": [
            "Tại Hội nghị Trung ương lần thứ 8 tháng 5/1941, Hoàng Quốc Việt có vai trò gì?",
            "Tháng 5/1941, Hoàng Quốc Việt tham gia cơ quan lãnh đạo nào của Đảng?",
            "Sự kiện Hoàng Quốc Việt tham gia Ban Chấp hành Trung ương diễn ra vào thời gian nào?"
        ],
        "approvedAnswer": "Tháng 5/1941, Hoàng Quốc Việt tham dự Hội nghị Trung ương lần thứ 8 và tham gia Ban Chấp hành Trung ương.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi lại dấu mốc quan trọng: vào tháng 5/1941, đồng chí Hoàng Quốc Việt đã tham dự Hội nghị Trung ương lần thứ 8 và được bầu tham gia Ban Chấp hành Trung ương Đảng.",
            "hoang-quoc-viet": "Theo ghi chép của tài liệu lịch sử: vào tháng 5/1941, tôi vinh dự tham dự Hội nghị Trung ương lần thứ 8 tại Pác Bó và tham gia Ban Chấp hành Trung ương Đảng để gánh vác nhiệm vụ cách mạng.",
            "truong-chinh": "Về việc kiện toàn cơ quan lãnh đạo cao nhất của Đảng tại Hội nghị Trung ương 8: tháng 5/1941, đồng chí Hoàng Quốc Việt tham dự Hội nghị Trung ương lần thứ 8 và tham gia Ban Chấp hành Trung ương, cùng Trung ương hoạch định đường lối giải phóng dân tộc.",
            "vo-nguyen-giap": "Dưới góc độ tổ chức lãnh đạo tại căn cứ Cao Bằng: tháng 5/1941, đồng chí Hoàng Quốc Việt tham dự Hội nghị Trung ương lần thứ 8 và tham gia Ban Chấp hành Trung ương Đảng để chỉ đạo phong trào cả nước."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "III.4",
            "excerpt": "Tháng 5/1941, tham dự Hội nghị Trung ương lần thứ 8 và tham gia Ban Chấp hành Trung ương.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/112", "body/113", "body/114", "body/115", "body/116"],
            "paragraphIndex": 112
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 24. III-VIET-1943 (III.4)
    {
        "key": "III-VIET-1943",
        "sectionId": "III.4",
        "canonicalQuestion": "Hoàng Quốc Việt được giao trọng trách nào trong Tổng bộ Việt Minh vào năm 1943?",
        "aliases": [
            "Năm 1943, Hoàng Quốc Việt giữ chức vụ gì trong Tổng bộ Việt Minh?",
            "Ai được giao trọng trách quyền Bí thư Tổng bộ Việt Minh vào năm 1943?",
            "Vào năm 1943, Hoàng Quốc Việt đảm nhận chức vụ lãnh đạo nào của Mặt trận Việt Minh?"
        ],
        "approvedAnswer": "Năm 1943, Hoàng Quốc Việt được giao trọng trách quyền Bí thư Tổng bộ Việt Minh.",
        "characterAnswers": {
            "pham-van-dong": "Theo tư liệu ghi chép về công tác Mặt trận: vào năm 1943, đồng chí Hoàng Quốc Việt đã được giao trọng trách quyền Bí thư Tổng bộ Việt Minh, chỉ đạo công tác tập hợp lực lượng đại đoàn kết.",
            "hoang-quoc-viet": "Theo tư liệu ghi nhận nhiệm vụ của tôi lúc bấy giờ: năm 1943, tôi được Đảng và Mặt trận giao trọng trách quyền Bí thư Tổng bộ Việt Minh để lo việc vận động các đoàn thể cứu quốc.",
            "truong-chinh": "Về mặt tăng cường vai trò lãnh đạo Mặt trận: năm 1943, đồng chí Hoàng Quốc Việt được giao trọng trách quyền Bí thư Tổng bộ Việt Minh, trực tiếp đôn đốc công tác phát triển các hội Cứu quốc trong quần chúng.",
            "vo-nguyen-giap": "Dưới góc độ xây dựng thực lực chính trị cho Tổng khởi nghĩa: năm 1943, đồng chí Hoàng Quốc Việt được giao trọng trách quyền Bí thư Tổng bộ Việt Minh, giữ vai trò quan trọng trong việc mở rộng mạng lưới cơ sở Việt Minh."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "III.4",
            "excerpt": "Năm 1943, được giao trọng trách quyền Bí thư Tổng bộ Việt Minh.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/112", "body/113", "body/114", "body/115", "body/116", "body/117"],
            "paragraphIndex": 112
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 25. III-VIET-1945 (III.4)
    {
        "key": "III-VIET-1945",
        "sectionId": "III.4",
        "canonicalQuestion": "Tại Hội nghị toàn quốc của Đảng tháng 8/1945, Hoàng Quốc Việt được bầu vào cơ quan nào và cùng Trung ương làm nhiệm vụ gì?",
        "aliases": [
            "Hoàng Quốc Việt được bầu làm Ủy viên Thường vụ Trung ương vào thời điểm nào?",
            "Tháng 8/1945, Hoàng Quốc Việt đảm nhận chức vụ gì tại Hội nghị toàn quốc của Đảng?",
            "Cơ quan lãnh đạo mà Hoàng Quốc Việt được bầu vào tháng 8/1945 là cơ quan nào?"
        ],
        "approvedAnswer": "Tháng 8/1945, tại Hội nghị toàn quốc của Đảng, Hoàng Quốc Việt được bầu làm Ủy viên Thường vụ Trung ương, cùng Trung ương Đảng tham gia lãnh đạo Tổng khởi nghĩa.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi lại bước kiện toàn cơ quan đầu não: tháng 8/1945, tại Hội nghị toàn quốc của Đảng, đồng chí Hoàng Quốc Việt được bầu làm Ủy viên Thường vụ Trung ương, cùng Trung ương Đảng tham gia lãnh đạo Tổng khởi nghĩa thắng lợi.",
            "hoang-quoc-viet": "Theo tư liệu lịch sử ghi nhận: vào tháng 8/1945, tại Hội nghị toàn quốc của Đảng họp ở Tân Trào, tôi được bầu làm Ủy viên Thường vụ Trung ương, cùng các đồng chí trong Trung ương Đảng gánh vác trọng trách lãnh đạo Tổng khởi nghĩa trên cả nước.",
            "truong-chinh": "Về mặt củng cố Thường vụ Trung ương để lãnh đạo khởi nghĩa: tháng 8/1945, tại Hội nghị toàn quốc của Đảng ở Tân Trào, đồng chí Hoàng Quốc Việt được bầu làm Ủy viên Thường vụ Trung ương, cùng tập thể Trung ương trực tiếp chỉ đạo Tổng khởi nghĩa giành chính quyền.",
            "vo-nguyen-giap": "Dưới góc độ cơ quan chỉ đạo tác chiến và khởi nghĩa toàn quốc: tháng 8/1945, tại Hội nghị toàn quốc của Đảng, đồng chí Hoàng Quốc Việt được bầu làm Ủy viên Thường vụ Trung ương, cùng Trung ương Đảng tham gia lãnh đạo Tổng khởi nghĩa thần tốc."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "III.4",
            "excerpt": "Tháng 8/1945, tại Hội nghị toàn quốc của Đảng, được bầu làm Ủy viên Thường vụ Trung ương.\nCùng Trung ương Đảng tham gia lãnh đạo Tổng khởi nghĩa.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/112", "body/113", "body/114", "body/115", "body/116", "body/117", "body/118", "body/119"],
            "paragraphIndex": 112
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    }
]

