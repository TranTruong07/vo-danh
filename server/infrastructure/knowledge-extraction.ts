import 'server-only';
import { randomUUID, createHash } from 'node:crypto';
import * as yauzl from 'yauzl';
import { SaxesParser } from 'saxes';
import type { SourceChunk } from '@/server/domain/knowledge-generation';
import { generationError } from '@/server/services/knowledge-generation-validation';

function limit(name: string, fallback: number, ceiling: number) {
  const n = Number(process.env[name] || fallback);
  return Number.isSafeInteger(n) && n > 0 ? Math.min(n, ceiling) : fallback;
}
export function extractionLimits() {
  return { bytes: limit('KNOWLEDGE_UPLOAD_MAX_MB', 10, 20) * 1024 * 1024,
    pages: limit('KNOWLEDGE_MAX_PAGES', 100, 200), chars: limit('KNOWLEDGE_MAX_CHARS', 200000, 500000) };
}
const badFile = () => generationError('Tài liệu không hợp lệ, được mã hóa hoặc chứa nội dung không được hỗ trợ.', 'INVALID_DOCUMENT');
interface Paragraph { text: string; section: string; paragraphIndex: number; page?: number }
async function docxParagraphs(buffer: Buffer): Promise<Paragraph[]> {
  const xml = await new Promise<string>((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true, strictFileNames: true }, (error, zip) => {
      if (error || !zip) return reject(badFile());
      let entries = 0, total = 0, document = '', contentTypes = false, stopped = false;
      const fail = () => { if (!stopped) { stopped = true; zip.close(); reject(badFile()); } };
      zip.on('error', fail);
      zip.on('entry', (entry: yauzl.Entry) => {
        const name = entry.fileName;
        if (++entries > 2000 || (total += entry.uncompressedSize) > 30 * 1024 * 1024 || entry.uncompressedSize > 8 * 1024 * 1024
          || entry.uncompressedSize / Math.max(entry.compressedSize, 1) > 150 || (entry.generalPurposeBitFlag & 1)
          || /(?:vbaProject|embeddings\/|activeX\/|\.bin$)/i.test(name)) return fail();
        if (name !== 'word/document.xml' && name !== '[Content_Types].xml' && !name.endsWith('.rels')) return zip.readEntry();
        zip.openReadStream(entry, (err, stream) => {
          if (err || !stream) return fail();
          const parts: Buffer[] = []; let size = 0;
          stream.on('error', fail);
          stream.on('data', (part: Buffer) => { size += part.length; if (size > 8 * 1024 * 1024) { stream.destroy(); fail(); } else parts.push(part); });
          stream.on('end', () => {
            if (stopped) return;
            const text = Buffer.concat(parts).toString('utf8');
            if (/<!DOCTYPE|<!ENTITY|macroEnabled|vbaProject|oleObject|attachedTemplate|altChunk/i.test(text)) return fail();
            if (name === '[Content_Types].xml') contentTypes = /wordprocessingml\.document\.main\+xml/.test(text);
            if (name === 'word/document.xml') { if (document) return fail(); document = text; }
            zip.readEntry();
          });
        });
      });
      zip.on('end', () => { if (!stopped) { stopped = true; if (!document || !contentTypes) reject(badFile()); else resolve(document); } });
      zip.readEntry();
    });
  });
  const paragraphs: Paragraph[] = []; let text = '', inside = false, inText = false, heading = false, section = 'Tài liệu', index = -1;
  const parser = new SaxesParser({ xmlns: true });
  parser.on('doctype', () => { throw badFile(); });
  parser.on('opentag', tag => {
    if (tag.local === 'altChunk' || tag.local === 'object') throw badFile();
    if (tag.local === 'p') { inside = true; text = ''; heading = false; index++; }
    if (inside && tag.local === 'pStyle') heading = Object.values(tag.attributes).some(a => typeof a !== 'string' && /heading|title/i.test(a.value));
    if (tag.local === 't') inText = true;
    if (inside && ['tab', 'br', 'cr'].includes(tag.local)) text += ' ';
  });
  parser.on('text', value => { if (inside && inText) text += value; });
  parser.on('closetag', tag => {
    if (tag.local === 't') inText = false;
    if (tag.local === 'p') { inside = false; text = text.normalize('NFC').trim(); if (heading && text) section = text.slice(0, 120); if (text) paragraphs.push({ text, section, paragraphIndex: index }); }
  });
  try { parser.write(xml).close(); } catch { throw badFile(); }
  return paragraphs;
}
async function pdfParagraphs(buffer: Buffer): Promise<Paragraph[]> {
  const pdf = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdf.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, useSystemFonts: false,
    disableFontFace: true, stopAtErrors: true, useWorkerFetch: false });
  const rows: Paragraph[] = []; let length = 0;
  try {
    const doc = await task.promise;
    if (doc.numPages > extractionLimits().pages) throw generationError('Tài liệu vượt giới hạn số trang.', 'DOCUMENT_LIMIT');
    if ((await doc.getJSActions()) || (await doc.getAttachments())) throw badFile();
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      if (await page.getJSActions()) throw badFile();
      const stream = page.streamTextContent({ disableNormalization: false }).getReader();
      let text = '';
      try {
        while (true) {
          const { value, done } = await stream.read(); if (done) break;
          for (const item of value.items) if ('str' in item) {
            length += item.str.length + 1;
            if (length > extractionLimits().chars) { await stream.cancel(); throw generationError('Tài liệu vượt giới hạn ký tự.', 'DOCUMENT_LIMIT'); }
            text += item.str + (item.hasEOL ? '\n' : ' ');
          }
        }
      } finally { stream.releaseLock(); }
      if (text.trim()) rows.push({ text: text.normalize('NFC').trim(), section: `Trang ${i}`, page: i, paragraphIndex: rows.length });
      page.cleanup();
    }
    return rows;
  } catch (error) { if (error instanceof Error && 'code' in error) throw error; throw badFile(); }
  finally { await task.destroy(); }
}
export async function extractKnowledgeFile(buffer: Buffer, mime: string, filename: string) {
  if (buffer.length < 5 || buffer.length > extractionLimits().bytes) throw generationError('File trống hoặc vượt giới hạn dung lượng.', 'DOCUMENT_LIMIT', 413);
  const type: 'pdf' | 'docx' | undefined = mime === 'application/pdf' && /\.pdf$/i.test(filename) && buffer.subarray(0, 5).toString() === '%PDF-' ? 'pdf'
    : mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && /\.docx$/i.test(filename) && buffer.readUInt32LE(0) === 0x04034b50 ? 'docx' : undefined;
  if (!type) throw badFile();
  const rows = type === 'pdf' ? await pdfParagraphs(buffer) : await docxParagraphs(buffer);
  const chars = rows.reduce((n, p) => n + p.text.length, 0);
  if (chars < 20) throw generationError('Không đọc được lớp văn bản. Phase này không hỗ trợ OCR.', 'NO_TEXT');
  if (chars > extractionLimits().chars) throw generationError('Tài liệu vượt giới hạn ký tự.', 'DOCUMENT_LIMIT');
  const sourceId = randomUUID(), chunks: SourceChunk[] = [];
  for (const row of rows) {
    for (let start = 0; start < row.text.length;) {
      let end = Math.min(start + 5000, row.text.length);
      if (end < row.text.length) { const space = row.text.lastIndexOf(' ', end); if (space > start + 2500) end = space; }
      const text = row.text.slice(start, end);
      chunks.push({ _id: `${sourceId}:${chunks.length}`, sourceId, order: chunks.length, section: row.section,
        text, paragraphIndex: row.paragraphIndex, start, end, ...(row.page ? { page: row.page } : {}) });
      start = end;
    }
  }
  return { sourceId, type, checksum: createHash('sha256').update(buffer).digest('hex'), chunks };
}
