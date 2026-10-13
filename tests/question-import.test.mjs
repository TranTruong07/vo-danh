import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { loader } from './support/load-typescript.mjs';

const load = loader();
const { QUESTION_IMPORT_HEADERS } = load('@/server/domain/question-import');
const { readQuestionWorkbook, createQuestionTemplate } = load('@/server/infrastructure/question-workbook');
const id = '0123456789abcdef01234567';
const secondId = '0123456789abcdef01234568';
const question = 'Ngô Quyền chiến thắng trên con sông nào?';
const row = (text = question) => [text, 'Bạch Đằng', 'Sông Hồng', 'Sông Mã', 'Sông Hương', 'A', 'Chính xác!', 'Chưa đúng, hãy ghi nhớ đáp án.'];
async function workbook(rows = [row()], change) {
  const book = new ExcelJS.Workbook(); const sheet = book.addWorksheet('Câu hỏi');
  sheet.addRow([...QUESTION_IMPORT_HEADERS]); rows.forEach(values => sheet.addRow(values));
  change?.(sheet);
  return Buffer.from(await book.xlsx.writeBuffer());
}
async function form(rows = [row()], characterId = id) {
  const data = new FormData(); data.set('characterId', characterId);
  data.set('file', new File([await workbook(rows)], 'questions.xlsx'));
  return data;
}
function service() {
  const state = { admin: true, character: true, saved: [], writes: 0 };
  const api = loader({
    './admin-auth': { requireAdmin: async () => { if (!state.admin) throw new Error('Unauthorized'); } },
    '@/server/repositories/characters': { findCharacter: async () => state.character ? { name: 'Nhân vật thử nghiệm' } : null },
    '@/server/repositories/character-questions': {
      existingQuestionTexts: async characterId => state.saved.filter(item => item.characterId === characterId),
      importCharacterQuestions: async inputs => { state.writes++; state.saved.push(...inputs); return new Set(inputs.map((_, index) => index)); },
    },
  })('@/server/services/question-import');
  return { state, api };
}

test('template opens, has the required columns and flags its example instead of silently importing it', async () => {
  const bytes = Buffer.from(await createQuestionTemplate());
  const book = new ExcelJS.Workbook(); await book.xlsx.load(bytes);
  assert.deepEqual(book.getWorksheet('Câu hỏi').getRow(1).values.slice(1), [...QUESTION_IMPORT_HEADERS]);
  assert.ok(book.getWorksheet('Hướng dẫn'));
  const rows = await readQuestionWorkbook(bytes, id);
  assert.equal(rows[0].status, 'invalid'); assert.match(rows[0].message, /minh họa/);
});
test('parser preserves all four answers and feedback; accepts numeric answers, rich text and lowercase correct option', async () => {
  const bytes = await workbook([row()], sheet => {
    sheet.getCell('B2').value = 938; sheet.getCell('C2').value = { richText: [{ text: 'Năm ' }, { text: '939' }] }; sheet.getCell('F2').value = ' a ';
  });
  const [result] = await readQuestionWorkbook(bytes, id);
  assert.equal(result.status, 'ready'); assert.equal(result.data.correctIndex, 0);
  assert.deepEqual(result.data.answers, ['938', 'Năm 939', 'Sông Mã', 'Sông Hương']);
  assert.equal(result.data.incorrectFeedback, row()[7]);
});
test('reports actual Excel row numbers, skips blank rows and rejects malformed answers/formulas/feedback', async () => {
  const bytes = await workbook([row(), [], row(), row(), row(), row()], sheet => {
    sheet.getCell('D4').value = 'Bạch Đằng'; sheet.getCell('F5').value = 'E'; sheet.getCell('H6').value = '';
    sheet.getCell('B7').value = { formula: '1+1', result: 2 };
  });
  const rows = await readQuestionWorkbook(bytes, id);
  assert.deepEqual(rows.map(item => item.row), [2, 4, 5, 6, 7]);
  assert.deepEqual(rows.map(item => item.status), ['ready', 'invalid', 'invalid', 'invalid', 'invalid']);
  assert.match(rows.at(-1).message, /công thức/);
});
test('rejects corrupt files, wrong headers, missing worksheet, empty and over-limit files', async () => {
  await assert.rejects(readQuestionWorkbook(Buffer.from('not an xlsx'), id), /không hợp lệ/);
  await assert.rejects(readQuestionWorkbook(await workbook([], sheet => { sheet.getCell('A1').value = 'Sai tiêu đề'; }), id), /tiêu đề/);
  await assert.rejects(readQuestionWorkbook(await workbook([], sheet => { sheet.name = 'Sheet1'; }), id), /Thiếu trang tính/);
  await assert.rejects(readQuestionWorkbook(await workbook([]), id), /chưa có câu hỏi/);
  await assert.rejects(readQuestionWorkbook(await workbook(Array.from({ length: 501 }, () => row())), id), /500/);
});
test('preview is read-only and detects within-file and legacy database duplicates per character', async () => {
  const { state, api } = service();
  state.saved.push({ characterId: id, question });
  const fresh = 'Nhân vật này sinh ra tại địa phương nào?';
  const data = await form([row(('  ' + question.toUpperCase() + '  ').normalize('NFD')), row(fresh), row(fresh.replaceAll(' ', '   ')), row('ngắn')]);
  const report = await api.importQuestionFile(data, false);
  assert.equal(state.writes, 0);
  assert.deepEqual(report.rows.map(item => item.status), ['duplicate', 'ready', 'duplicate', 'invalid']);
  assert.match(report.rows[2].message, /dòng 3/);
  const other = await api.importQuestionFile(await form([row()], secondId), false);
  assert.equal(other.rows[0].status, 'ready');
});
test('commit rechecks the database after preview, imports valid rows only and repeat upload is idempotent', async () => {
  const { state, api } = service();
  const fresh = 'Nhân vật này sinh ra tại địa phương nào?';
  const data = await form([row(), row(fresh), row(fresh), row('ngắn')]);
  await api.importQuestionFile(data, false);
  state.saved.push({ characterId: id, question });
  const report = await api.importQuestionFile(data, true);
  assert.deepEqual(report.rows.map(item => item.status), ['duplicate', 'imported', 'duplicate', 'invalid']);
  assert.equal(state.saved.length, 2);
  const repeat = await api.importQuestionFile(data, true);
  assert.deepEqual(repeat.rows.map(item => item.status), ['duplicate', 'duplicate', 'duplicate', 'invalid']);
  assert.equal(state.saved.length, 2);
});
test('unauthorized requests, deleted characters, wrong extension, empty and oversized file never write', async () => {
  const { state, api } = service(); const data = await form();
  state.admin = false; await assert.rejects(api.importQuestionFile(data, true), /Unauthorized/);
  await assert.rejects(api.downloadQuestionTemplate(), /Unauthorized/);
  state.admin = true; state.character = false; await assert.rejects(api.importQuestionFile(data, true), /không còn tồn tại/);
  state.character = true;
  for (const [name, bytes] of [['bad.xls', 'bad'], ['empty.xlsx', ''], ['large.xlsx', new Uint8Array(2 * 1024 * 1024 + 1)]]) {
    data.set('file', new File([bytes], name)); await assert.rejects(api.importQuestionFile(data, true));
  }
  data.set('characterId', 'bad'); await assert.rejects(api.importQuestionFile(data, true), /chọn nhân vật/);
  assert.equal(state.writes, 0);
});
