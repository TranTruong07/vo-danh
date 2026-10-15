// Offline editorial proposals. Never import this module from the application.
import {
  KNOWLEDGE_TOPIC, normalizeKnowledgePhrase,
  type ExtractionManifest, type KnowledgeDraft, type KnowledgeCharacterId,
} from "../../server/domain/knowledge";

export const questionId = (n: number) => `cmtt45-q${String(n).padStart(3, "0")}`;
export const revisionRepairs = [13, 9, 11, 22, 24, 25, 28, 29, 31] as const;
// Alias-only revisions address gaps observed BEFORE the independent holdout.
export const aliasAdditions: Record<number, string[]> = {
  1: ["Ai lãnh đạo Cách mạng tháng Tám?"],
  2: ["Người dân trở thành người làm chủ đất nước sau thắng lợi nào?"],
  3: ["Nhật đầu hàng vào ngày nào?"],
  9: ["Việt Minh là viết tắt của tên gì?", "Việt Minh tên đầy đủ là gì?", "Viet Minh la viet tat cua ten gi?"],
  11: ["Phá kho thóc có tác dụng gì?", "Cao trào kháng Nhật cứu nước diễn ra trong thời gian nào?"],
  17: ["Hà Nội giành chính quyền ngày nào?"],
  18: ["Huế khởi nghĩa thắng lợi hôm nào?"],
  20: ["Ai đọc Tuyên ngôn Độc lập ở Ba Đình?"],
  23: ["Lê Duẩn bị giam ở đâu năm 1940?"],
  24: ["Phạm Văn Đồng làm bộ trưởng bộ nào sau cách mạng?"],
  25: ["Cách mạng tháng Tám có phải chỉ là một chiến dịch quân sự?"],
  26: ["Võ Nguyên Giáp tiến về giải phóng nơi nào?"],
  33: ["Nhật đầu hàng thì Việt Nam tự động độc lập phải không?"],
};

interface Proposal {
  proposalId: string; number: number; canonical: string; aliases: string[];
  blocks: Array<number | string>; clauses: string[]; reviewNote?: string;
}

