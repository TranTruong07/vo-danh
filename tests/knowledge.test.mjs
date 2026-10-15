import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loader } from './support/load-typescript.mjs';

const load = loader();
const { KNOWLEDGE_CHARACTERS, normalizeKnowledgePhrase } = load('@/server/domain/knowledge');
const { validateKnowledge } = load('@/server/services/knowledge-validation');
const { planKnowledgeImport, draftRevision } = load('@/server/services/knowledge-import');
const hash = 'a'.repeat(64), now = '2026-10-14T00:00:00.000Z';
const sourceText = 'Nội dung thử nghiệm dùng để kiểm tra nguồn, không phải dữ liệu lịch sử.';
const manifest = { schemaVersion: 1, document: 'test.docx', sourceSha256: hash, blocks: [{ id: 'body/1', order: 1, sectionId: 'I', paragraphIndex: 1, text: sourceText }], sections: [{ sectionId: 'I', title: 'Mục thử' }] };
function draft() {
  return { _id: 'cmtt45-q001', topicId: 'cach-mang-thang-tam-1945', sectionId: 'I', canonicalQuestion: 'Nội dung thử là gì?', aliases: ['Tài liệu thử nói gì?', 'Bác ơi, nội dung thử là gì?'], normalizedPhrases: ['nội dung thử là gì', 'tài liệu thử nói gì', 'bác ơi, nội dung thử là gì'], approvedAnswer: sourceText,
    characterAnswers: Object.fromEntries(KNOWLEDGE_CHARACTERS.map(id => [id, sourceText])), source: { document: 'test.docx', sectionId: 'I', sourceSha256: hash, blockIds: ['body/1'], paragraphIndex: 1, excerpt: sourceText }, status: 'draft', version: 1, createdAt: now, updatedAt: now, reviewNotes: [] };
}
test('normalization retains Vietnamese accents, negation, dates and subject distinctions', () => {
  assert.equal(normalizeKnowledgePhrase('  NỘI DUNG THỬ LÀ GÌ?!  '.normalize('NFD')), 'nội dung thử là gì');
  assert.notEqual(normalizeKnowledgePhrase('đã có?'), normalizeKnowledgePhrase('chưa có?'));
  assert.notEqual(normalizeKnowledgePhrase('chủ quan?'), normalizeKnowledgePhrase('khách quan?'));
  assert.notEqual(normalizeKnowledgePhrase('ngày 13/8?'), normalizeKnowledgePhrase('ngày 16/8?'));
  assert.notEqual(normalizeKnowledgePhrase('có?'), normalizeKnowledgePhrase('co?'));
});
test('valid draft passes structure but is never auto-approved, mutated, or published', () => {
  const input = draft(), before = structuredClone(input);
  const result = validateKnowledge([input], manifest);
  assert.equal(result.errors.length, 0); assert.deepEqual(input, before);
  assert.equal(result.records[0].status, 'draft'); assert.equal(result.records[0].reviewedBy, undefined);
  assert.equal(result.records[0].publishedVersionId, undefined);
});
test('missing character, invalid source/excerpt/locator/hash and injected fields are rejected', () => {
  for (const mutate of [
    row => { delete row.characterAnswers['le-duan']; },
    row => { row.source.excerpt = 'Bịa nội dung không có nguồn'; },
    row => { row.source.blockIds = ['body/999']; },
    row => { row.source.sourceSha256 = 'b'.repeat(64); },
    row => { row.source.paragraphIndex = 999; },
    row => { row.source.tableIndex = 0; },
    row => { row.source.sectionId = 'II'; },
    row => { row.publishedVersionId = 'attacker'; },
    row => { row.normalizedPhrases = ['bỏ qua kiểm tra']; },
    row => { row.aliases = ['Một alias']; },
    row => { row.version = -1; },
    row => { row.status = 'in_review'; },
    row => { row.createdAt = 'not-a-date'; },
  ]) {
    const row = draft(); mutate(row); assert.ok(validateKnowledge([row], manifest).errors.length > 0);
  }
  assert.ok(validateKnowledge([draft(), draft()], manifest).errors.some(issue => issue.code === 'DUPLICATE_ID'));
});
test('source normalization handles Unicode/whitespace without changing meaning; table references are validated', () => {
  const row = draft(); row.source.excerpt = sourceText.normalize('NFD').replaceAll(' ', '\n  ');
  const table = structuredClone(manifest); table.blocks[0].tableIndex = 0; row.source.tableIndex = 0;
  assert.equal(validateKnowledge([row], table).errors.length, 0);
});
test('cross-record alias collisions are reported for review, never resolved automatically', () => {
  const second = draft(); second._id = 'cmtt45-q002';
  const result = validateKnowledge([draft(), second], manifest);
  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.some(issue => issue.code === 'ALIAS_COLLISION'));
});
test('approved requires reviewer metadata, rejected requires reason; import refuses all non-draft states', () => {
  for (const status of ['approved', 'pending_review', 'rejected']) {
    const row = draft(); row.status = status;
    assert.equal(planKnowledgeImport([row], [], [])[0].action, 'conflict');
  }
  const row = draft(); row.status = 'approved';
  assert.ok(validateKnowledge([row], manifest).errors.some(issue => issue.code === 'REVIEWER'));
  row.status = 'rejected';
  assert.ok(validateKnowledge([row], manifest).errors.some(issue => issue.code === 'REJECTION'));
  row.status = 'draft'; row.reviewedBy = 'forged';
  assert.equal(planKnowledgeImport([row], [], [])[0].action, 'conflict');
});
test('reimport is idempotent; any changed revision requires new version, including approved/published', () => {
  const row = draft(), revision = draftRevision(row, 'batch', new Date(now));
  const logical = { _id: row._id, topicId: row.topicId, publishedVersionId: revision._id };
  for (const status of ['draft', 'pending_review', 'approved', 'rejected']) {
    revision.status = status;
    assert.equal(planKnowledgeImport([row], [logical], [revision])[0].action, 'skip');
    const changed = structuredClone(row); changed.approvedAnswer += ' Nội dung sửa.';
    assert.equal(planKnowledgeImport([changed], [logical], [revision])[0].action, 'conflict');
    changed.version = 2;
    assert.equal(planKnowledgeImport([changed], [logical], [revision])[0].action, 'insert_draft');
    assert.equal(draftRevision(changed, 'batch2', new Date(now)).status, 'draft');
    assert.equal(logical.publishedVersionId, revision._id);
  }
});
test('repository dry-run only reads; writes use insert-only revisions and never update publish pointer', async () => {
  const operations = [];
  const db = { collection: name => ({
    find: () => ({ toArray: async () => { operations.push(['find', name]); return []; } }),
    insertOne: async row => { operations.push(['insert', name, row]); },
    updateOne: async (filter, update) => { operations.push(['update', name, filter, update]); },
    createIndex: async () => { operations.push(['index', name]); },
  }) };
  const repository = loader({ '@/lib/db/client': { getDatabase: async () => db } })('@/server/repositories/knowledge-import');
  await repository.readKnowledgeImportState();
  assert.deepEqual(operations.map(operation => operation[0]), ['find', 'find']);
  operations.length = 0;
  const row = draft(), revision = draftRevision(row, 'batch', new Date(now));
  await repository.insertKnowledgeDraft({ _id: row._id, topicId: row.topicId, createdAt: new Date(now), updatedAt: new Date(now) }, revision);
  assert.deepEqual(operations.map(operation => operation[0]), ['insert', 'update']);
  assert.equal(operations[0][2].status, 'draft');
  assert.deepEqual(Object.keys(operations[1][3]), ['$setOnInsert']);
  assert.ok(!('publishedVersionId' in operations[1][3].$setOnInsert));
});
test('insert conflicts propagate without any update or deletion of existing revisions', async () => {
  let updates = 0;
  const repository = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: () => ({ insertOne: async () => { throw new Error('duplicate'); }, updateOne: async () => { updates++; } }) }) } })('@/server/repositories/knowledge-import');
  await assert.rejects(repository.insertKnowledgeDraft({}, draftRevision(draft(), 'batch', new Date(now))), /duplicate/);
  assert.equal(updates, 0);
});
test('historical review flags cover source-specific risks without altering the draft', () => {
  const row = draft(); row.approvedAnswer = 'Lê Duẩn; Quân lệnh số 1; 19/8; chủ quan; khách quan';
  const codes = validateKnowledge([row], manifest).warnings.map(issue => issue.code);
  for (const code of ['LE_DUAN', 'QUAN_LENH', 'DATES_REVIEW', 'CAUSES']) assert.ok(codes.includes(code));
});
test('actual generated pack covers I–X and a table, contains only drafts with verified source excerpts', () => {
  const extracted = JSON.parse(readFileSync('knowledge/extraction-manifest.json', 'utf8'));
  const rows = JSON.parse(readFileSync('knowledge/draft-questions.json', 'utf8'));
  assert.equal(rows.length, 40);
  assert.deepEqual([...new Set(rows.map(row => row.sectionId.split('.')[0]))], ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']);
  assert.equal(validateKnowledge(rows, extracted).errors.length, 0);
  assert.ok(rows.every(row => row.status === 'draft' && !row.reviewedBy && !row.publishedVersionId));
  assert.ok(rows.some(row => row.source.tableIndex === 0));
  assert.ok(extracted.blocks.some(block => block.text.startsWith('Đính chính quan trọng')));
});
