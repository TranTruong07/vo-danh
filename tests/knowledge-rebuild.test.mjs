import test from 'node:test';
import assert from 'node:assert/strict';
import { loader } from './support/load-typescript.mjs';
import { readFileSync } from 'node:fs';
const load = loader();
const { planOldKnowledgeCleanup, RETIRED_SOURCE_HASH } = load('@/server/services/knowledge-cleanup');
const fixture = () => {
  const questions = Array.from({ length: 60 }, (_, i) => ({ _id: `cmtt45-q${String(i + 1).padStart(3, '0')}`, topicId: 'cach-mang-thang-tam-1945', ...(i < 59 ? { publishedVersionId: `cmtt45-q${String(i + 1).padStart(3, '0')}:v1` } : {}) }));
  const revisions = [...questions, ...questions.slice(0, 15)].map((q, i) => ({ _id: `${q._id}:v${i < 60 ? 1 : 2}`, questionId: q._id, version: i < 60 ? 1 : 2, status: 'approved', source: { document: 'Tong-hop-kien-thuc.docx', sourceSha256: RETIRED_SOURCE_HASH } }));
  return { questions, revisions };
};
test('cleanup exact scope: 60 questions, 75 revisions, 59 pointers; deterministic hash', () => {
  const state = fixture(), result = planOldKnowledgeCleanup('vo_danh', state);
  assert.equal(result.questions.length, 60); assert.equal(result.revisions.length, 75);
  assert.deepEqual(planOldKnowledgeCleanup('vo_danh', { questions: [...state.questions].reverse(), revisions: [...state.revisions].reverse() }), result);
});
test('cleanup refuses other database, extra/new knowledge, orphan and broken pointer', () => {
  assert.throws(() => planOldKnowledgeCleanup('test', fixture()), /WRONG_DATABASE/);
  const extra = fixture(); extra.questions.push({ _id: 'new' }); assert.throws(() => planOldKnowledgeCleanup('vo_danh', extra), /COUNTS_CHANGED/);
  const newer = fixture(); newer.revisions[0].source.sourceSha256 = 'new'; assert.throws(() => planOldKnowledgeCleanup('vo_danh', newer), /OUT_OF_SCOPE/);
  const orphan = fixture(); orphan.revisions[60].questionId = 'missing'; assert.throws(() => planOldKnowledgeCleanup('vo_danh', orphan), /OUT_OF_SCOPE/);
  const pointer = fixture(); pointer.questions[0].publishedVersionId = 'missing'; assert.throws(() => planOldKnowledgeCleanup('vo_danh', pointer), /BROKEN_POINTER/);
});
test('generation schema uses exactly the four new personas and maps retained QR ID', () => {
  const domain = load('@/server/domain/knowledge');
  assert.deepEqual([...domain.KNOWLEDGE_CHARACTERS].sort(), ['hoang-quoc-viet','pham-van-dong','truong-chinh','vo-nguyen-giap']);
  const { resolveMappedCharacter } = load('@/server/services/chat-characters');
  const id = '6acf0cf89c11e27aef18841a';
  assert.equal(resolveMappedCharacter(id, { CHAT_CHARACTER_LE_DUAN_ID: id }), 'hoang-quoc-viet');
  assert.equal(resolveMappedCharacter(id, { CHAT_CHARACTER_HOANG_QUOC_VIET_ID: id }), 'hoang-quoc-viet');
  assert.throws(() => resolveMappedCharacter('000000000000000000000001', {}));
});
test('import detects changes to Hoàng Quốc Việt answer, preserves key ordering idempotency', () => {
  const { knowledgeContent } = load('@/server/services/knowledge-import');
  const row = { source: {}, characterAnswers: { 'hoang-quoc-viet': 'one', 'truong-chinh': 'two' } };
  assert.notEqual(knowledgeContent(row), knowledgeContent({ ...row, characterAnswers: { ...row.characterAnswers, 'hoang-quoc-viet': 'changed' } }));
  assert.equal(knowledgeContent(row), knowledgeContent({ ...row, characterAnswers: { 'truong-chinh': 'two', 'hoang-quoc-viet': 'one' } }));
});

test('new IDs never recycle retained audit/history references after cleanup', () => {
  const { nextKnowledgeQuestionId } = load('@/server/domain/knowledge');
  assert.equal(nextKnowledgeQuestionId(['cmtt45-q060', 'cmtt45-q001']), 'cmtt45-q061');
  assert.equal(nextKnowledgeQuestionId(['cmtt45-q060','cmtt45-q062']), 'cmtt45-q063');
  assert.throws(() => nextKnowledgeQuestionId(['cmtt45-q999999']));
});

test('empty Mongo admin list does not resurrect the retired preview', async () => {
  const service = loader({ './account-session': { currentAccount: async () => ({ userId: 'test-admin', email: 'test@example.test', role: 'admin' }) },
    '@/server/repositories/knowledge-admin': { listKnowledgeRecords: async () => [] },
    '@/server/repositories/knowledge-source': { readKnowledgePreview: async () => { throw Error('Must not load retired preview'); } },
  })('@/server/services/knowledge-admin');
  assert.deepEqual(await service.adminKnowledgeList(), { preview: false, items: [] });
});

test('new actual pilot drafts preserve source, all personas and unreviewed status', () => {
  const drafts = JSON.parse(readFileSync('knowledge/new-questions-draft.json', 'utf8'));
  const manifest = JSON.parse(readFileSync('knowledge/new-source-manifest.json', 'utf8'));
  const { validateKnowledge } = load('@/server/services/knowledge-validation');
  const { KNOWLEDGE_CHARACTERS } = load('@/server/domain/knowledge');
  assert.equal(drafts.length, 2);
  assert.deepEqual(validateKnowledge(drafts, manifest).errors, []);
  for (const d of drafts) {
    assert.equal(d.status, 'draft'); assert.equal(d.reviewedBy, undefined); assert.equal(d.reviewedAt, undefined);
    assert.equal(d.characterAnswers['le-duan'], undefined);
    assert.equal(new Set(Object.values(d.characterAnswers)).size, 4);
    assert.ok(d.source.excerpt.includes(d.approvedAnswer));
    for (const id of KNOWLEDGE_CHARACTERS) assert.ok(d.characterAnswers[id].includes(d.approvedAnswer));
  }
});

test('new source resolver validates pinned source and rejects mismatched references', async () => {
  const { readKnowledgeManifest } = load('@/server/repositories/knowledge-source');
  const drafts = JSON.parse(readFileSync('knowledge/new-questions-draft.json','utf8'));
  assert.equal((await readKnowledgeManifest(drafts[0].source)).document, 'Tong-hop-kien-thuc-moi.docx');
  await assert.rejects(readKnowledgeManifest({ ...drafts[0].source, sourceSha256: '0'.repeat(64) }), e => e.code === 'SOURCE_UNAVAILABLE');
});