export const newProposals: Proposal[] = [
  {
    proposalId: "N01", number: 41,
    canonical: "Những giai cấp, tầng lớp nào tham gia Cách mạng tháng Tám và quy mô tham gia ra sao?",
    aliases: ["Lực lượng nhân dân tham gia Cách mạng tháng Tám gồm những ai?", "Quy mô và thành phần quần chúng trong thắng lợi tháng Tám là gì?"],
    blocks: [7, 124], clauses: [
      "Quần chúng tham gia Cách mạng tháng Tám gồm công nhân, nông dân, thanh niên, trí thức và các tầng lớp yêu nước.",
      "Hàng triệu người thuộc các giai cấp, tầng lớp và địa phương khác nhau tham gia phong trào. Sức mạnh quần chúng, dưới sự tổ chức và lãnh đạo cách mạng, là nhân tố trực tiếp quyết định việc giành chính quyền.",
    ],
  },
  {
    proposalId: "N02", number: 42,
    canonical: "Khởi nghĩa ở nông thôn và thành thị được kết hợp như thế nào theo tài liệu?",
    aliases: ["Tài liệu nêu quan hệ giữa khởi nghĩa nông thôn và thành thị ra sao?", "Hình thức đấu tranh tháng Tám kết hợp những địa bàn nào?"],
    blocks: [8], clauses: ["Cách mạng tháng Tám kết hợp khởi nghĩa ở nông thôn và thành thị.", "Đồng thời, hình thức đấu tranh kết hợp đấu tranh chính trị với đấu tranh vũ trang."],
    reviewNote: "Nguồn chỉ khẳng định sự kết hợp; không suy ra thứ tự nông thôn trước hay thành thị trước, không thêm chiến thuật cụ thể.",
  },
  {
    proposalId: "N03", number: 43,
    canonical: "Chiến tranh thế giới thứ hai bùng nổ khi nào và làm thay đổi bối cảnh ra sao?",
    aliases: ["Tháng nào năm nào Chiến tranh thế giới thứ hai bùng nổ?", "Bối cảnh chính trị và quân sự thế giới giai đoạn 1939–1945 biến đổi thế nào?"],
    blocks: [13, 14], clauses: ["Chiến tranh thế giới thứ hai bùng nổ tháng 9/1939.", "Trong những năm 1939–1945, chiến tranh diễn ra quyết liệt, làm thay đổi sâu sắc tình hình chính trị và quân sự thế giới."],
  },
  {
    proposalId: "N04", number: 44,
    canonical: "Đức tấn công Liên Xô khi nào và tác động gì tới chiến tranh?",
    aliases: ["Tháng 6/1941 có sự kiện gì làm chiến tranh mở rộng?", "Cuộc tấn công Liên Xô của Đức diễn ra khi nào, ảnh hưởng ra sao?"],
    blocks: [15], clauses: ["Tháng 6/1941, Đức tấn công Liên Xô.", "Sự kiện khiến chiến tranh mở rộng và bước vào giai đoạn quyết liệt hơn."],
  },
  {
    proposalId: "N05", number: 45,
    canonical: "Việc Nhật mở rộng chiến tranh ở châu Á – Thái Bình Dương đe dọa điều gì?",
    aliases: ["Nhật mở rộng chiến tranh ở khu vực châu Á – Thái Bình Dương ảnh hưởng tới hệ thống nào?", "Hệ thống thuộc địa phương Tây bị đe dọa ra sao khi Nhật mở rộng chiến tranh?"],
    blocks: [16], clauses: ["Ở châu Á – Thái Bình Dương, Nhật Bản mở rộng chiến tranh.", "Việc này trực tiếp đe dọa hệ thống thuộc địa của các cường quốc phương Tây."],
  },
  {
    proposalId: "N06", number: 46,
    canonical: "Nhật vào Đông Dương khi nào; bộ máy cai trị Pháp lúc đó còn tồn tại không?",
    aliases: ["Quân Nhật tiến vào Đông Dương tháng mấy năm nào?", "Khi Nhật vào Đông Dương tháng 9/1940, bộ máy Pháp có còn tồn tại?"],
    blocks: [20], clauses: ["Tháng 9/1940, quân Nhật tiến vào Đông Dương, trong khi bộ máy cai trị của Pháp vẫn tiếp tục tồn tại.", "Việt Nam khi đó chịu ách thống trị của thực dân Pháp và phát xít Nhật."],
  },
  {
    proposalId: "N07", number: 47,
    canonical: "Nạn đói cuối 1944 – đầu 1945 diễn ra ở đâu, quy mô và tác động tới phong trào là gì?",
    aliases: ["Nạn đói năm 1945 ảnh hưởng đến phong trào ra sao?", "Nạn đói cuối năm 1944 đầu năm 1945 tác động thế nào tới mâu thuẫn với Nhật – Pháp?"],
    blocks: [23], clauses: ["Nạn đói nghiêm trọng cuối năm 1944 – đầu năm 1945, đặc biệt ở miền Bắc, khiến hàng triệu người chết hoặc rơi vào cảnh đói khổ.", "Tình cảnh ấy làm sâu sắc thêm mâu thuẫn giữa nhân dân Việt Nam với chế độ thống trị Nhật – Pháp, đồng thời thúc đẩy phong trào đấu tranh."],
    reviewNote: "Giữ đúng 'hàng triệu người chết hoặc rơi vào cảnh đói khổ'; không đổi thành một số người chết xác định.",
  },
  {
    proposalId: "N08", number: 48,
    canonical: "Giai đoạn 1941–1944 chuẩn bị tổ chức cứu quốc, du kích, cán bộ và phương án khởi nghĩa thế nào?",
    aliases: ["Những lực lượng và cán bộ nào được chuẩn bị trong giai đoạn 1941–1944?", "Trước năm 1945, các tổ chức cứu quốc, đội du kích và phương án khởi nghĩa được chuẩn bị ra sao?"],
    blocks: [35, 36, 37, 39, 40], clauses: [
      "Trong giai đoạn 1941–1944, cách mạng phát triển các tổ chức cứu quốc, mở rộng cơ sở cách mạng trong quần chúng để chuẩn bị các điều kiện khởi nghĩa.",
      "Cũng trong giai đoạn này, các đội du kích được tổ chức, lực lượng vũ trang được phát triển; cán bộ chính trị, quân sự được đào tạo và phương án khởi nghĩa được chuẩn bị.",
    ],
  },
  {
    proposalId: "N09", number: 49,
    canonical: "Căn cứ Cao Bằng được xây dựng và mở rộng trong giai đoạn nào?",
    aliases: ["Giai đoạn 1941–1944 căn cứ Cao Bằng phát triển thế nào?", "Việc xây dựng căn cứ địa Cao Bằng và mở rộng vùng lân cận thuộc giai đoạn nào?"],
    blocks: [35, 38], clauses: ["Trong giai đoạn 1941–1944, căn cứ địa Cao Bằng được xây dựng.", "Địa bàn hoạt động từng bước được mở rộng ra các vùng lân cận."],
    reviewNote: "Không thêm ngày thành lập riêng hoặc tên các vùng lân cận; nguồn không nêu.",
  },
  {
    proposalId: "N10", number: 50,
    canonical: "Hội nghị quân sự cách mạng Bắc Kỳ tháng 4/1945 nhằm mục đích gì?",
    aliases: ["Hội nghị quân sự Bắc Kỳ tháng 4 năm 1945 nhằm mục đích gì?", "Hội nghị quân sự cách mạng Bắc Kỳ được triệu tập khi nào và để làm gì?"],
    blocks: [50], clauses: ["Hội nghị quân sự cách mạng Bắc Kỳ được triệu tập tháng 4/1945.", "Hội nghị nhằm thống nhất lực lượng vũ trang và đẩy mạnh chuẩn bị khởi nghĩa."],
  },
  {
    proposalId: "N11", number: 51,
    canonical: "Trong các ngày 14–18/8/1945, các địa phương giành chính quyền như thế nào?",
    aliases: ["Khởi nghĩa tại các địa phương từ 14 đến 18/8/1945 diễn biến ra sao?", "Có địa phương nào thắng lợi trước ngày Hà Nội khởi nghĩa theo tài liệu không?"],
    blocks: [61], clauses: ["Trong các ngày 14–18/8/1945, nhiều địa phương chủ động nổi dậy giành chính quyền; một số nơi giành thắng lợi trước ngày Hà Nội khởi nghĩa.", "Phong trào lan rộng nhanh chóng khi thời cơ cách mạng xuất hiện."],
    reviewNote: "Không nêu tên hoặc số lượng tỉnh thắng lợi sớm; nguồn không cung cấp.",
  },
  {
    proposalId: "N12", number: 52,
    canonical: "Mốc 28/8/1945 và việc kiện toàn Chính phủ lâm thời có ý nghĩa gì?",
    aliases: ["Ngày 28/8/1945 có sự kiện gì?", "Tổng khởi nghĩa cơ bản thắng lợi khi nào và Chính phủ lâm thời chuẩn bị việc gì?"],
    blocks: [65], clauses: ["Đến ngày 28/8/1945, Tổng khởi nghĩa cơ bản thắng lợi, chính quyền cách mạng được thiết lập trên phạm vi cả nước.", "Chính phủ lâm thời được kiện toàn, chuẩn bị cho việc công bố nền độc lập của Việt Nam."],
  },
  {
    proposalId: "N13", number: 53,
    canonical: "Trường Chinh tên thật là gì, sống trong những năm nào và giữ cương vị gì khi đó?",
    aliases: ["Trường Chinh tên thật là gì?", "Năm sinh, năm mất và cương vị của Trường Chinh thời Cách mạng tháng Tám là gì?"],
    blocks: [77], clauses: ["Trường Chinh sinh năm 1907, mất năm 1988, tên thật là Đặng Xuân Khu.", "Ông giữ cương vị Tổng Bí thư Đảng Cộng sản Đông Dương trong giai đoạn chuẩn bị và tiến hành Cách mạng tháng Tám năm 1945."],
  },
  {
    proposalId: "N14", number: 54,
    canonical: "Lê Duẩn sống trong những năm nào và hoạt động gắn với địa bàn nào theo từng thời kỳ?",
    aliases: ["Năm sinh, năm mất và địa bàn hoạt động của Lê Duẩn được tài liệu nêu thế nào?", "Lê Duẩn gắn với Nam Kỳ và Nam Bộ ra sao, cần lưu ý thời gian bị giam thế nào?"],
    blocks: [85, 111, 167], clauses: [
      "Lê Duẩn sinh năm 1907, mất năm 1986; tài liệu giới thiệu ông là cán bộ lãnh đạo hoạt động lâu năm ở Nam Kỳ và Nam Bộ, gắn bó với phong trào chống thực dân Pháp và các tổ chức cách mạng miền Nam.",
      "Phần đính chính nêu Lê Duẩn bị Pháp bắt năm 1940, đày ra Côn Đảo và chỉ được đón về đất liền sau khi Cách mạng tháng Tám thành công. Đóng góp cần đặt trong hoạt động trước đó và lãnh đạo kháng chiến ở Nam Bộ sau cách mạng, không gán cho trực tiếp chỉ đạo khởi nghĩa Nam Bộ tháng 8/1945.",
    ],
  },
  {
    proposalId: "N15", number: 55,
    canonical: "Phạm Văn Đồng sống trong những năm nào và tham gia phong trào từ khi nào theo tài liệu?",
    aliases: ["Tài liệu giới thiệu năm sinh, năm mất và quá trình hoạt động ban đầu của Phạm Văn Đồng thế nào?", "Phạm Văn Đồng tham gia phong trào yêu nước và cộng sản từ sớm phải không?"],
    blocks: [92], clauses: ["Phạm Văn Đồng sinh năm 1906, mất năm 2000, là nhà lãnh đạo cách mạng hoạt động trong phong trào yêu nước và phong trào cộng sản từ sớm.", "Ông có nhiều đóng góp trong quá trình chuẩn bị và tổ chức chính quyền cách mạng. Đoạn nguồn này chỉ nói 'từ sớm', không nêu năm bắt đầu hoạt động cụ thể."],
  },
  {
    proposalId: "N16", number: 56,
    canonical: "Võ Nguyên Giáp sống trong những năm nào và được giới thiệu ở vai trò gì?",
    aliases: ["Năm sinh, năm mất và vai trò quân sự của Võ Nguyên Giáp theo tài liệu là gì?", "Tài liệu giới thiệu tiểu sử cơ bản Võ Nguyên Giáp thế nào?"],
    blocks: [100], clauses: ["Võ Nguyên Giáp sinh năm 1911, mất năm 2013, được tài liệu giới thiệu là nhà lãnh đạo quân sự xuất sắc của cách mạng Việt Nam.", "Ông có đóng góp quan trọng trong xây dựng lực lượng vũ trang và tổ chức thực hiện các nhiệm vụ quân sự trước và trong Cách mạng tháng Tám."],
  },
  {
    proposalId: "N17", number: 57,
    canonical: "Hoạt động xây dựng cơ sở và vận động quần chúng của Lê Duẩn cần đặt vào những thời kỳ nào?",
    aliases: ["Cần hiểu hoạt động xây dựng cơ sở Đảng của Lê Duẩn ở miền Nam như thế nào khi đọc phần đính chính?", "Hoạt động tổ chức lực lượng, vận động quần chúng của Lê Duẩn có thể gán cho tháng 8/1945 không?"],
    blocks: [87, 90, "body/109/row/2/cell/1/1", 111, 167], clauses: [
      "Mục V.2 mô tả quá trình hoạt động của Lê Duẩn gắn với xây dựng cơ sở Đảng, tổ chức lực lượng và vận động quần chúng trong điều kiện thực dân Pháp đàn áp phong trào; bảng V.5 tóm tắt đóng góp xây dựng cơ sở và phát triển phong trào ở Nam Bộ.",
      "Phải đọc mô tả ấy cùng đính chính: Lê Duẩn bị Pháp bắt năm 1940, đày ra Côn Đảo, chỉ được đón về đất liền sau khi Cách mạng tháng Tám thành công. Đóng góp cần đặt trong quá trình hoạt động cách mạng trước đó và lãnh đạo kháng chiến ở Nam Bộ sau cách mạng, không gán cho trực tiếp chỉ đạo khởi nghĩa Nam Bộ tháng 8/1945.",
      "Nguồn chưa xác định thời điểm riêng cho từng hoạt động xây dựng cơ sở, tổ chức lực lượng hay vận động quần chúng; không thể dùng mô tả chung để đặt những hoạt động ấy vào một ngày hoặc chức trách cụ thể trong tháng 8/1945.",
    ],
    reviewNote: "N17: đối chiếu V.2/V.5/body111/IX.4; đủ căn cứ cho câu trả lời có giới hạn như trên, chưa đủ để gán ngày/chức trách từng hoạt động. Cần quản trị viên duyệt, không coi mâu thuẫn đã được giải quyết.",
  },
  {
    proposalId: "N18", number: 58,
    canonical: "Điều kiện riêng và sức mạnh tập thể tại Nam Bộ góp phần giành chính quyền thế nào?",
    aliases: ["Phong trào Nam Bộ có đặc điểm và lực lượng nào làm nên thắng lợi giành chính quyền?", "Vì sao không thể quy thắng lợi Sài Gòn ngày 25/8/1945 cho riêng Lê Duẩn?"],
    blocks: [86, 88, 89, 90, "body/109/row/2/cell/1/1", "body/109/row/2/cell/2/1", 111, 167], clauses: [
      "Nam Bộ có điều kiện, lực lượng và diễn biến cách mạng riêng. Phong trào ở Nam Kỳ trước và trong năm 1945 góp phần tạo nên lực lượng chính trị cho cuộc đấu tranh giành chính quyền.",
      "Thắng lợi giành chính quyền ở Sài Gòn ngày 25/8/1945 và sự lan rộng tại các tỉnh Nam Bộ là kết quả của vận động cách mạng tại chỗ, sự lãnh đạo của các tổ chức Đảng và đông đảo quần chúng tham gia.",
      "Không quy thắng lợi ấy cho riêng Lê Duẩn: phần đính chính nêu ông bị Pháp bắt năm 1940, đày Côn Đảo, chỉ trở về đất liền sau khi Cách mạng tháng Tám thành công và tham gia kháng chiến ở Nam Bộ. Không trình bày ông trực tiếp chỉ đạo khởi nghĩa Nam Bộ tháng 8/1945; quyết định tổng khởi nghĩa toàn quốc thuộc Trung ương Đảng và Chủ tịch Hồ Chí Minh.",
    ],
    reviewNote: "N18: tách chủ thể phong trào địa phương khỏi Lê Duẩn; không thêm tên tổ chức/cán bộ, điều kiện riêng cụ thể hoặc ngày về đất liền mà nguồn không nêu. Cần người quản trị duyệt cùng N17.",
  },
  {
    proposalId: "N19", number: 59,
    canonical: "Bài học kết hợp chỉ đạo thống nhất với chủ động địa phương là gì?",
    aliases: ["Địa phương cần hành động thế nào bên cạnh chủ trương lãnh đạo chung?", "Vì sao phải kết hợp lãnh đạo thống nhất và sự chủ động ở địa phương?"],
    blocks: [160, 161], clauses: ["Chủ trương chung tạo định hướng thống nhất.", "Các địa phương cần chủ động căn cứ tình hình thực tế để tổ chức hành động phù hợp, không thụ động chờ đợi."],
  },
];

