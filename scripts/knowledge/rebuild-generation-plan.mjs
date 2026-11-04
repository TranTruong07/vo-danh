// Editorial intents only. This file never generates answers or calls a provider/database.
// A unit groups facts needed to answer ONE coherent intent, not one paragraph or persona.
export const plannedIntents = [
  ['I-GERMANY',4,4,'Đức đầu hàng Đồng minh vào ngày nào và sự kiện đó đánh dấu điều gì?',['ngày','kết quả']],
  ['I-USSR',5,6,'Liên Xô có những hành động nào đối với Nhật Bản trong ngày 8 và 9/8/1945?',['hai ngày','hai hành động']],
  ['I-ATOMIC',7,8,'Hai thành phố Nhật Bản bị Mỹ ném bom nguyên tử vào những ngày nào?',['Hiroshima/ngày','Nagasaki/ngày']],
  ['I-SURRENDER',9,12,'Ngày 14 và 15/8/1945 đánh dấu hai bước nào trong việc Nhật Bản đầu hàng?',['chấp nhận điều kiện','công bố','tác động tại Đông Dương'],['R05'],[[161,163]]],
  ['I-COUP',14,14,'Cuộc đảo chính ngày 9/3/1945 làm thay đổi quyền cai trị ở Đông Dương như thế nào?',['ngày','Pháp bị loại','Nhật nắm quyền'],[],[[43,46]]],
  ['I-GOVERNMENT',15,15,'Chính phủ Trần Trọng Kim có vị thế như thế nào dưới sự bảo trợ của Nhật?',['bảo trợ','thực quyền']],
  ['I-FAMINE',17,17,'Nạn đói 1944–1945 ảnh hưởng thế nào đến mâu thuẫn xã hội Việt Nam?',['thời gian','thiệt hại theo nguồn','mâu thuẫn']],
  ['I-WINDOW',18,20,'Vì sao cần giành chính quyền trước khi quân Đồng minh tiến vào Đông Dương?',['thời cơ','Trung Hoa Dân quốc/Bắc','Anh/Nam','Pháp trở lại','tính cấp bách']],
  ['II-RETURN',24,24,'Ngày 28/1/1941 diễn ra sự kiện gì liên quan đến Nguyễn Ái Quốc?',['ngày','trở về nước','thời lượng theo nguồn'],['R09'],[], 'cmtt45-q061'],
  ['II-CONFERENCE8',25,25,'Hội nghị Trung ương lần thứ 8 diễn ra khi nào, ở đâu và do ai chủ trì?',['ngày','Pác Bó/Cao Bằng','chủ trì']],
  ['II-PRIORITIES',25,33,'Hội nghị Trung ương lần thứ 8 đặt ra những nhiệm vụ gì để tập trung giải phóng dân tộc?',['ưu tiên dân tộc','khẩu hiệu','Việt Minh/tên gọi','chính trị','vũ trang/căn cứ','chuẩn bị khởi nghĩa','ý nghĩa chuyển hướng']],
  ['II-ARMY',35,37,'Đội Việt Nam Tuyên truyền Giải phóng quân được thành lập trong hoàn cảnh tổ chức nào?',['ngày','địa điểm','chỉ huy','34 chiến sĩ','trang bị/tinh thần'],[],[[89,94]]],
  ['II-FIRST-BATTLES',35,38,'Những chiến công đầu tiên của Đội Việt Nam Tuyên truyền Giải phóng quân diễn ra ở đâu, khi nào?',['đơn vị','Phai Khắt','Nà Ngần','ngày tương ứng']],
  ['II-ARMY-MEANING',34,42,'Việc thành lập lực lượng vũ trang cách mạng năm 1944 có ý nghĩa gì?',['tập trung','cơ sở quân đội','chuẩn bị tổng khởi nghĩa']],
  ['II-DIRECTIVE-ISSUE',47,49,'Chỉ thị Nhật – Pháp bắn nhau và hành động của chúng ta được ban hành khi nào, bởi cơ quan nào?',['ngày','cơ quan','sau đảo chính']],
  ['II-DIRECTIVE-CONTENT',47,57,'Chỉ thị ngày 12/3/1945 xác định kẻ thù và phương hướng hành động như thế nào?',['Nhật là kẻ thù','khẩu hiệu','cao trào','chính trị/vũ trang','phát triển tổ chức','chuẩn bị tổng khởi nghĩa']],
  ['II-MILITARY',58,64,'Hội nghị quân sự cách mạng Bắc Kỳ tháng 4/1945 nhằm chuẩn bị những gì cho khởi nghĩa?',['thống nhất lực lượng','căn cứ','tự vệ/du kích','quân sự','phương án']],
  ['II-ZONE',65,73,'Khu giải phóng Việt Bắc được thành lập khi nào, gồm những tỉnh nào và có trung tâm ở đâu?',['ngày','sáu tỉnh','Tân Trào/Tuyên Quang'],['R02']],
  ['II-ZONE-GIAP',65,75,'Võ Nguyên Giáp được giao nhiệm vụ gì trong Khu giải phóng Việt Bắc?',['ủy ban lâm thời','thường trực','quân sự'],['R02'],[[89,94]]],
  ['III-CHINH',78,88,'Vai trò chính trị và tổ chức của Trường Chinh trong chuẩn bị Tổng khởi nghĩa được thể hiện thế nào?',['Tổng Bí thư','kháng Nhật','hội nghị','thời cơ','phát động','phụ trách ủy ban'],['R04']],
  ['III-GIAP-TRAINING',89,95,'Võ Nguyên Giáp tham gia công tác đào tạo cán bộ trước Tổng khởi nghĩa như thế nào?',['đào tạo','Trường Quân chính']],
  ['III-DONG-PREP',101,107,'Phạm Văn Đồng tham gia chuẩn bị căn cứ và cán bộ trong năm 1945 như thế nào?',['Tân Trào','Khu giải phóng','Trường Quân chính','hội nghị'],['R04']],
  ['III-VIET-1937',112,115,'Hoàng Quốc Việt được giao chức vụ nào vào năm 1937?',['nhân vật','năm','Bí thư Xứ ủy']],
  ['III-VIET-1941',112,116,'Hoàng Quốc Việt tham gia hoạt động nào tại Hội nghị Trung ương tháng 5/1941?',['nhân vật','hội nghị','Ban Chấp hành']],
  ['III-VIET-1943',112,117,'Hoàng Quốc Việt được giao trọng trách nào trong Tổng bộ Việt Minh năm 1943?',['nhân vật','năm','quyền Bí thư']],
  ['III-VIET-1945',112,119,'Tại Hội nghị toàn quốc của Đảng tháng 8/1945, Hoàng Quốc Việt được bầu vào cơ quan nào?',['nhân vật','hội nghị','Thường vụ'],['R04'],[[145,160]]],
  ['III-VIET-SOUTH',112,122,'Nhiệm vụ đặc phái viên vào Nam Bộ của Hoàng Quốc Việt được tài liệu mô tả ra sao?',['người giao','phạm vi nhiệm vụ','thời điểm cần đối chiếu'],['R03'],[[340,349]],undefined,'hold'],
  ['IV-COMMITTEE',125,134,'Ủy ban Khởi nghĩa toàn quốc được thành lập khi nào, gồm những ai và do ai trực tiếp phụ trách?',['thời cơ','ngày','năm thành viên','phụ trách'],['R04']],
  ['IV-ORDER-ISSUE',135,136,'Quân lệnh số 1 được cơ quan nào ban bố, vào thời điểm nào?',['đêm/ngày','cơ quan','phát lệnh'],['R04']],
  ['IV-ORDER-CONTENT',135,142,'Quân lệnh số 1 yêu cầu quân và dân hành động như thế nào?',['thời cơ','khởi nghĩa','địa phương','phối hợp','trước Đồng minh'],['R04']],
  ['IV-ORDER-AUTHORS',135,144,'Người soạn và người ký Quân lệnh số 1 có phải cùng một người không?',['Trần Huy Liệu soạn','Võ Nguyên Giáp ký','khác vai trò'],['R04'],[[89,100]]],
  ['IV-PARTY-CONFERENCE',145,152,'Hội nghị toàn quốc của Đảng tại Tân Trào tháng 8/1945 quyết định điều gì trước tình hình mới?',['thời gian/địa điểm','đại biểu','tình hình','tổng khởi nghĩa'],['R04']],
  ['IV-PRINCIPLES',145,159,'Ba nguyên tắc hành động tại Hội nghị toàn quốc của Đảng tháng 8/1945 là gì?',['tập trung','thống nhất','kịp thời','địa phương'],['R04']],
  ['IV-GIAP-ELECTION',145,160,'Võ Nguyên Giáp được bầu bổ sung vào cơ quan nào tại Hội nghị toàn quốc tháng 8/1945?',['hội nghị','Ban Chấp hành'],['R04']],
  ['IV-LOCAL-INITIATIVE',161,171,'Sau tin Nhật đầu hàng, các địa phương chủ động khởi nghĩa và tổ chức những hoạt động nào?',['điều kiện chín muồi','không chờ lệnh','mít tinh','vận động binh lính','chiếm cơ quan','giải tán/chính quyền mới']],
  ['IV-CONGRESS',172,174,'Quốc dân Đại hội Tân Trào có địa điểm và thành phần đại biểu như thế nào?',['ngày','đình Tân Trào','hơn 60','các giới/dân tộc/tôn giáo/ba miền']],
  ['IV-CONGRESS-DECISIONS',172,182,'Quốc dân Đại hội Tân Trào thông qua những quyết định quan trọng nào?',['tổng khởi nghĩa','10 chính sách','ủy ban/chủ tịch','quốc kỳ','quốc ca','ý chí đoàn kết']],
  ['IV-THAI-NGUYEN-DATES',183,187,'Ngày 16/8 và 20/8 đánh dấu hai hoạt động nào của lực lượng tiến về Thái Nguyên?',['chỉ huy','xuất phát','nhiệm vụ','tiến công'],['R05'],[[245,247],[252,252]]],
  ['IV-LIBERATION-COMMITTEE',188,192,'Ủy ban Dân tộc giải phóng Việt Nam ra mắt với tổ chức và vai trò như thế nào?',['ngày/địa điểm','Hồ Chí Minh','15 thành viên','vai trò','Phạm Văn Đồng thường trực'],[],[[101,109]]],
  ['IV-CALL',188,196,'Lời kêu gọi sau khi Ủy ban Dân tộc giải phóng ra mắt nhấn mạnh tinh thần gì?',['tự lực','tự cường','toàn dân'],['R06'],[],undefined,'hold'],
  ['IV-FOUR-PROVINCES',197,204,'Những tỉnh nào giành chính quyền ở tỉnh lỵ sớm ngày 18/8/1945?',['bốn tỉnh','hành động','tác dụng cổ vũ'],['R05']],
  ['IV-HANOI-17',205,212,'Cuộc mít tinh ngày 17/8/1945 tại Hà Nội được Việt Minh chuyển hướng như thế nào?',['bối cảnh Hà Nội','Nhà hát Lớn','tổ chức ban đầu','vận động ủng hộ'],['R05']],
  ['IV-HANOI-MORNING',205,227,'Buổi sáng ngày 19/8/1945 tại Hà Nội diễn ra những hoạt động gì?',['người tham gia','cờ/biểu ngữ','10 giờ','Nhà hát Lớn','mục tiêu','biểu tình'],['R05']],
  ['IV-HANOI-TAKEOVER',205,239,'Trong ngày 19/8/1945, lực lượng cách mạng tại Hà Nội tiếp quản chính quyền như thế nào?',['cơ quan','quần chúng/vũ trang','kết quả cuối ngày'],['R05']],
  ['IV-HANOI-MEANING',205,244,'Thắng lợi ở Hà Nội tác động thế nào đến Tổng khởi nghĩa?',['trung tâm chính trị','tiếng vang','thúc đẩy địa phương','toàn quốc'],['R05']],
  ['IV-THAI-NGUYEN-MEANING',245,252,'Thắng lợi ở Thái Nguyên ngày 20/8 có ý nghĩa gì?',['địa bàn','vị trí khu giải phóng','địa phương lân cận'],['R05']],
  ['IV-HUE',253,263,'Cuộc khởi nghĩa ở Huế ngày 23/8/1945 diễn ra và tác động đến triều Nguyễn như thế nào?',['vị trí Huế','chuẩn bị','quần chúng','chiếm cơ quan','kết quả','ý nghĩa'],['R05']],
  ['IV-SAIGON-FORCES',264,274,'Những tổ chức và lực lượng nào chuẩn bị, tham gia khởi nghĩa Sài Gòn ngày 25/8?',['Xứ ủy','Việt Minh','Sài Gòn/Chợ Lớn/lân cận','tầng lớp'],['R05']],
  ['IV-SAIGON-RESULT',264,278,'Khởi nghĩa Sài Gòn ngày 25/8 giành chính quyền bằng những hoạt động nào và có kết quả gì?',['biểu tình','tiếp quản','cơ quan','kết quả cuối ngày','ý nghĩa Nam Bộ'],['R05']],
  ['IV-MEETING-26',279,288,'Cuộc họp của Trung ương tại Hà Nội ngày 26/8/1945 bàn những nhiệm vụ gì?',['chủ trì','củng cố','chính phủ','Tuyên ngôn/lễ','đối nội/ngoại','bảo vệ','chuyển sang nhà nước']],
  ['IV-GOVERNMENT-27',289,295,'Chính phủ lâm thời ngày 27/8/1945 được hình thành và tổ chức như thế nào?',['cải tổ ủy ban','chủ tịch','Tài chính','Nội vụ','nhiệm vụ'],[],[[110,111],[326,328],[333,335]]],
  ['IV-NATIONWIDE-28',296,301,'Đến ngày 28/8/1945, kết quả Tổng khởi nghĩa trên cả nước được ghi nhận như thế nào?',['về cơ bản','cơ quan cũ','ủy ban mới','sụp đổ','hoàn thành cơ bản']],
  ['IV-ABDICATION',302,308,'Sự kiện Bảo Đại thoái vị ngày 30/8/1945 diễn ra như thế nào và có ý nghĩa gì?',['Ngọ Môn/Huế','ấn/kiếm','đại diện chính phủ','quân chủ/triều Nguyễn','ý nghĩa']],
  ['IV-DECLARATION-PLACE',310,310,'Ngày 2/9/1945, tại đâu, Chủ tịch Hồ Chí Minh thay mặt Chính phủ lâm thời đọc bản Tuyên ngôn Độc lập?',['ngày','Ba Đình/Hà Nội','người đọc','đại diện'],['R05'],[], 'cmtt45-q062'],
  ['IV-DECLARATION-CONTENT',309,318,'Tuyên ngôn Độc lập khẳng định những nội dung chính nào?',['quyền con người','Pháp','Nhật','giành chính quyền','chấm dứt chế độ','độc lập','bảo vệ']],
  ['IV-DECLARATION-QUOTE',309,320,'Câu tuyên bố về quyền tự do và độc lập được tài liệu trích như thế nào?',['nguyên văn','quyền độc lập','người nói theo nguồn'],['R06'],[],undefined,'hold'],
  ['IV-DECLARATION-MEANING',309,322,'Sự kiện ngày 2/9/1945 có ý nghĩa gì đối với sự ra đời của nhà nước mới?',['khai sinh nhà nước','thành quả cách mạng']],
  ['V-DONG',326,332,'Sau Cách mạng tháng Tám, công việc của Phạm Văn Đồng tập trung vào lĩnh vực nào?',['Tài chính','khó khăn','độc lập tài chính','củng cố','nền tảng kinh tế']],
  ['V-GIAP',333,339,'Võ Nguyên Giáp tham gia bảo vệ và tổ chức chính quyền mới qua những công việc nào?',['Nội vụ','bộ máy','an ninh/nội chính','an toàn lễ','củng cố']],
  ['V-VIET',340,349,'Hoàng Quốc Việt thực hiện những công việc gì ở Nam Bộ sau thắng lợi Tổng khởi nghĩa?',['đặc phái viên','27/8','7/9/Cao Hồng Lãnh','củng cố','Mặt trận','thống nhất','bảo vệ'],['R03'],[[112,122]],undefined,'hold'],
  ['V-CHINH',350,356,'Trường Chinh tiếp tục đóng góp vào củng cố chính quyền sau Cách mạng tháng Tám như thế nào?',['lãnh đạo Đảng','đường lối','tổ chức','nhiệm vụ cấp bách']],
  ['VII-LEADERSHIP',358,360,'Sự lãnh đạo của Đảng và Hồ Chí Minh góp phần vào thắng lợi như thế nào?',['nhiệm vụ','lực lượng','thời điểm']],
  ['VII-PREPARATION',361,367,'Quá trình chuẩn bị lâu dài đã xây dựng những nền tảng nào cho thắng lợi?',['chính trị','vũ trang','căn cứ','Mặt trận','Đảng/Việt Minh'],[],[[16,16],[22,22]]],
  ['VII-UNITY',368,369,'Tinh thần đoàn kết toàn dân được thể hiện qua những lực lượng nào?',['tầng lớp','ngành nghề','dân tộc','tôn giáo']],
  ['VII-FORCES',370,371,'Đấu tranh chính trị và đấu tranh vũ trang phối hợp với vai trò như thế nào?',['chủ yếu','hỗ trợ','nòng cốt/bảo vệ']],
  ['VII-OBJECTIVE',372,377,'Những điều kiện khách quan nào tạo thời cơ cho Cách mạng tháng Tám?',['chiến tranh','Nhật đầu hàng','suy yếu','Đồng minh chưa vào','thời cơ']],
  ['VIII-VIETNAM',378,385,'Cách mạng tháng Tám có ý nghĩa gì đối với Việt Nam?',['thống trị','thuộc địa/quân chủ','nhà nước','nhân dân làm chủ','độc lập/tự do','cơ sở chính trị/pháp lý']],
  ['VIII-WORLD',386,389,'Cách mạng tháng Tám có ý nghĩa gì đối với thế giới?',['giải phóng dân tộc','chống phát xít/thực dân','sức mạnh đoàn kết/tổ chức/đường lối']],
];

