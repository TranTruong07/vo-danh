import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { normalizeKnowledgePhrase, type KnowledgeCharacterId } from '@/server/domain/knowledge';

export const historyHash = (text: string) => createHash('sha256').update(text).digest('hex');
export function sanitizeChatText(raw: string, max = 500): { text: string; redacted: boolean } {
  const clean = raw.normalize('NFC').replace(/[\p{Cc}\p{Cf}]/gu, ' ').replace(/\s+/gu, ' ').trim();
  // Do not retain credential-like messages, even when the apparent token is short.
  if (/(?:api[ _-]?key|password|mật khẩu|mat khau|bearer\s|mongodb(?:\+srv)?:\/\/|cookie\s*[:=]|session[_-]?token)/iu.test(clean)) {
    return { text: '[Nội dung có thể chứa thông tin nhạy cảm đã được ẩn]', redacted: true };
  }
  const text = clean.replace(/https?:\/\/\S+/giu, '[liên kết đã ẩn]')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/giu, '[email đã ẩn]')
    .replace(/(?:\+?\d[ .()-]*){9,}/gu, '[số liên hệ đã ẩn]')
    .replace(/[a-z0-9_=-]{32,}/giu, '[chuỗi định danh đã ẩn]').slice(0, max);
  return { text, redacted: text !== clean };
}
export function chatGroupId(character: KnowledgeCharacterId, text: string, redacted = false, interactionId: string = randomUUID()): string {
  // Redaction can collapse unrelated questions: never merge those automatically.
  return historyHash(JSON.stringify([character, redacted ? interactionId : normalizeKnowledgePhrase(text)]));
}
export function historyRetentionDays(env = process.env): number {
  const n = Number(env.CHAT_HISTORY_RETENTION_DAYS || 30);
  return Number.isInteger(n) && n >= 1 && n <= 365 ? n : 30;
}
export function chatSessionReference(sessionId: string, ownerHash: string): string {
  return historyHash(`chat-history-v1:${ownerHash}:${sessionId}`);
}
