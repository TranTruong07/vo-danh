import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loader } from './support/load-typescript.mjs';
import { testActor } from './support/knowledge-admin-fixture.mjs';

// Real local snapshots, but all DB state below is in memory. No MongoDB access.
const json = path => JSON.parse(readFileSync(path, 'utf8'));
const rows = json('knowledge/draft-questions-phase-2-v4.json');
const baseline = json('knowledge/draft-questions-phase-2-v3.json');
const manifest = json('knowledge/extraction-manifest.json');
const load = loader();
const { planKnowledgeImport, draftRevision } = load('@/server/services/knowledge-import');
const { validateKnowledge } = load('@/server/services/knowledge-validation');
const now = new Date('2026-10-14T00:00:00Z');
const revision = row => draftRevision(row, 'in-memory-import-test', now);
const logical = row => ({ _id: row._id, topicId: row.topicId, createdAt: now, updatedAt: now });
const counts = actions => Object.fromEntries(['insert_draft', 'skip', 'conflict'].map(action => [action, actions.filter(r => r.action === action).length]));

test('v4 snapshot validates with mixed v1/v3/v4; all 59 records remain unreviewed drafts', () => {
  const before = structuredClone(rows), result = validateKnowledge(rows, manifest);
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 23);
  assert.equal(new Set(rows.map(r => r._id)).size, 59);
  assert.deepEqual([1, 3, 4].map(v => rows.filter(r => r.version === v).length), [19, 22, 18]);
  assert.ok(rows.every(r => r.status === 'draft' && r.reviewedBy === undefined && r.reviewedAt === undefined && r.publishedVersionId === undefined));
  assert.deepEqual(rows, before);
});

test('empty DB plans 59 inserts without requiring or fabricating earlier revisions', () => {
  const actions = planKnowledgeImport(rows, [], []);
  assert.deepEqual(counts(actions), { insert_draft: 59, skip: 0, conflict: 0 });
  assert.deepEqual(actions.map(a => a.revisionId), rows.map(r => `${r._id}:v${r.version}`));
});

test('complete identical v4 reimport skips all 59 and leaves stored state untouched', () => {
  const questions = rows.map(logical), revisions = rows.map(revision);
  const before = structuredClone({ questions, revisions });
  assert.deepEqual(counts(planKnowledgeImport(rows, questions, revisions)), { insert_draft: 0, skip: 59, conflict: 0 });
  assert.deepEqual({ questions, revisions }, before);
});

test('v3 baseline plans 37 new revisions and skips 22; no old revision is replaced', () => {
  const questions = baseline.map(logical), revisions = baseline.map(revision);
  const before = structuredClone({ questions, revisions });
  assert.deepEqual(counts(planKnowledgeImport(rows, questions, revisions)), { insert_draft: 37, skip: 22, conflict: 0 });
  assert.deepEqual({ questions, revisions }, before);
});

test('same ID/version with changed content conflicts; topic, version and alternate ID conflicts are detected', () => {
  const row = rows.find(r => r.version === 4), q = logical(row), saved = revision(row);
  for (const mutate of [
    r => { r.canonicalQuestion += ' test'; },
    r => { r.aliases[0] += ' test'; },
    r => { r.approvedAnswer += ' test'; },
    r => { r.characterAnswers['le-duan'] += ' test'; },
    r => { r.source.excerpt += ' test'; },
    r => { r.reviewNotes.push('test'); },
  ]) {
    const changed = structuredClone(saved); mutate(changed);
    assert.equal(planKnowledgeImport([row], [q], [changed])[0].action, 'conflict');
  }
  assert.equal(planKnowledgeImport([row], [{ ...q, topicId: 'other-topic' }], [saved])[0].action, 'conflict');
  assert.equal(planKnowledgeImport([row], [q], [{ ...saved, _id: 'alternate-id' }])[0].action, 'conflict');
  assert.equal(planKnowledgeImport([row], [q], [{ ...saved, _id: `${q._id}:v5`, version: 5 }])[0].action, 'conflict');
});

test('admin DB list accepts 59 mixed revisions without falling back to the fixed v3 preview', async () => {
  let previewReads = 0;
  const service = loader({
    './account-session': { currentAccount: async () => testActor },
    '@/server/repositories/knowledge-admin': { listKnowledgeRecords: async () => rows.map(r => ({ ...logical(r), latest: revision(r) })) },
    '@/server/repositories/knowledge-source': { readKnowledgePreview: async () => { previewReads++; throw new Error('must not read v3'); } },
  })('@/server/services/knowledge-admin');
  const result = await service.adminKnowledgeList();
  assert.equal(result.preview, false); assert.equal(result.items.length, 59);
  assert.deepEqual([1, 3, 4].map(v => result.items.filter(r => r.version === v).length), [19, 22, 18]);
  assert.equal(previewReads, 0);
});

test('admin details select and validate a v4 revision while retaining v3 history', async () => {
  const row = rows.find(r => r.version === 4), latest = revision(row), old = revision(baseline.find(r => r._id === row._id));
  const service = loader({
    './account-session': { currentAccount: async () => testActor },
    '@/server/repositories/knowledge-admin': {
      readKnowledgeState: async () => ({ question: logical(row), revisions: [latest, old] }),
      readKnowledgeAudit: async () => [],
      listKnowledgeRecords: async () => rows.map(r => ({ ...logical(r), latest: revision(r) })),
    },
    '@/server/repositories/knowledge-source': { readKnowledgeManifest: async () => manifest },
  })('@/server/services/knowledge-admin');
  const result = await service.adminKnowledgeDetail(row._id, latest._id);
  assert.equal(result.selected.draft.version, 4);
  assert.equal(result.preview, false);
  assert.equal(result.validationErrors.length, 0);
  assert.deepEqual(result.revisions.map(r => r.draft.version), [4, 3]);
  assert.equal(result.publishedVersionId, null);
});
