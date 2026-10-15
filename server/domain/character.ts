import { isVietnameseVoice } from "./speech";

export interface CharacterInput {
  name: string;
  openingLine: string;
  backgroundImage: string;
  image: string;
  voiceName?: string;
}
export interface CharacterRecord extends CharacterInput { id: string; updatedAt: string }
export type PublicCharacter = Pick<CharacterRecord, "id" | "name" | "openingLine" | "backgroundImage" | "image" | "voiceName">;
export const DEFAULT_CHARACTER_BACKGROUND = "/images/history-landscape.webp";
export class GameError extends Error {}
export const isCharacterId = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{24}$/.test(value);

export function validateCharacter(input: CharacterInput) {
  if (input.voiceName && !isVietnameseVoice(input.voiceName)) throw new GameError("Vui lòng chọn giọng tiếng Việt của Google Cloud TTS.");
  if (input.name.length < 2 || input.name.length > 120) throw new GameError("Tên nhân vật cần từ 2 đến 120 ký tự.");
  if (!input.openingLine || input.openingLine.length > 1000) throw new GameError("Câu nói mở đầu cần từ 1 đến 1.000 ký tự.");
  for (const [label, image] of [["Ảnh nhân vật", input.image], ["Ảnh nền", input.backgroundImage]]) {
    if (/^\/images\/[\w./-]+$/.test(image)) continue;
    let url: URL;
    try { url = new URL(image); } catch { throw new GameError(`${label}: nhập URL HTTPS hoặc tải ảnh lên.`); }
    if (url.protocol !== "https:" || url.username || url.password || image.length > 2000) throw new GameError(`${label}: URL phải dùng HTTPS và tối đa 2.000 ký tự.`);
  }
  return input;
}

// QR data is an identifier only. Never navigate to an arbitrary decoded URL.
export function characterIdFromQr(raw: string): string | null {
  const text = raw.trim();
  if (isCharacterId(text)) return text;
  try {
    const url = new URL(text);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    const match = url.pathname.match(/^\/play\/([a-f0-9]{24})\/?$/);
    return match?.[1] ?? null;
  } catch { return null; }
}