export const nextBatchKeys = ['I-GERMANY','II-CONFERENCE8','II-MILITARY'];
export function buildGenerationPlan(manifest) {
  if (manifest.document !== 'Tong-hop-kien-thuc-moi.docx' || manifest.sourceSha256 !== 'fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e') throw Error('Unexpected planning source');
  const byOrder = new Map(manifest.blocks.map(b => [b.order,b]));
  const units = plannedIntents.map(([key,start,end,question,facets,warnings=[],support=[],existingQuestionId,decision='propose']) => {
    const blocks = Array.from({length:end-start+1},(_,i)=>byOrder.get(start+i));
    if(blocks.some(b=>!b) || new Set(blocks.map(b=>b.sectionId)).size !== 1 && key !== 'VIII-VIETNAM') throw Error('Invalid context range: '+key);
    const text = blocks.map(b=>b.text).join('\n');
    if(text.length>6000) throw Error('Context too long: '+key);
    return {key,section:blocks[0].sectionId.split('.')[0],sectionId:blocks[0].sectionId,questionIntent:question,facets,
      source:{document:manifest.document,sha256:manifest.sourceSha256,blockIds:blocks.map(b=>b.id),paragraphStart:blocks[0].paragraphIndex,paragraphEnd:blocks.at(-1).paragraphIndex},
      context:{id:`planning:${key}`,text,assembly:blocks.length===1?'single_paragraph':'verbatim_contiguous_paragraphs',readyInCurrentParagraphOnlyPilot:blocks.length===1},
      supportingRanges:support.map(([a,b])=>Array.from({length:b-a+1},(_,i)=>byOrder.get(a+i).id)),
      warnings:['R10',...warnings],status:existingQuestionId?'existing_draft':decision==='hold'?'hold_for_source_review':'proposed_not_authorized',existingQuestionId:existingQuestionId||null};
  });
  const proposed = units.filter(u=>u.status==='proposed_not_authorized');
  const next = nextBatchKeys.map(k=>proposed.find(u=>u.key===k));
  const rest=proposed.filter(u=>!nextBatchKeys.includes(u.key));
  const batches=[{id:'B01',unitKeys:next.map(u=>u.key),maximumCalls:3,maximumNewDrafts:3,status:'awaiting_owner_confirmation'}];
  for(let i=0;i<rest.length;i+=3) batches.push({id:`B${String(batches.length+1).padStart(2,'0')}`,unitKeys:rest.slice(i,i+3).map(u=>u.key),maximumCalls:rest.slice(i,i+3).length,maximumNewDrafts:rest.slice(i,i+3).length,status:'future_not_authorized'});
  const counts={units:units.length,existing:units.filter(u=>u.existingQuestionId).length,proposed:proposed.length,held:units.filter(u=>u.status==='hold_for_source_review').length,facets:units.reduce((n,u)=>n+u.facets.length,0)};
  const sections=[...new Set(units.map(u=>u.section))].map(section=>{const rows=units.filter(u=>u.section===section);return {section,units:rows.length,existing:rows.filter(u=>u.existingQuestionId).length,proposed:rows.filter(u=>u.status==='proposed_not_authorized').length,held:rows.filter(u=>u.status==='hold_for_source_review').length};});
  return {schemaVersion:1,kind:'editorial_generation_plan_not_knowledge_drafts',sourceDocument:manifest.document,sourceSha256:manifest.sourceSha256,counts,sections,units,batches,
    coverage:{definition:'Completed draft intents / planned meaningful intents; not historical approval, paragraph coverage or alias coverage.',draftIntentPercent:Number((100*counts.existing/counts.units).toFixed(2)),publishedIntentPercent:0},
    excluded:{formatting:[0,1,3,13,21,77,123,124,324,325,357,394],citationFragments:[76,323],conclusionRepetition:[390,391,392,393]},
    safeguards:{generationCallsAuthorized:0,importAuthorized:false,writeDatabase:false,requiresSourceReview:true,preserveExistingDrafts:true}};
}
