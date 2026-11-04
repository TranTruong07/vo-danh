# -*- coding: utf-8 -*-
"""
Rebuild Data for Section I and Section II
Contains 18 units: 8 for Section I, 10 for Section II (II-RETURN is q061, existing)
"""

SECTIONS_1_2_DATA = [
    # 1. I-GERMANY
    {
        "key": "I-GERMANY",
        "sectionId": "I.1",
        "canonicalQuestion": "Phát xít Đức đầu hàng Đồng minh vào ngày nào và sự kiện này dẫn tới kết quả gì?",
        "aliases": [
            "Đức đầu hàng Đồng minh vô điều kiện vào thời gian nào?",
            "Ngày phát xít Đức ký văn kiện đầu hàng Đồng minh là ngày nào?",
            "Chiến tranh ở châu Âu kết thúc vào ngày nào gắn với sự kiện Đức đầu hàng?"
        ],
        "approvedAnswer": "Ngày 9/5/1945, phát xít Đức đầu hàng Đồng minh vô điều kiện, đánh dấu chiến tranh ở châu Âu chính thức kết thúc.",
        "characterAnswers": {
            "pham-van-dong": "Theo ghi chép lịch sử, vào ngày 9/5/1945, phát xít Đức đã buộc phải đầu hàng Đồng minh vô điều kiện. Sự kiện trọng đại này đánh dấu chiến tranh kết thúc tại châu Âu, mở ra bước ngoặt quyết định cho cục diện toàn thế giới.",
            "hoang-quoc-viet": "Bà con và anh em cần nhớ rõ mốc lịch sử này: ngày 9/5/1945, phát xít Đức đầu hàng Đồng minh vô điều kiện, chiến tranh tại châu Âu chấm dứt. Sào huyệt phát xít tan rã đã cổ vũ mạnh mẽ phong trào đấu tranh của quần chúng lao khổ khắp nơi.",
            "truong-chinh": "Về mặt diễn biến chiến lược, ngày 9/5/1945 phát xít Đức đầu hàng Đồng minh vô điều kiện, chiến tranh ở châu Âu kết thúc. Sự sụp đổ hoàn toàn của chủ nghĩa phát xít ở phương Tây đã trực tiếp đẩy phe Trục vào thế cô lập, tạo tiền đề cho thời cơ cách mạng ở phương Đông.",
            "vo-nguyen-giap": "Dưới góc độ quân sự toàn cầu, mốc then chốt là ngày 9/5/1945: phát xít Đức đầu hàng Đồng minh vô điều kiện, chiến tranh ở châu Âu kết thúc. Trung tâm phát xít bị đập tan, thế trận phe Trục sụp đổ, tạo điều kiện thuận lợi lớn cho chiến trường châu Á."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "I.1",
            "excerpt": "Ngày 9/5/1945: Phát xít Đức đầu hàng Đồng minh vô điều kiện, chiến tranh ở châu Âu kết thúc.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/4"],
            "paragraphIndex": 4
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 2. I-USSR
    {
        "key": "I-USSR",
        "sectionId": "I.1",
        "canonicalQuestion": "Liên Xô có những hành động quân sự nào đối với phát xít Nhật vào ngày 8 và 9/8/1945?",
        "aliases": [
            "Hồng quân Liên Xô tuyên chiến và tiến công quân Nhật vào thời gian nào?",
            "Ngày 8 và 9/8/1945 diễn ra sự kiện gì giữa Liên Xô và Nhật Bản?",
            "Liên Xô mở cuộc tiến công quân đội Nhật Bản ở Đông Bắc Á vào ngày nào?"
        ],
        "approvedAnswer": "Ngày 8/8/1945, Liên Xô tuyên chiến với Nhật Bản. Tiếp đó, ngày 9/8/1945, Hồng quân Liên Xô mở cuộc tiến công quân Nhật ở Đông Bắc Á.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi nhận rất rõ ràng hai bước đi liên tiếp: ngày 8/8/1945, Liên Xô chính thức tuyên chiến với Nhật Bản; ngay hôm sau, 9/8/1945, Hồng quân Liên Xô mở cuộc tiến công quân Nhật ở Đông Bắc Á, đẩy nhanh sự sụp đổ của quân phiệt Nhật.",
            "hoang-quoc-viet": "Hai ngày liên tiếp ghi dấu hành động dứt khoát: ngày 8/8/1945 Liên Xô tuyên chiến với Nhật Bản, rồi ngày 9/8/1945 Hồng quân Liên Xô mở cuộc tiến công quân Nhật ở Đông Bắc Á, giáng đòn sấm sét vào lực lượng quân phiệt đang chiếm đóng.",
            "truong-chinh": "Phân tích theo trình tự thời gian và bối cảnh: ngày 8/8/1945 Liên Xô tuyên chiến với Nhật Bản, và sang ngày 9/8/1945 Hồng quân Liên Xô mở cuộc tiến công quân Nhật ở Đông Bắc Á. Đòn tiến công chiến lược này làm thay đổi mau lẹ tương quan lực lượng, đẩy kẻ thù vào tình thế tuyệt vọng.",
            "vo-nguyen-giap": "Về mặt tác chiến chiến lược: ngày 8/8/1945 Liên Xô tuyên chiến với Nhật Bản; tiếp đó ngày 9/8/1945, Hồng quân Liên Xô mở cuộc tiến công quân Nhật ở Đông Bắc Á, đánh sập tập đoàn quân Quan Đông và làm tê liệt thế phòng ngự của quân phiệt Nhật."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "I.1",
            "excerpt": "Ngày 8/8/1945: Liên Xô tuyên chiến với Nhật Bản.\nNgày 9/8/1945: Hồng quân Liên Xô mở cuộc tiến công quân Nhật ở Đông Bắc Á.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/5", "body/6"],
            "paragraphIndex": 5
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 3. I-ATOMIC
    {
        "key": "I-ATOMIC",
        "sectionId": "I.1",
        "canonicalQuestion": "Mỹ đã ném bom nguyên tử xuống hai thành phố nào của Nhật Bản vào những ngày nào trong tháng 8/1945?",
        "aliases": [
            "Hai thành phố Hiroshima và Nagasaki của Nhật Bản bị ném bom nguyên tử vào các ngày nào?",
            "Mỹ ném bom nguyên tử xuống Hiroshima và Nagasaki vào thời gian nào?",
            "Mốc thời gian Mỹ ném bom nguyên tử xuống hai thành phố của Nhật Bản là khi nào?"
        ],
        "approvedAnswer": "Ngày 6/8/1945, Mỹ ném bom nguyên tử xuống Hiroshima; tiếp đó, ngày 9/8/1945, Mỹ ném bom nguyên tử xuống Nagasaki.",
        "characterAnswers": {
            "pham-van-dong": "Theo tư liệu lịch sử được ghi nhận: ngày 6/8/1945, Mỹ ném bom nguyên tử xuống Hiroshima; sau đó đến ngày 9/8/1945, Mỹ tiếp tục ném bom nguyên tử xuống Nagasaki. Những sự kiện này đã giáng đòn hủy diệt vào chính quốc Nhật Bản.",
            "hoang-quoc-viet": "Bà con cần ghi nhớ hai mốc ngày tàn khốc này: ngày 6/8/1945 Mỹ ném bom nguyên tử xuống thành phố Hiroshima, và đến ngày 9/8/1945 thì ném bom nguyên tử xuống thành phố Nagasaki của Nhật Bản.",
            "truong-chinh": "Về diễn biến quốc tế tác động đến cuộc chiến: ngày 6/8/1945 Mỹ ném bom nguyên tử xuống Hiroshima, và ngày 9/8/1945 ném bom nguyên tử xuống Nagasaki. Sự kiện dồn dập này đẩy nội bộ giới cầm quyền phát xít Nhật rơi vào khủng hoảng toàn diện.",
            "vo-nguyen-giap": "Trên phương diện hỏa lực và chiến tranh hiện đại: ngày 6/8/1945 Mỹ ném bom nguyên tử xuống Hiroshima, và ngày 9/8/1945 Mỹ ném bom nguyên tử xuống Nagasaki, làm tê liệt khả năng kháng cự và đẩy nhanh sự đầu hàng của đế quốc Nhật."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "I.1",
            "excerpt": "Ngày 6/8/1945: Mỹ ném bom nguyên tử xuống Hiroshima.\nNgày 9/8/1945: Mỹ ném bom nguyên tử xuống Nagasaki.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/7", "body/8"],
            "paragraphIndex": 7
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 4. I-SURRENDER
    {
        "key": "I-SURRENDER",
        "sectionId": "I.1",
        "canonicalQuestion": "Ngày 14 và 15/8/1945 đánh dấu những bước ngoặt nào trong việc phát xít Nhật đầu hàng Đồng minh?",
        "aliases": [
            "Nhật Bản chấp nhận đầu hàng và Nhật hoàng tuyên bố đầu hàng vào các ngày nào?",
            "Hai mốc ngày 14/8 và 15/8/1945 phản ánh diễn biến gì về sự đầu hàng của Nhật Bản?",
            "Quân phiệt Nhật chấp nhận và công bố đầu hàng Đồng minh vào thời điểm nào?"
        ],
        "approvedAnswer": "Ngày 14/8/1945, Nhật Bản chấp nhận các điều kiện đầu hàng của Đồng minh; ngày 15/8/1945, Nhật hoàng Hirohito phát thanh tuyên bố chấp nhận đầu hàng. Sự kiện này khiến quân Nhật tại Đông Dương rệu rã, chính quyền thân Nhật hoang mang, tạo điều kiện quốc tế đặc biệt thuận lợi cho cách mạng Việt Nam.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu phân định rất rành mạch: ngày 14/8/1945 Nhật Bản chấp nhận điều kiện đầu hàng của Đồng minh, và ngày 15/8/1945 Nhật hoàng Hirohito phát thanh tuyên bố chính thức. Quân đội Nhật ở Đông Dương mất tinh thần, chính quyền thân Nhật hoang mang, mở ra thời cơ đặc biệt thuận lợi cho cách mạng nước ta.",
            "hoang-quoc-viet": "Đây là thời khắc bước ngoặt lịch sử: ngày 14/8/1945 Nhật Bản chấp nhận đầu hàng, rồi ngày 15/8/1945 Nhật hoàng lên đài phát thanh tuyên bố đầu hàng. Quân địch mất hết tinh thần chiến đấu, bộ máy tay sai rệu rã, chính là thời cơ bằng vàng để nhân dân ta nhất tề đứng dậy.",
            "truong-chinh": "Cần phân tích rõ hai mốc liên tiếp: ngày 14/8/1945 Nhật Bản chấp nhận các điều kiện đầu hàng của Đồng minh, và ngày 15/8/1945 Nhật hoàng Hirohito phát thanh tuyên bố chấp nhận đầu hàng. Quân Nhật ở Đông Dương tê liệt, chính quyền tay sai khủng hoảng sâu sắc, tạo điều kiện quốc tế khách quan đặc biệt thuận lợi để phát động Tổng khởi nghĩa.",
            "vo-nguyen-giap": "Về mặt tình thế và thời cơ tác chiến: ngày 14/8/1945 Nhật Bản chấp nhận các điều kiện đầu hàng, và ngày 15/8/1945 Nhật hoàng Hirohito phát thanh tuyên bố đầu hàng. Lực lượng chiếm đóng Nhật tại Đông Dương hoang mang cực độ, phòng tuyến đối phương suy sụp, tạo thời cơ thuận lợi nhất để toàn quân và toàn dân đồng loạt hành động."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "I.1",
            "excerpt": "Ngày 14/8/1945: Nhật Bản chấp nhận các điều kiện đầu hàng của Đồng minh.\nNgày 15/8/1945: Nhật hoàng Hirohito phát thanh tuyên bố Nhật Bản chấp nhận đầu hàng.\nNhững thất bại liên tiếp khiến Nhật Bản không còn khả năng duy trì chiến tranh. Quân đội Nhật tại Đông Dương mất tinh thần, bộ máy chính quyền thân Nhật rơi vào tình trạng hoang mang.\nĐây là điều kiện quốc tế đặc biệt thuận lợi cho cách mạng Việt Nam.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/9", "body/10", "body/11", "body/12"],
            "paragraphIndex": 9
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 5. I-COUP
    {
        "key": "I-COUP",
        "sectionId": "I.2",
        "canonicalQuestion": "Cuộc đảo chính ngày 9/3/1945 của Nhật đã làm thay đổi tình hình cai trị ở Đông Dương như thế nào?",
        "aliases": [
            "Sau cuộc đảo chính ngày 9/3/1945, quyền thống trị ở Đông Dương thuộc về ai?",
            "Nhật đảo chính Pháp đêm 9/3/1945 dẫn tới chuyển biến chính trị gì tại Việt Nam?",
            "Tình thế cai trị ở Đông Dương thay đổi ra sao sau ngày 9/3/1945?"
        ],
        "approvedAnswer": "Trước tháng 8/1945, Việt Nam chịu sự thống trị của cả phát xít Nhật và thực dân Pháp. Sau cuộc đảo chính ngày 9/3/1945, Nhật loại bỏ bộ máy thống trị của Pháp và trực tiếp nắm quyền ở Đông Dương.",
        "characterAnswers": {
            "pham-van-dong": "Về chuyển biến cai trị trước Tổng khởi nghĩa, tư liệu chỉ rõ: trước đó nước ta chịu sự thống trị của cả Nhật và Pháp. Đến cuộc đảo chính ngày 9/3/1945, phát xít Nhật đã gạt bỏ bộ máy của Pháp để trực tiếp nắm trọn quyền lực tại Đông Dương.",
            "hoang-quoc-viet": "Bà con ta trước tháng 8/1945 phải chịu cảnh áp bức của cả Pháp lẫn Nhật. Sau cuộc đảo chính ngày 9/3/1945, giặc Nhật hất cẳng thực dân Pháp, trực tiếp đứng ra nắm quyền cai trị Đông Dương.",
            "truong-chinh": "Phân tích mâu thuẫn giữa hai kẻ cướp nước: trước tháng 8/1945 tồn tại tình trạng hai tầng thống trị Pháp - Nhật. Đêm 9/3/1945, phát xít Nhật nổ súng đảo chính, loại bỏ hoàn toàn bộ máy của Pháp để độc chiếm quyền cai trị Đông Dương, làm thay đổi căn bản tình hình và đòi hỏi Đảng phải chuyển hướng hành động ngay.",
            "vo-nguyen-giap": "Dưới góc độ chiến trường và tương quan thế lực: trước tháng 8/1945 ta phải đối phó với cả Pháp và Nhật. Cuộc đảo chính ngày 9/3/1945 khiến bộ máy Pháp sụp đổ nhanh chóng, Nhật trực tiếp nắm quyền quân sự và hành chính tại Đông Dương."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "I.2",
            "excerpt": "Trước tháng 8/1945, Việt Nam chịu sự thống trị của phát xít Nhật và thực dân Pháp. Sau cuộc đảo chính ngày 9/3/1945, Nhật loại bỏ bộ máy thống trị của Pháp và trực tiếp nắm quyền ở Đông Dương.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/14"],
            "paragraphIndex": 14
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 6. I-GOVERNMENT
    {
        "key": "I-GOVERNMENT",
        "sectionId": "I.2",
        "canonicalQuestion": "Chính phủ Trần Trọng Kim có vị thế và thực quyền như thế nào dưới sự bảo trợ của phát xít Nhật?",
        "aliases": [
            "Chính phủ Trần Trọng Kim được thành lập như thế nào và có thực quyền không?",
            "Bản chất quyền lực của chính phủ Trần Trọng Kim dưới thời Nhật chiếm đóng là gì?",
            "Chính quyền Trần Trọng Kim hoạt động dưới sự bảo trợ của ai và có địa vị ra sao?"
        ],
        "approvedAnswer": "Chính phủ Trần Trọng Kim được thành lập dưới sự bảo trợ của Nhật nhưng không có thực quyền độc lập.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi nhận rất rõ ràng và chuẩn xác: chính phủ Trần Trọng Kim tuy được thành lập dưới sự bảo trợ của phát xít Nhật, song trên thực tế hoàn toàn không có thực quyền độc lập đối với vận mệnh quốc gia.",
            "hoang-quoc-viet": "Bản chất của chính quyền này rất dễ thấy: chính phủ Trần Trọng Kim ra đời dưới sự bảo trợ của giặc Nhật, chỉ là bộ máy bù nhìn và hoàn toàn không có thực quyền độc lập gì để bảo vệ dân tộc.",
            "truong-chinh": "Đánh giá về tính chất giai cấp và chính trị: chính phủ Trần Trọng Kim được dựng lên dưới sự bảo trợ của phát xít Nhật; về bản chất, đó là chính phủ bù nhìn không có thực quyền độc lập, chỉ phục vụ cho mưu đồ thống trị của Nhật.",
            "vo-nguyen-giap": "Trên thực tế kiểm soát bộ máy: chính phủ Trần Trọng Kim được thành lập dưới sự bảo trợ của quân đội Nhật nhưng không hề có thực quyền độc lập, hoàn toàn bất lực trước làn sóng cách mạng của quần chúng."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "I.2",
            "excerpt": "Chính phủ Trần Trọng Kim được thành lập dưới sự bảo trợ của Nhật nhưng không có thực quyền độc lập.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/15"],
            "paragraphIndex": 15
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 7. I-FAMINE
    {
        "key": "I-FAMINE",
        "sectionId": "I.2",
        "canonicalQuestion": "Nạn đói năm 1944–1945 đã gây ra hậu quả gì và làm mâu thuẫn xã hội ở Việt Nam chuyển biến ra sao?",
        "aliases": [
            "Hậu quả của nạn đói 1944–1945 tác động như thế nào đến mâu thuẫn giữa nhân dân và chế độ thống trị?",
            "Nạn đói cuối năm 1944 đầu năm 1945 cướp đi sinh mạng bao nhiêu người và dẫn tới hệ quả gì?",
            "Nạn đói 1944–1945 đã làm sâu sắc thêm mâu thuẫn xã hội tại Việt Nam như thế nào?"
        ],
        "approvedAnswer": "Nạn đói năm 1944–1945 khiến hơn hai triệu đồng bào chết đói, làm cho mâu thuẫn giữa nhân dân Việt Nam với chế độ thống trị càng trở nên sâu sắc.",
        "characterAnswers": {
            "pham-van-dong": "Đây là nỗi đau thương vô hạn của non sông: nạn đói năm 1944–1945 đã khiến hơn hai triệu đồng bào chết đói, làm cho mâu thuẫn giữa nhân dân Việt Nam với chế độ thống trị càng trở nên sâu sắc và gay gắt tột cùng.",
            "hoang-quoc-viet": "Bà con không bao giờ quên tội ác tột cùng của quân cướp nước: nạn đói 1944–1945 làm hơn hai triệu đồng bào ta chết đói. Chính thảm cảnh ấy đã làm cho mâu thuẫn giữa nhân dân và chế độ thống trị bùng lên dữ dội, thúc giục mọi người xốc tới phá kho thóc cứu đói.",
            "truong-chinh": "Về mặt cơ sở mâu thuẫn giai cấp và dân tộc: nạn đói năm 1944–1945 khiến hơn hai triệu đồng bào chết đói, làm cho mâu thuẫn giữa nhân dân Việt Nam với chế độ thống trị càng trở nên sâu sắc, đẩy nhanh tiến trình khủng hoảng của chính quyền thực dân - phát xít.",
            "vo-nguyen-giap": "Dưới góc độ động viên lực lượng quần chúng: nạn đói năm 1944–1945 làm hơn hai triệu đồng bào chết đói, đẩy mâu thuẫn giữa nhân dân với chế độ thống trị lên đỉnh điểm sâu sắc, biến lòng căm thù thành sức mạnh khởi nghĩa quật khởi."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "I.2",
            "excerpt": "Đặc biệt, nạn đói năm 1944–1945 khiến hơn hai triệu đồng bào chết đói, làm cho mâu thuẫn giữa nhân dân Việt Nam với chế độ thống trị càng trở nên sâu sắc.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/17"],
            "paragraphIndex": 17
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 8. I-WINDOW
    {
        "key": "I-WINDOW",
        "sectionId": "I.2",
        "canonicalQuestion": "Vì sao cách mạng Việt Nam phải cấp bách giành chính quyền trước khi quân Đồng minh tiến vào Đông Dương?",
        "aliases": [
            "Tại sao ta cần giành chính quyền trước lúc quân đội Đồng minh vào Việt Nam giải giáp quân Nhật?",
            "Yêu cầu cấp bách phải giành chính quyền trước khi quân Đồng minh vào Đông Dương xuất phát từ nguyên nhân nào?",
            "Thời cơ có giới hạn của Cách mạng tháng Tám trước khi quân Đồng minh kéo vào được giải thích ra sao?"
        ],
        "approvedAnswer": "Khi Nhật đầu hàng Đồng minh, chính quyền tay sai mất chỗ dựa, tạo ra thời cơ thuận lợi để nhân dân giành chính quyền. Tuy nhiên thời cơ có hạn vì theo phân công, quân Trung Hoa Dân quốc sẽ vào miền Bắc, quân Anh vào miền Nam để giải giáp quân Nhật, và thực dân Pháp tìm cách quay lại. Do đó, yêu cầu cấp bách là phải giành chính quyền trước khi quân Đồng minh tiến vào Đông Dương.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu giải thích rất thấu đáo: khi Nhật đầu hàng, chính quyền tay sai mất chỗ dựa tạo thời cơ thuận lợi. Nhưng thời cơ này có giới hạn vì quân Trung Hoa Dân quốc sẽ vào miền Bắc, quân Anh vào miền Nam giải giáp quân Nhật, còn thực dân Pháp tìm cách quay lại. Yêu cầu cấp bách lúc đó là phải giành chính quyền trước khi quân Đồng minh đặt chân vào Đông Dương.",
            "hoang-quoc-viet": "Bà con và anh em cần hiểu rõ tình thế ngàn cân treo sợi tóc: giặc Nhật đầu hàng khiến tay sai rệu rã, mở ra thời cơ lớn. Nhưng thời cơ rất ngắn ngủi vì quân Trung Hoa Dân quốc sắp vào Bắc, quân Anh sắp vào Nam, lại thêm thực dân Pháp nhăm nhe quay lại cướp nước. Chúng ta phải vùng lên giành chính quyền thật mau lẹ trước khi quân Đồng minh kéo vào.",
            "truong-chinh": "Phân tích khoa học về thời cơ cách mạng: phát xít Nhật đầu hàng khiến chính quyền bù nhìn mất chỗ dựa, tạo thời cơ thuận lợi. Song thời cơ ấy có giới hạn vì theo hiệp ước quốc tế, quân Trung Hoa Dân quốc vào miền Bắc, quân Anh vào miền Nam giải giáp quân Nhật, Pháp cũng toan tính phục hồi ách thống trị. Mệnh lệnh của Đảng là phải cấp bách hành động giành chính quyền trước khi quân Đồng minh tiến vào Đông Dương.",
            "vo-nguyen-giap": "Về mặt chiến lược thời gian và bố phòng: Nhật đầu hàng làm tê liệt tay sai, thời cơ xuất hiện nhưng chỉ tồn tại trong thời gian ngắn. Quân Trung Hoa Dân quốc chuẩn bị vào miền Bắc, quân Anh vào miền Nam giải giáp quân Nhật, còn Pháp tìm cách quay lại. Quân dân ta phải thần tốc phát động Tổng khởi nghĩa giành quyền làm chủ trước khi quân Đồng minh tiến vào Đông Dương."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "I.2",
            "excerpt": "Khi Nhật đầu hàng Đồng minh, chính quyền tay sai mất chỗ dựa, tạo ra thời cơ thuận lợi để nhân dân đứng lên giành chính quyền.\nTuy nhiên, thời cơ này có giới hạn vì theo sự phân công của Đồng minh, quân Trung Hoa Dân quốc sẽ vào miền Bắc Việt Nam, quân Anh vào miền Nam để giải giáp quân Nhật. Thực dân Pháp cũng tìm cách quay trở lại.\nDo đó, yêu cầu cấp bách là phải giành chính quyền trước khi quân Đồng minh tiến vào Đông Dương.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/18", "body/19", "body/20"],
            "paragraphIndex": 18
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 9. II-CONFERENCE8 (II.1)
    {
        "key": "II-CONFERENCE8",
        "sectionId": "II.1",
        "canonicalQuestion": "Hội nghị Trung ương lần thứ 8 của Đảng diễn ra vào thời gian nào, ở đâu và do ai chủ trì?",
        "aliases": [
            "Hội nghị Trung ương 8 được tổ chức khi nào, tại địa điểm nào và ai là người chủ trì?",
            "Thời gian, địa điểm và người chủ trì Hội nghị Trung ương lần thứ 8 năm 1941 là gì?",
            "Nguyễn Ái Quốc chủ trì Hội nghị Trung ương lần thứ 8 vào thời gian nào và ở đâu?"
        ],
        "approvedAnswer": "Từ ngày 10 đến 19/5/1941, Hội nghị Trung ương lần thứ 8 được tổ chức tại Pác Bó, Cao Bằng, do Nguyễn Ái Quốc chủ trì.",
        "characterAnswers": {
            "pham-van-dong": "Theo biên niên tư liệu của Đảng: từ ngày 10 đến 19/5/1941, Hội nghị Trung ương lần thứ 8 đã được long trọng tổ chức tại Pác Bó, Cao Bằng, dưới sự chủ trì trực tiếp của đồng chí Nguyễn Ái Quốc.",
            "hoang-quoc-viet": "Bà con và đồng chí cần nhớ rõ sự kiện lịch sử này: từ ngày 10 đến 19/5/1941, Hội nghị Trung ương lần thứ 8 họp tại Pác Bó, Cao Bằng, do Bác Hồ kính yêu khi ấy là Nguyễn Ái Quốc chủ trì.",
            "truong-chinh": "Về mặt cột mốc tổ chức và đường lối: từ ngày 10 đến 19/5/1941, Hội nghị Ban Chấp hành Trung ương lần thứ 8 được tổ chức tại Pác Bó, Cao Bằng, do đồng chí Nguyễn Ái Quốc chủ trì, mở ra giai đoạn quyết định cho phong trào giải phóng dân tộc.",
            "vo-nguyen-giap": "Dưới góc độ chuẩn bị địa bàn chiến lược: từ ngày 10 đến 19/5/1941, Hội nghị Trung ương lần thứ 8 được tổ chức tại Pác Bó, Cao Bằng, do Nguyễn Ái Quốc chủ trì, đặt nền móng vững chắc cho căn cứ địa cách mạng."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "II.1",
            "excerpt": "Từ ngày 10 đến 19/5/1941: Hội nghị Trung ương lần thứ 8 được tổ chức tại Pác Bó, Cao Bằng, do Nguyễn Ái Quốc chủ trì.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/25"],
            "paragraphIndex": 25
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 10. II-PRIORITIES (II.1)
    {
        "key": "II-PRIORITIES",
        "sectionId": "II.1",
        "canonicalQuestion": "Hội nghị Trung ương lần thứ 8 tháng 5/1941 đã thông qua những quyết định quan trọng nào để hoàn chỉnh chuyển hướng chiến lược?",
        "aliases": [
            "Những nội dung quyết định chủ yếu của Hội nghị Trung ương lần thứ 8 năm 1941 là gì?",
            "Hội nghị Trung ương 8 đặt ra những nhiệm vụ chiến lược nào cho cách mạng Việt Nam?",
            "Quyết định của Hội nghị Pác Bó tháng 5/1941 có ý nghĩa như thế nào đối với nhiệm vụ giải phóng dân tộc?"
        ],
        "approvedAnswer": "Hội nghị Trung ương lần thứ 8 đặt nhiệm vụ giải phóng dân tộc lên hàng đầu, tạm gác một số khẩu hiệu chưa phù hợp, thành lập Mặt trận Việt Nam Độc lập Đồng minh (Việt Minh), xây dựng lực lượng chính trị, chuẩn bị lực lượng vũ trang và căn cứ địa, xác định chuẩn bị khởi nghĩa vũ trang là nhiệm vụ trọng tâm. Hội nghị có ý nghĩa quyết định trong việc hoàn chỉnh sự chuyển hướng chiến lược sang nhiệm vụ giải phóng dân tộc.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu làm nổi bật những quyết sách lịch sử của Hội nghị Trung ương 8: đặt nhiệm vụ giải phóng dân tộc lên hàng đầu, tạm gác các khẩu hiệu chưa phù hợp, thành lập Mặt trận Việt Minh, xây dựng lực lượng chính trị và căn cứ địa, coi chuẩn bị khởi nghĩa vũ trang là nhiệm vụ trọng tâm. Hội nghị có ý nghĩa quyết định hoàn chỉnh chuyển hướng chiến lược của cách mạng nước ta.",
            "hoang-quoc-viet": "Nội dung Hội nghị Trung ương 8 thể hiện ý chí đại đoàn kết sắt đá: đặt quyền lợi giải phóng dân tộc lên trên hết, tạm gác khẩu hiệu chưa thích hợp để lập Mặt trận Việt Minh quy tụ muôn người như một, xây dựng căn cứ và lực lượng vũ trang, chuẩn bị khởi nghĩa vũ trang làm trọng tâm. Đó là ngọn cờ tập hợp toàn dân đánh đuổi phát xít - thực dân.",
            "truong-chinh": "Về mặt lý luận và cương lĩnh chiến lược: Hội nghị Trung ương lần thứ 8 quyết định đặt nhiệm vụ giải phóng dân tộc lên hàng đầu, tạm gác một số khẩu hiệu chưa phù hợp, thành lập Mặt trận Việt Minh, phát triển lực lượng chính trị quần chúng, chuẩn bị lực lượng vũ trang và căn cứ địa, xác định chuẩn bị khởi nghĩa vũ trang là nhiệm vụ trọng tâm. Hội nghị có ý nghĩa quyết định trong việc hoàn chỉnh sự chuyển hướng chiến lược của cách mạng Việt Nam.",
            "vo-nguyen-giap": "Dưới góc độ tổ chức khởi nghĩa vũ trang: Hội nghị Trung ương lần thứ 8 đặt giải phóng dân tộc lên hàng đầu, lập Mặt trận Việt Minh, quyết định xây dựng căn cứ địa và lực lượng vũ trang cách mạng, xác định chuẩn bị khởi nghĩa vũ trang là nhiệm vụ trọng tâm. Đây là định hướng chiến lược hoàn chỉnh để toàn Đảng, toàn quân chuẩn bị Tổng khởi nghĩa."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "II.1",
            "excerpt": "Những quyết định quan trọng:\nĐặt nhiệm vụ giải phóng dân tộc lên hàng đầu.\nTạm gác một số khẩu hiệu chưa phù hợp để tập trung vào nhiệm vụ độc lập dân tộc.\nThành lập Mặt trận Việt Nam Độc lập Đồng minh, gọi tắt là Việt Minh.\nXây dựng lực lượng chính trị rộng rãi trong quần chúng.\nChuẩn bị lực lượng vũ trang và căn cứ địa cách mạng.\nXác định chuẩn bị khởi nghĩa vũ trang là nhiệm vụ trọng tâm.\nHội nghị Trung ương lần thứ 8 có ý nghĩa quyết định trong việc hoàn chỉnh sự chuyển hướng chiến lược của cách mạng Việt Nam sang nhiệm vụ giải phóng dân tộc.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/25", "body/26", "body/27", "body/28", "body/29", "body/30", "body/31", "body/32", "body/33"],
            "paragraphIndex": 25
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 11. II-ARMY (II.2)
    {
        "key": "II-ARMY",
        "sectionId": "II.2",
        "canonicalQuestion": "Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập vào ngày nào, ở đâu, do ai chỉ huy và ban đầu có bao nhiêu chiến sĩ?",
        "aliases": [
            "Hoàn cảnh và quy mô thành lập Đội Việt Nam Tuyên truyền Giải phóng quân năm 1944 là gì?",
            "Đội Việt Nam Tuyên truyền Giải phóng quân ra đời ở đâu, khi nào và có bao nhiêu người?",
            "Ai là người trực tiếp tổ chức và chỉ huy Đội Việt Nam Tuyên truyền Giải phóng quân ngày 22/12/1944?"
        ],
        "approvedAnswer": "Ngày 22/12/1944, Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập tại khu rừng Trần Hưng Đạo, Cao Bằng. Người trực tiếp tổ chức và chỉ huy là Võ Nguyên Giáp. Đội ban đầu có 34 chiến sĩ, được trang bị vũ khí còn hạn chế nhưng có tinh thần chiến đấu cao.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi lại thời khắc thiêng liêng: ngày 22/12/1944, Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập tại khu rừng Trần Hưng Đạo, Cao Bằng. Đồng chí Võ Nguyên Giáp trực tiếp tổ chức và chỉ huy. Đội ban đầu gồm 34 chiến sĩ, vũ khí trang bị còn hạn chế nhưng tinh thần chiến đấu vô cùng quả cảm.",
            "hoang-quoc-viet": "Bà con hãy ghi nhớ hình ảnh 34 chiến sĩ đầu tiên: ngày 22/12/1944, Đội Việt Nam Tuyên truyền Giải phóng quân thành lập tại khu rừng Trần Hưng Đạo thuộc tỉnh Cao Bằng, do đồng chí Võ Nguyên Giáp trực tiếp tổ chức và chỉ huy. Tuy vũ khí còn thô sơ thiếu thốn nhưng ý chí cách mạng của các đồng chí thì sắt đá ngút trời.",
            "truong-chinh": "Về bước phát triển của lực lượng vũ trang cách mạng: ngày 22/12/1944, Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập tại khu rừng Trần Hưng Đạo, Cao Bằng. Đồng chí Võ Nguyên Giáp là người trực tiếp tổ chức và chỉ huy. Lực lượng ban đầu có 34 chiến sĩ, trang bị còn hạn chế nhưng sở hữu tinh thần chiến đấu tuyệt vời.",
            "vo-nguyen-giap": "Theo tư liệu lịch sử: ngày 22/12/1944, Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập tại khu rừng Trần Hưng Đạo, Cao Bằng, do tôi trực tiếp nhận nhiệm vụ tổ chức và chỉ huy. Đội ban đầu có 34 chiến sĩ, trang bị vũ khí còn hạn chế nhưng anh em mang trong mình tinh thần chiến đấu rất cao."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "II.2",
            "excerpt": "Ngày 22/12/1944: Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập tại khu rừng Trần Hưng Đạo, Cao Bằng.\nNgười trực tiếp tổ chức và chỉ huy là Võ Nguyên Giáp.\nĐội ban đầu có 34 chiến sĩ, được trang bị vũ khí còn hạn chế nhưng có tinh thần chiến đấu cao.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/35", "body/36", "body/37"],
            "paragraphIndex": 35
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 12. II-FIRST-BATTLES (II.2)
    {
        "key": "II-FIRST-BATTLES",
        "sectionId": "II.2",
        "canonicalQuestion": "Những chiến công đầu tiên của Đội Việt Nam Tuyên truyền Giải phóng quân diễn ra tại đâu và vào những ngày nào?",
        "aliases": [
            "Hai trận đánh đầu tiên của Đội Việt Nam Tuyên truyền Giải phóng quân là ở đâu và khi nào?",
            "Chiến thắng Phai Khắt và Nà Ngần diễn ra vào thời gian nào?",
            "Đội Việt Nam Tuyên truyền Giải phóng quân lập những chiến công đầu tiên vào ngày nào tháng 12/1944?"
        ],
        "approvedAnswer": "Đội Việt Nam Tuyên truyền Giải phóng quân nhanh chóng lập chiến công đầu tiên tại Phai Khắt và Nà Ngần vào ngày 25 và 26/12/1944.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu ghi nhận những chiến công đầu tiên rất oanh liệt: chỉ ít ngày sau khi thành lập, Đội Việt Nam Tuyên truyền Giải phóng quân đã nhanh chóng lập chiến công tại Phai Khắt và Nà Ngần vào ngày 25 và 26/12/1944.",
            "hoang-quoc-viet": "Tin vui chiến thắng bay về làm nức lòng đồng bào: Đội Việt Nam Tuyên truyền Giải phóng quân đã nhanh chóng đánh thắng hai trận giòn giã tại Phai Khắt và Nà Ngần vào ngày 25 và 26/12/1944, mở đầu truyền thống bách chiến bách thắng.",
            "truong-chinh": "Về mặt hiệu quả thực tiễn của lực lượng mới lập: Đội Việt Nam Tuyên truyền Giải phóng quân nhanh chóng lập chiến công tại Phai Khắt và Nà Ngần vào ngày 25 và 26/12/1944, chứng minh sự đúng đắn của chủ trương xây dựng lực lượng vũ trang cách mạng.",
            "vo-nguyen-giap": "Theo nhật ký tác chiến lịch sử: ngay sau lễ thành lập, Đội Việt Nam Tuyên truyền Giải phóng quân đã nhanh chóng lập chiến công tại Phai Khắt và Nà Ngần vào ngày 25 và 26/12/1944, thực hiện xuất sắc chỉ thị đánh thắng trận đầu."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "II.2",
            "excerpt": "Đội nhanh chóng lập chiến công tại Phai Khắt và Nà Ngần vào ngày 25 và 26/12/1944.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/35", "body/36", "body/37", "body/38"],
            "paragraphIndex": 35
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 13. II-ARMY-MEANING (II.2)
    {
        "key": "II-ARMY-MEANING",
        "sectionId": "II.2",
        "canonicalQuestion": "Việc thành lập lực lượng vũ trang cách mạng năm 1944 có ý nghĩa lịch sử như thế nào?",
        "aliases": [
            "Ý nghĩa của việc thành lập Đội Việt Nam Tuyên truyền Giải phóng quân năm 1944 là gì?",
            "Thành lập lực lượng vũ trang cách mạng năm 1944 đóng góp gì cho sự nghiệp giải phóng dân tộc?",
            "Vai trò và ý nghĩa của Đội Việt Nam Tuyên truyền Giải phóng quân đối với Tổng khởi nghĩa ra sao?"
        ],
        "approvedAnswer": "Ý nghĩa của việc thành lập lực lượng vũ trang cách mạng năm 1944 gồm: xây dựng lực lượng vũ trang tập trung, tạo cơ sở cho việc phát triển quân đội cách mạng, và góp phần chuẩn bị lực lượng quân sự cho Tổng khởi nghĩa.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu đúc kết ý nghĩa rất sâu sắc trên ba khía cạnh: xây dựng lực lượng vũ trang tập trung, tạo cơ sở cho việc phát triển quân đội cách mạng về sau, và trực tiếp góp phần chuẩn bị lực lượng quân sự cho ngày Tổng khởi nghĩa.",
            "hoang-quoc-viet": "Bà con ta thấy rõ: thành lập đội quân cách mạng năm 1944 có ý nghĩa xây dựng lực lượng vũ trang tập trung của nhân dân, tạo nền móng vững bền phát triển quân đội cách mạng và chuẩn bị thực lực quân sự cho toàn dân đứng lên Tổng khởi nghĩa.",
            "truong-chinh": "Về mặt xây dựng lực lượng cách mạng: sự kiện năm 1944 mang ý nghĩa chiến lược sâu sắc, đó là đặt nền móng xây dựng lực lượng vũ trang tập trung, tạo cơ sở cho sự phát triển quân đội cách mạng, đồng thời góp phần quyết định chuẩn bị lực lượng quân sự cho Tổng khởi nghĩa giành chính quyền.",
            "vo-nguyen-giap": "Dưới góc độ tổ chức quân sự cách mạng: việc thành lập lực lượng vũ trang năm 1944 mang ý nghĩa then chốt: xây dựng lực lượng vũ trang tập trung đầu tiên, tạo cơ sở vững chắc cho việc phát triển quân đội cách mạng, và chuẩn bị lực lượng nòng cốt cho Tổng khởi nghĩa."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "II.2",
            "excerpt": "Ý nghĩa:\nXây dựng lực lượng vũ trang tập trung.\nTạo cơ sở cho việc phát triển quân đội cách mạng.\nGóp phần chuẩn bị lực lượng quân sự cho Tổng khởi nghĩa.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/34", "body/35", "body/36", "body/37", "body/38", "body/39", "body/40", "body/41", "body/42"],
            "paragraphIndex": 34
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 14. II-DIRECTIVE-ISSUE (II.4)
    {
        "key": "II-DIRECTIVE-ISSUE",
        "sectionId": "II.4",
        "canonicalQuestion": "Chỉ thị 'Nhật – Pháp bắn nhau và hành động của chúng ta' được cơ quan nào ban hành và vào thời gian nào?",
        "aliases": [
            "Chỉ thị Nhật – Pháp bắn nhau và hành động của chúng ta ra đời khi nào và do ai ban hành?",
            "Ban Thường vụ Trung ương Đảng ra Chỉ thị Nhật – Pháp bắn nhau và hành động của chúng ta vào ngày nào?",
            "Thời điểm và cơ quan ban hành bản Chỉ thị lịch sử ngày 12/3/1945 là gì?"
        ],
        "approvedAnswer": "Sau khi Nhật đảo chính Pháp, ngày 12/3/1945, Ban Thường vụ Trung ương Đảng ban hành Chỉ thị 'Nhật – Pháp bắn nhau và hành động của chúng ta'.",
        "characterAnswers": {
            "pham-van-dong": "Tư liệu xác nhận rất chuẩn xác: ngay sau cuộc đảo chính Nhật - Pháp, vào ngày 12/3/1945, Ban Thường vụ Trung ương Đảng đã kịp thời ban hành bản Chỉ thị lịch sử 'Nhật – Pháp bắn nhau và hành động của chúng ta'.",
            "hoang-quoc-viet": "Bà con và đồng chí chú ý mốc thời gian này: ngày 12/3/1945, ngay sau khi giặc Nhật đảo chính quân Pháp, Ban Thường vụ Trung ương Đảng đã ban hành Chỉ thị 'Nhật – Pháp bắn nhau và hành động của chúng ta' để chỉ rõ đường đi nước bước cho toàn dân.",
            "truong-chinh": "Về sự lãnh đạo nhạy bén của Trung ương Đảng: ngay sau biến cố đảo chính ngày 9/3, đến ngày 12/3/1945, Ban Thường vụ Trung ương Đảng đã ban hành Chỉ thị 'Nhật – Pháp bắn nhau và hành động của chúng ta', kịp thời định hướng phương châm hành động cách mạng.",
            "vo-nguyen-giap": "Dưới góc độ chỉ đạo tác chiến và tình hình chính trị: ngày 12/3/1945, sau khi Nhật đảo chính Pháp, Ban Thường vụ Trung ương Đảng đã ban hành Chỉ thị 'Nhật – Pháp bắn nhau và hành động của chúng ta', vạch rõ mục tiêu đấu tranh cụ thể trước mắt."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "II.4",
            "excerpt": "4. Ngày 12/3/1945: Ban hành Chỉ thị Nhật – Pháp bắn nhau và hành động của chúng ta\nSau khi Nhật đảo chính Pháp, Ban Thường vụ Trung ương Đảng ban hành Chỉ thị:\nNhật – Pháp bắn nhau và hành động của chúng ta.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/47", "body/48", "body/49"],
            "paragraphIndex": 47
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 15. II-DIRECTIVE-CONTENT (II.4)
    {
        "key": "II-DIRECTIVE-CONTENT",
        "sectionId": "II.4",
        "canonicalQuestion": "Chỉ thị ngày 12/3/1945 xác định kẻ thù trước mắt, khẩu hiệu và các phương hướng hành động chính như thế nào?",
        "aliases": [
            "Nội dung chính và ý nghĩa của Chỉ thị Nhật – Pháp bắn nhau và hành động của chúng ta là gì?",
            "Chỉ thị 12/3/1945 của Ban Thường vụ Trung ương Đảng đề ra những chủ trương gì?",
            "Kẻ thù chính và phương hướng hành động được xác định trong Chỉ thị ngày 12/3/1945 ra sao?"
        ],
        "approvedAnswer": "Chỉ thị ngày 12/3/1945 xác định phát xít Nhật là kẻ thù chính, cụ thể trước mắt; thay đổi khẩu hiệu đấu tranh cho phù hợp; phát động cao trào kháng Nhật cứu nước; đẩy mạnh đấu tranh chính trị kết hợp vũ trang; phát triển lực lượng cách mạng và Việt Minh; chuẩn bị điều kiện tiến tới tổng khởi nghĩa. Chỉ thị có ý nghĩa quan trọng vì xác định đúng đối tượng đấu tranh trực tiếp và phương hướng hành động trong tình hình mới.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu giải thích rất đầy đủ: Chỉ thị ngày 12/3/1945 xác định phát xít Nhật là kẻ thù chính cụ thể trước mắt, đổi khẩu hiệu phù hợp, phát động cao trào kháng Nhật cứu nước, kết hợp chính trị với vũ trang, mở rộng Việt Minh và chuẩn bị tiến tới tổng khởi nghĩa. Bản chỉ thị có ý nghĩa then chốt vì xác định đúng đối tượng đấu tranh trực tiếp và phương hướng hành động.",
            "hoang-quoc-viet": "Bản Chỉ thị đã soi đường sáng rõ cho quần chúng: chỉ thẳng giặc Nhật là kẻ thù chính trước mắt, đổi khẩu hiệu đấu tranh, phát động cao trào kháng Nhật cứu nước rộng khắp, kết hợp đấu tranh chính trị với vũ trang, củng cố Mặt trận Việt Minh và chuẩn bị tiến lên tổng khởi nghĩa. Nhờ xác định đúng kẻ thù trực tiếp mà phong trào quần chúng phát triển cuồn cuộn.",
            "truong-chinh": "Về mặt đường lối và cương lĩnh hành động trong tình thế mới: Chỉ thị ngày 12/3/1945 chỉ rõ phát xít Nhật là kẻ thù chính, cụ thể trước mắt; chuyển hướng khẩu hiệu cho thích hợp; phát động cao trào kháng Nhật cứu nước; kết hợp chặt chẽ đấu tranh chính trị với vũ trang; phát triển tổ chức Việt Minh và chuẩn bị điều kiện tiến tới tổng khởi nghĩa. Chỉ thị có ý nghĩa chiến lược vì xác định trúng đối tượng đấu tranh trực tiếp và phương hướng cách mạng.",
            "vo-nguyen-giap": "Dưới góc độ chỉ đạo phương thức tác chiến và tổ chức: Chỉ thị ngày 12/3/1945 xác định quân phát xít Nhật là kẻ thù chính cụ thể trước mắt, đổi khẩu hiệu đấu tranh, phát động cao trào kháng Nhật cứu nước, đẩy mạnh kết hợp đấu tranh chính trị và quân sự vũ trang, phát triển tổ chức cách mạng để chuẩn bị tổng khởi nghĩa. Đây là định hướng quyết định phương thức chuẩn bị tiến công của ta."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "II.4",
            "excerpt": "Nội dung chính:\nXác định phát xít Nhật là kẻ thù chính, cụ thể trước mắt.\nThay đổi khẩu hiệu đấu tranh cho phù hợp với tình hình mới.\nPhát động cao trào kháng Nhật cứu nước.\nĐẩy mạnh đấu tranh chính trị kết hợp đấu tranh vũ trang.\nPhát triển lực lượng cách mạng và các tổ chức Việt Minh.\nChuẩn bị điều kiện để tiến tới tổng khởi nghĩa.\nChỉ thị này có ý nghĩa quan trọng vì đã xác định đúng đối tượng đấu tranh trực tiếp và phương hướng hành động trong tình hình mới.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/47", "body/48", "body/49", "body/50", "body/51", "body/52", "body/53", "body/54", "body/55", "body/56", "body/57"],
            "paragraphIndex": 47
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 16. II-MILITARY (II.5)
    {
        "key": "II-MILITARY",
        "sectionId": "II.5",
        "canonicalQuestion": "Hội nghị quân sự cách mạng Bắc Kỳ tháng 4/1945 được tổ chức nhằm mục đích gì và đề ra những nhiệm vụ trọng tâm nào?",
        "aliases": [
            "Mục tiêu và các nhiệm vụ trọng tâm của Hội nghị quân sự cách mạng Bắc Kỳ tháng 4/1945 là gì?",
            "Hội nghị quân sự cách mạng Bắc Kỳ tháng 4/1945 quyết định những việc gì để chuẩn bị khởi nghĩa?",
            "Nội dung chuẩn bị khởi nghĩa của Hội nghị quân sự cách mạng Bắc Kỳ gồm những gì?"
        ],
        "approvedAnswer": "Hội nghị quân sự cách mạng Bắc Kỳ tháng 4/1945 được tổ chức nhằm thống nhất các lực lượng vũ trang, phát triển căn cứ địa và chuẩn bị cho khởi nghĩa. Những nhiệm vụ trọng tâm gồm: phát triển lực lượng vũ trang, xây dựng các đội tự vệ và du kích, tăng cường hoạt động quân sự, chuẩn bị phương án giành chính quyền.",
        "characterAnswers": {
            "pham-van-dong": "Theo tư liệu ghi nhận: Hội nghị quân sự cách mạng Bắc Kỳ tổ chức vào tháng 4/1945 nhằm mục đích thống nhất các lực lượng vũ trang, phát triển căn cứ địa và chuẩn bị cho khởi nghĩa. Các nhiệm vụ trọng tâm bao gồm phát triển lực lượng vũ trang, xây dựng đội tự vệ và du kích, tăng cường quân sự và chuẩn bị phương án giành chính quyền.",
            "hoang-quoc-viet": "Bà con và đồng chí thấy rõ bước chuẩn bị thiết thực: Hội nghị tháng 4/1945 họp nhằm thống nhất lực lượng vũ trang, mở rộng căn cứ địa cách mạng và chuẩn bị khởi nghĩa. Hội nghị đề ra việc xây dựng tự vệ, du kích rộng khắp trong quần chúng lao động, tăng cường đánh giặc và chuẩn bị sẵn kế hoạch giành chính quyền về tay nhân dân.",
            "truong-chinh": "Về mặt chuẩn bị thực lực cho Tổng khởi nghĩa: Hội nghị quân sự cách mạng Bắc Kỳ tháng 4/1945 được tổ chức nhằm thống nhất các lực lượng vũ trang, phát triển căn cứ địa và chuẩn bị cho khởi nghĩa. Nhiệm vụ trọng tâm đặt ra là phát triển lực lượng vũ trang, xây dựng mạng lưới tự vệ và du kích, tăng cường hoạt động quân sự và hoàn thiện phương án giành chính quyền.",
            "vo-nguyen-giap": "Dưới góc độ tổ chức bộ máy chỉ huy quân sự: Hội nghị quân sự cách mạng Bắc Kỳ tháng 4/1945 nhằm mục tiêu thống nhất các lực lượng vũ trang, mở rộng căn cứ địa và chuẩn bị tác chiến khởi nghĩa. Trọng tâm là phát triển lực lượng vũ trang tập trung, xây dựng các đội tự vệ du kích địa phương, đẩy mạnh hoạt động vũ trang và chuẩn bị phương án giành chính quyền."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "II.5",
            "excerpt": "5. Tháng 4/1945: Hội nghị quân sự cách mạng Bắc Kỳ\nHội nghị quân sự cách mạng Bắc Kỳ được tổ chức nhằm thống nhất các lực lượng vũ trang, phát triển căn cứ địa và chuẩn bị cho khởi nghĩa.\nNhững nhiệm vụ trọng tâm:\nPhát triển lực lượng vũ trang.\nXây dựng các đội tự vệ và du kích.\nTăng cường hoạt động quân sự.\nChuẩn bị phương án giành chính quyền.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/58", "body/59", "body/60", "body/61", "body/62", "body/63", "body/64"],
            "paragraphIndex": 58
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 17. II-ZONE (II.6)
    {
        "key": "II-ZONE",
        "sectionId": "II.6",
        "canonicalQuestion": "Khu giải phóng Việt Bắc được thành lập vào ngày nào, bao gồm những tỉnh nào và nơi nào là trung tâm chỉ đạo cách mạng?",
        "aliases": [
            "Ngày thành lập, phạm vi sáu tỉnh và trung tâm chỉ đạo của Khu giải phóng Việt Bắc là gì?",
            "Khu giải phóng Việt Bắc ra đời khi nào, gồm các tỉnh nào và đóng trung tâm ở đâu?",
            "Sáu tỉnh thuộc Khu giải phóng Việt Bắc thành lập ngày 4/6/1945 gồm những tỉnh nào?"
        ],
        "approvedAnswer": "Khu giải phóng Việt Bắc được thành lập ngày 4/6/1945 với sáu tỉnh: Cao Bằng, Bắc Kạn, Lạng Sơn, Hà Giang, Tuyên Quang, Thái Nguyên. Tân Trào, Tuyên Quang trở thành trung tâm chỉ đạo cách mạng.",
        "characterAnswers": {
            "pham-van-dong": "Tài liệu ghi lại rất rõ ràng địa bàn căn cứ thiêng liêng: ngày 4/6/1945 thành lập Khu giải phóng Việt Bắc gồm sáu tỉnh: Cao Bằng, Bắc Kạn, Lạng Sơn, Hà Giang, Tuyên Quang, Thái Nguyên. Trong đó, Tân Trào thuộc tỉnh Tuyên Quang được chọn làm trung tâm chỉ đạo cách mạng.",
            "hoang-quoc-viet": "Bà con hãy nhớ mảnh đất cội nguồn cách mạng: Khu giải phóng được thành lập ngày 4/6/1945 gồm sáu tỉnh Cao Bằng, Bắc Kạn, Lạng Sơn, Hà Giang, Tuyên Quang, Thái Nguyên. Đồng bào các dân tộc Việt Bắc một lòng theo Đảng, lấy Tân Trào, Tuyên Quang làm trung tâm chỉ đạo cách mạng.",
            "truong-chinh": "Về mặt xây dựng căn cứ địa đầu não: ngày 4/6/1945 chính thức thành lập Khu giải phóng Việt Bắc gồm sáu tỉnh: Cao Bằng, Bắc Kạn, Lạng Sơn, Hà Giang, Tuyên Quang và Thái Nguyên. Địa bàn Tân Trào, Tuyên Quang trở thành trung tâm chỉ đạo cách mạng của cả nước.",
            "vo-nguyen-giap": "Dưới góc độ địa bàn tác chiến và căn cứ kháng chiến: ngày 4/6/1945 thành lập Khu giải phóng Việt Bắc bao gồm sáu tỉnh chiến lược: Cao Bằng, Bắc Kạn, Lạng Sơn, Hà Giang, Tuyên Quang, Thái Nguyên. Tân Trào, Tuyên Quang là trung tâm chỉ đạo cách mạng để chỉ huy các hướng tiến công."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "II.6",
            "excerpt": "6. Ngày 4/6/1945: Thành lập Khu giải phóng Việt Bắc\nKhu giải phóng được thành lập với sáu tỉnh:\nCao Bằng.\nBắc Kạn.\nLạng Sơn.\nHà Giang.\nTuyên Quang.\nThái Nguyên.\nTân Trào, Tuyên Quang trở thành trung tâm chỉ đạo cách mạng.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/65", "body/66", "body/67", "body/68", "body/69", "body/70", "body/71", "body/72", "body/73"],
            "paragraphIndex": 65
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    },
    # 18. II-ZONE-GIAP (II.6)
    {
        "key": "II-ZONE-GIAP",
        "sectionId": "II.6",
        "canonicalQuestion": "Võ Nguyên Giáp được giao nhiệm vụ gì trong Khu giải phóng Việt Bắc và các lực lượng cách mạng đã triển khai những hoạt động gì?",
        "aliases": [
            "Nhiệm vụ của Võ Nguyên Giáp trong Ủy ban Chỉ huy lâm thời Khu giải phóng Việt Bắc là gì?",
            "Võ Nguyên Giáp phụ trách công tác gì khi thành lập Khu giải phóng Việt Bắc?",
            "Vai trò phụ trách quân sự của Võ Nguyên Giáp tại Khu giải phóng Việt Bắc được ghi nhận thế nào?"
        ],
        "approvedAnswer": "Võ Nguyên Giáp được giao nhiệm vụ thường trực trong Ủy ban Chỉ huy lâm thời Khu giải phóng, phụ trách quân sự. Các lực lượng cách mạng tiếp tục xây dựng chính quyền cách mạng ở cơ sở, tổ chức lực lượng vũ trang và chuẩn bị Tổng khởi nghĩa.",
        "characterAnswers": {
            "pham-van-dong": "Theo phân công của tổ chức: đồng chí Võ Nguyên Giáp được giao nhiệm vụ thường trực trong Ủy ban Chỉ huy lâm thời Khu giải phóng, phụ trách quân sự. Dưới sự lãnh đạo đó, các lực lượng cách mạng tiếp tục xây dựng chính quyền cách mạng ở cơ sở, tổ chức lực lượng vũ trang và tích cực chuẩn bị Tổng khởi nghĩa.",
            "hoang-quoc-viet": "Bà con và đồng chí nắm rõ sự phân công lúc bấy giờ: đồng chí Võ Nguyên Giáp được giao nhiệm vụ thường trực trong Ủy ban Chỉ huy lâm thời Khu giải phóng, trực tiếp phụ trách quân sự. Các lực lượng cách mạng vừa xây dựng chính quyền cơ sở cùng nhân dân, vừa củng cố lực lượng vũ trang để chuẩn bị Tổng khởi nghĩa.",
            "truong-chinh": "Về việc kiện toàn tổ chức lãnh đạo Khu giải phóng: đồng chí Võ Nguyên Giáp được giao nhiệm vụ thường trực trong Ủy ban Chỉ huy lâm thời Khu giải phóng, phụ trách quân sự. Trên địa bàn căn cứ, các lực lượng cách mạng khẩn trương xây dựng chính quyền cách mạng cơ sở, phát triển lực lượng vũ trang và chuẩn bị điều kiện cho Tổng khởi nghĩa.",
            "vo-nguyen-giap": "Tài liệu ghi nhận đúng chức trách được Đảng phân công: tôi được giao nhiệm vụ thường trực trong Ủy ban Chỉ huy lâm thời Khu giải phóng, phụ trách quân sự. Lực lượng của ta đã liên tục củng cố chính quyền cách mạng cơ sở, huấn luyện lực lượng vũ trang và chuẩn bị sẵn sàng cho Tổng khởi nghĩa."
        },
        "source": {
            "document": "Tong-hop-kien-thuc-moi.docx",
            "sectionId": "II.6",
            "excerpt": "Võ Nguyên Giáp được giao nhiệm vụ thường trực trong Ủy ban Chỉ huy lâm thời Khu giải phóng, phụ trách quân sự.\nCác lực lượng cách mạng tiếp tục xây dựng chính quyền cách mạng ở cơ sở, tổ chức lực lượng vũ trang và chuẩn bị Tổng khởi nghĩa.",
            "sourceSha256": "fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e",
            "blockIds": ["body/65", "body/66", "body/67", "body/68", "body/69", "body/70", "body/71", "body/72", "body/73", "body/74", "body/75"],
            "paragraphIndex": 65
        },
        "reviewNotes": [
            "Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.",
            "NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố."
        ]
    }
]