// Retain EVERY neutral clause verbatim in each complete educational persona.
// Different address, teaching rhythm and transitions; no invented memory or quote.
export function fullPersonaAnswers(clauses: string[], variant: number): Record<KnowledgeCharacterId, string> {
  const first = clauses[0], rest = clauses.slice(1);
  return {
    "truong-chinh": `${variant % 2 ? "Ta cùng phân tích từng ý, cháu nhé." : "Cháu sắp xếp các ý theo trình tự này nhé."}\n${clauses.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
    "le-duan": `${first}\nCháu nắm chắc ý đó, rồi nối với phần tiếp theo nhé. ${rest.join("\n")}\nNắm đủ các ý sẽ giúp cháu tránh hiểu lệch câu chuyện.`,
    "pham-van-dong": `Cháu nhé, mình cùng đọc chậm từng phần để dễ hiểu. ${first}\n${rest.map(s => `Tư liệu còn làm rõ: ${s}`).join("\n")}`,
    "vo-nguyen-giap": `Cháu ghi nhớ các điểm trong tư liệu nhé:\n${clauses.map(s => `• ${s}`).join("\n")}\nKhi ôn lại, cháu đối chiếu đủ các điểm này để không bỏ sót.`,
  };
}

function sourceFor(manifest: ExtractionManifest, refs: Array<number | string>) {
  const ids = new Set(refs.map(ref => typeof ref === "number" ? `body/${ref}` : ref));
  const selected = manifest.blocks.filter(block => ids.has(block.id));
  if (selected.length !== ids.size) throw new Error("Missing source locator.");
  const first = selected[0];
  return {
    document: manifest.document, sectionId: first.sectionId, sourceSha256: manifest.sourceSha256,
    excerpt: selected.map(block => block.text).join("\n"), blockIds: selected.map(block => block.id),
    paragraphIndex: first.paragraphIndex,
    ...(selected.some(block => block.tableIndex !== undefined) ? { tableIndex: 0 } : {}),
  };
}

export function buildPhase25Drafts(baseline: KnowledgeDraft[], manifest: ExtractionManifest, now: string) {
  if (baseline.length !== 40 || baseline.some(q => q.status !== "draft" || q.version !== 3 || q.reviewedBy || q.reviewedAt)) throw new Error("Expected immutable 40 draft v3 records.");
  if (manifest.sourceSha256 !== "e6e605448defbca119fcd114682fd61604a0cf2ba48d6dfd614fd91c8223ec7b") throw new Error("Source changed: editorial reconciliation required.");
  const changes: { questionId: string; proposalId: string; kind: string; previousVersion: number | null; version: number; clauses: string[] }[] = [];
  const drafts = baseline.map(old => {
    const number = Number(old._id.slice(-3));
    const repairIndex = revisionRepairs.indexOf(number as typeof revisionRepairs[number]);
    const added = aliasAdditions[number] || [];
    if (repairIndex < 0 && !added.length) return structuredClone(old);
    const q = structuredClone(old);
    q.version = 4; q.updatedAt = now;
    let clauses: string[] = [];
    if (repairIndex >= 0) {
      // Preserve every prior neutral fact, restore them ALL to each persona.
      clauses = q.approvedAnswer.split("\n");
      if (number === 13) {
        clauses.push("Sự thất bại của phát xít Nhật còn tạo thời cơ khách quan đặc biệt thuận lợi cho các dân tộc đang đấu tranh giải phóng, trong đó có Việt Nam.");
        q.source = sourceFor(manifest, [18, ...q.source.blockIds]);
      }
      if (number === 11) {
        clauses.unshift("Giai đoạn cao trào kháng Nhật cứu nước được tài liệu xác định là tháng 3–8/1945. Sau cuộc đảo chính Pháp ngày 9/3/1945, Đảng phát động cao trào kháng Nhật cứu nước.");
        q.source = sourceFor(manifest, [42, 43, ...q.source.blockIds]);
      }
      q.sectionId = q.source.sectionId;
      q.approvedAnswer = clauses.join("\n");
      q.characterAnswers = fullPersonaAnswers(clauses, number);
    }
    q.aliases = [...q.aliases, ...added];
    q.normalizedPhrases = [q.canonicalQuestion, ...q.aliases].map(normalizeKnowledgePhrase);
    const proposalId = repairIndex >= 0 ? `R${String(repairIndex + 1).padStart(2, "0")}` : `A${String(number).padStart(3, "0")}`;
    q.reviewNotes.push(`Phase 2.5 ${proposalId}: revision mới, chưa duyệt. ${repairIndex >= 0 ? "Khôi phục đầy đủ neutral vào bốn persona; bổ sung locator khi cần." : "Chỉ bổ sung aliases từ khoảng trống audit cũ; không sửa nội dung đáp án."} Mọi alias cần duyệt về nghĩa. Không dùng bộ holdout để biên tập.`);
    changes.push({ questionId: q._id, proposalId, kind: repairIndex >= 0 ? "content_repair" : "aliases_only", previousVersion: 3, version: 4, clauses });
    return q;
  });
  for (const proposal of newProposals) {
    const source = sourceFor(manifest, proposal.blocks);
    const q: KnowledgeDraft = {
      _id: questionId(proposal.number), topicId: KNOWLEDGE_TOPIC, sectionId: source.sectionId,
      canonicalQuestion: proposal.canonical, aliases: proposal.aliases,
      normalizedPhrases: [proposal.canonical, ...proposal.aliases].map(normalizeKnowledgePhrase),
      approvedAnswer: proposal.clauses.join("\n"), characterAnswers: fullPersonaAnswers(proposal.clauses, proposal.number),
      source, status: "draft", version: 1, createdAt: now, updatedAt: now,
      reviewNotes: [
        `Phase 2.5 ${proposal.proposalId}: đề xuất mới từ coverage audit, chưa duyệt.`,
        "Bốn lời đáp là mô phỏng giáo dục, không phải phát ngôn hoặc hồi ức của nhân vật. Từng lời đáp giữ đủ các mệnh đề neutral; quản trị viên vẫn phải duyệt nguồn, nội dung và ý nghĩa aliases.",
        ...(proposal.reviewNote ? [proposal.reviewNote] : []),
      ],
    };
    drafts.push(q);
    changes.push({ questionId: q._id, proposalId: proposal.proposalId, kind: "new_question", previousVersion: null, version: 1, clauses: proposal.clauses });
  }
  return { drafts, changes };
}
