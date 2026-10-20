import 'server-only';
import { extractionLimits } from './knowledge-extraction';
import { generationError } from '@/server/services/knowledge-generation-validation';

export async function readKnowledgeUpload(request: Request) {
  const origin = request.headers.get('origin'), allowed = new Set([new URL(request.url).origin]);
  try { if (process.env.NEXT_PUBLIC_APP_URL) allowed.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin); } catch { /* fail closed */ }
  if (!origin || !allowed.has(origin) || request.headers.get('sec-fetch-site') === 'cross-site') throw generationError('Yêu cầu phải gửi từ trang quản trị.', 'FORBIDDEN_ORIGIN', 403);
  const mime = request.headers.get('content-type') || '';
  if (!['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mime)) throw generationError('Chỉ hỗ trợ DOCX và PDF có văn bản.', 'UNSUPPORTED_TYPE', 415);
  const max = extractionLimits().bytes;
  if (Number(request.headers.get('content-length')) > max) throw generationError('File quá lớn.', 'BODY_TOO_LARGE', 413);
  const reader = request.body?.getReader(); if (!reader) throw generationError('Thiếu file.');
  let size = 0; const chunks: Uint8Array[] = [];
  try { while (true) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > max) { await reader.cancel(); throw generationError('File quá lớn.', 'BODY_TOO_LARGE', 413); }
    chunks.push(value);
  } } finally { reader.releaseLock(); }
  let filename: string;
  try { filename = decodeURIComponent(request.headers.get('x-file-name') || ''); } catch { throw generationError('Tên file không hợp lệ.'); }
  return { buffer: Buffer.concat(chunks), mime, filename };
}
