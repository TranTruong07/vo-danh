import "server-only";
import { ChatError } from "@/server/domain/chat";
import { KNOWLEDGE_CHARACTERS, type KnowledgeCharacterId } from "@/server/domain/knowledge";

// Educational design conventions, not historical quotations or first-person memories.
export const CHAT_PERSONAS = {
  "truong-chinh": {
    name: "Trường Chinh", displayName: "Trường Chinh — mô phỏng giáo dục",
    introText: "Chào cháu. Ta cùng tìm hiểu từng vấn đề qua tư liệu Cách mạng tháng Tám năm 1945 nhé.",
    refusalText: "Cháu nhé, tư liệu Cách mạng tháng Tám năm 1945 đã được duyệt chưa có đủ căn cứ cho câu hỏi này. Ta có thể cùng tìm hiểu về bối cảnh, sự chuẩn bị hoặc diễn biến trong tài liệu.",
  },
  "le-duan": {
    name: "Lê Duẩn", displayName: "Lê Duẩn — mô phỏng giáo dục",
    introText: "Chào cháu! Ta cùng tìm hiểu phong trào cách mạng qua những nội dung đã được duyệt nhé.",
    refusalText: "Câu này mình chưa có đủ tư liệu đã duyệt để cùng cháu làm rõ. Cháu có thể hỏi về phong trào, lực lượng tham gia hoặc diễn biến Cách mạng tháng Tám năm 1945 trong tài liệu nhé.",
  },
  "pham-van-dong": {
    name: "Phạm Văn Đồng", displayName: "Phạm Văn Đồng — mô phỏng giáo dục",
    introText: "Chào cháu, cứ hỏi điều cháu muốn hiểu nhé. Ta sẽ cùng đọc những nội dung đã được duyệt trong tài liệu.",
    refusalText: "Cháu hỏi thêm về nội dung trong tài liệu nhé. Với câu này, phần tư liệu Cách mạng tháng Tám năm 1945 đã duyệt chưa đủ để trả lời. Ta có thể bắt đầu từ diễn biến, kết quả hoặc ý nghĩa của cuộc cách mạng.",
  },
  "vo-nguyen-giap": {
    name: "Võ Nguyên Giáp", displayName: "Võ Nguyên Giáp — mô phỏng giáo dục",
    introText: "Chào cháu! Ta cùng theo dõi các mốc sự kiện và sự chuẩn bị lực lượng trong tư liệu nhé.",
    refusalText: "Ta cùng bám sát tư liệu nhé, cháu. Câu hỏi này chưa có câu trả lời trong nội dung Cách mạng tháng Tám năm 1945 đã được duyệt. Cháu có thể hỏi về các mốc sự kiện hoặc việc chuẩn bị lực lượng được nêu trong tài liệu.",
  },
} satisfies Record<KnowledgeCharacterId, { name: string; displayName: string; introText: string; refusalText: string }>;

export const CHARACTER_ENV_KEYS: Record<KnowledgeCharacterId, string> = {
  "truong-chinh": "CHAT_CHARACTER_TRUONG_CHINH_ID", "le-duan": "CHAT_CHARACTER_LE_DUAN_ID",
  "pham-van-dong": "CHAT_CHARACTER_PHAM_VAN_DONG_ID", "vo-nguyen-giap": "CHAT_CHARACTER_VO_NGUYEN_GIAP_ID",
};
export function resolveMappedCharacter(databaseId: string, env: NodeJS.ProcessEnv = process.env): KnowledgeCharacterId {
  const map = new Map<string, KnowledgeCharacterId>();
  for (const id of KNOWLEDGE_CHARACTERS) {
    const value = env[CHARACTER_ENV_KEYS[id]]?.trim().toLowerCase();
    if (!value) continue;
    if (!/^[a-f0-9]{24}$/.test(value) || map.has(value)) throw new ChatError("CHAT_CONFIGURATION", "Trò chuyện đang được cấu hình. Vui lòng quay lại sau.", 503);
    map.set(value, id);
  }
  const character = map.get(databaseId);
  if (!character) throw new ChatError("CHARACTER_UNAVAILABLE", "Nhân vật này chưa có phần trò chuyện trong bộ tư liệu.", 403);
  return character;
}
