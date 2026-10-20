import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { extractKnowledgeFile } from '../server/infrastructure/knowledge-extraction';
const require = createRequire(import.meta.url);
// JSZip is already provided by exceljs; used only to build malicious/synthetic fixtures.
const JSZip = require('jszip');
const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const xml = '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Tài liệu kiểm thử</w:t></w:r></w:p><w:p><w:r><w:t>Đoạn thử nghiệm dành riêng cho kiểm tra phần trích xuất.</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Ô bảng có nội dung cần giữ đúng thứ tự.</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>';
async function docx(extra?: string, text = xml) {
  const zip = new JSZip(); zip.file('[Content_Types].xml', '<Types><Override ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('word/document.xml', text); if (extra) zip.file(extra, 'dangerous');
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }) as Promise<Buffer>;
}
function pdf(text: string) {
  const stream = `BT /F1 12 Tf 40 700 Td (${text}) Tj ET`;
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  let result = '%PDF-1.4\n'; const offsets = [0]; objects.forEach((obj, i) => { offsets.push(Buffer.byteLength(result)); result += `${i+1} 0 obj\n${obj}\nendobj\n`; });
  const start = Buffer.byteLength(result); result += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return Buffer.from(result);
}
async function main() {
  let passed = 0;
  const pack = await extractKnowledgeFile(await docx(), mime, 'fixture.docx');
  assert.equal(pack.type, 'docx'); assert.equal(pack.chunks.length, 3); assert.match(pack.chunks[2].text, /Ô bảng/); assert.equal(pack.chunks[0].page, undefined); passed++;
  for (const path of ['word/vbaProject.bin','word/embeddings/oleObject1.bin','word/activeX/activeX1.xml']) { await assert.rejects(() => docx(path).then(b => extractKnowledgeFile(b, mime, 'bad.docx'))); passed++; }
  await assert.rejects(() => docx(undefined, '<!DOCTYPE x [<!ENTITY x "boom">]>' + xml).then(b => extractKnowledgeFile(b, mime, 'bad.docx'))); passed++;
  await assert.rejects(() => docx(undefined, xml.replace('Đoạn thử nghiệm', 'x'.repeat(500000))).then(b => extractKnowledgeFile(b, mime, 'bomb.docx'))); passed++;
  await assert.rejects(() => extractKnowledgeFile(Buffer.from('not a PDF document'), 'application/pdf', 'bad.pdf')); passed++;
  await assert.rejects(() => docx().then(b => extractKnowledgeFile(b, 'application/pdf', 'fake.pdf'))); passed++;
  await assert.rejects(() => extractKnowledgeFile(Buffer.alloc(11 * 1024 * 1024), mime, 'large.docx')); passed++;
  const result = await extractKnowledgeFile(pdf('Synthetic extraction fixture with enough readable text.'), 'application/pdf', 'text.pdf');
  assert.equal(result.chunks[0].page, 1); assert.match(result.chunks[0].text, /Synthetic extraction/); passed++;
  await assert.rejects(() => extractKnowledgeFile(pdf(''), 'application/pdf', 'scan.pdf'), e => !!e && typeof e === 'object' && 'code' in e && e.code === 'NO_TEXT'); passed++;
  console.log(JSON.stringify({ extractionTests: passed, liveGenerationCalls: 0, databaseWrites: 0 }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
