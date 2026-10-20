import test from 'node:test';
import assert from 'node:assert/strict';
import { loader } from './support/load-typescript.mjs';
import { fixtureState, command, applyPlan, questionId, manifest, testActor } from './support/knowledge-admin-fixture.mjs';

const load = loader(), { planKnowledgeMutation, revisionDraft } = load('@/server/services/knowledge-admin');
const { parseKnowledgeCommand, KnowledgeAdminError } = load('@/server/domain/knowledge-admin');
const code = c => e => e.code === c;
const plan = (state, cmd) => planKnowledgeMutation(state, cmd, testActor, manifest);
const approvedState = () => { const state = fixtureState(); applyPlan(state, plan(state, command('approve'))); return state; };

test('approve records the authenticated actor, never publishes and never edits content', () => {
  const state = fixtureState(), before = structuredClone(state);
  const result = plan(state, command('approve'));
  assert.equal(result.review.status, 'approved'); assert.equal(result.review.reviewedBy, testActor.userId);
  assert.ok(result.review.reviewedAt instanceof Date); assert.equal(result.publication, undefined);
  assert.equal(result.audit.actorEmail, testActor.email); assert.equal(result.audit.before.status, 'draft'); assert.equal(result.audit.after.status, 'approved');
  assert.deepEqual(state, before); assert.equal(result.insert, undefined);
});
test('submit and reject are explicit transitions; rejection keeps reason/reviewer without publishing', () => {
  const state = fixtureState();
  const submitted = plan(state, command('submit')); applyPlan(state, submitted);
  assert.equal(submitted.review.status, 'pending_review'); assert.equal(submitted.review.reviewedBy, undefined);
  assert.throws(() => plan(state, command('submit')), code('INVALID_TRANSITION'));
  const rejected = plan(state, command('reject')); applyPlan(state, rejected);
  assert.equal(rejected.review.status, 'rejected'); assert.equal(rejected.review.rejectionReason, command('reject').reason);
  assert.equal(rejected.review.reviewedBy, testActor.userId);
  assert.throws(() => plan(state, command('approve')), code('INVALID_TRANSITION'));
  assert.throws(() => plan(state, command('publish')), code('INVALID_TRANSITION'));
});
test('draft and pending cannot publish; approved missing reviewer/source/any persona cannot publish', () => {
  for (const status of ['draft', 'pending_review', 'rejected']) {
    const state = fixtureState(); state.revisions[0].status = status;
    assert.throws(() => plan(state, command('publish')), code('INVALID_TRANSITION'));
  }
  for (const field of ['reviewedBy', 'reviewedAt']) {
    const state = approvedState(); delete state.revisions[0][field];
    assert.throws(() => plan(state, command('publish')), code('INVALID_TRANSITION'));
  }
  for (const character of Object.keys(fixtureState().revisions[0].characterAnswers)) {
    const state = approvedState(); state.revisions[0].characterAnswers[character] = '';
    assert.throws(() => plan(state, command('publish')), code('INVALID_CONTENT'));
  }
  const state = approvedState(); state.revisions[0].source.excerpt = 'Không có trong nguồn';
  assert.throws(() => plan(state, command('publish')), code('INVALID_CONTENT'));
});
test('approve requires acknowledgement and valid source/five answers; cannot reject an approved revision', () => {
  assert.throws(() => plan(fixtureState(), command('approve', { acknowledged: false })), code('REVIEW_REQUIRED'));
  for (const change of [r => { r.approvedAnswer = ''; }, r => { r.source.sourceSha256 = 'b'.repeat(64); }, r => { r.aliases = []; }]) {
    const state = fixtureState(); change(state.revisions[0]); assert.throws(() => plan(state, command('approve')), code('INVALID_CONTENT'));
  }
  assert.throws(() => plan(approvedState(), command('reject')), code('INVALID_TRANSITION'));
});
test('publish/unpublish preserve approved revisions and capture before/after pointers in audit', () => {
  const state = approvedState(), content = structuredClone(state.revisions);
  const published = plan(state, command('publish')); applyPlan(state, published);
  assert.equal(published.publication, `${questionId}:v3`); assert.equal(published.audit.before.publishedVersionId, null);
  assert.equal(published.audit.after.publishedVersionId, `${questionId}:v3`);
  assert.throws(() => plan(state, command('publish')), code('INVALID_TRANSITION'));
  const unpublished = plan(state, command('unpublish')); applyPlan(state, unpublished);
  assert.equal(unpublished.publication, null); assert.equal(state.question.publishedVersionId, undefined);
  assert.deepEqual(state.revisions, content);
  assert.throws(() => plan(state, command('unpublish')), code('INVALID_TRANSITION'));
});
test('editing creates monotonic fresh draft, clears review metadata, preserves source and published revision; rollback is audited', () => {
  const state = approvedState(); applyPlan(state, plan(state, command('publish')));
  const old = structuredClone(state.revisions[0]);
  const content = { canonicalQuestion: 'Câu hỏi mới cho fixture?', aliases: old.aliases, approvedAnswer: 'Đáp án fixture mới.', characterAnswers: old.characterAnswers };
  const edited = plan(state, command('create_revision', { content })); applyPlan(state, edited);
  assert.equal(edited.insert.version, 4); assert.equal(edited.insert.status, 'draft');
  assert.equal(edited.insert.reviewedBy, undefined); assert.equal(edited.insert.reviewedAt, undefined);
  assert.equal(edited.insert.createdBy, testActor.userId); assert.equal(edited.insert.basedOnRevisionId, old._id);
  assert.deepEqual(edited.insert.source, old.source); assert.equal(state.question.publishedVersionId, old._id);
  assert.deepEqual(state.revisions.find(r => r._id === old._id), old);
  applyPlan(state, plan(state, command('approve', { revisionId: edited.insert._id })));
  applyPlan(state, plan(state, command('publish', { revisionId: edited.insert._id })));
  const rollback = plan(state, command('publish'));
  assert.equal(rollback.audit.before.publishedVersionId, edited.insert._id); assert.equal(rollback.audit.after.publishedVersionId, old._id);
  assert.equal(state.revisions.length, 2);
});
test('strict payload rejects forged reviewer/status/pointer, unknown edits and malformed operation inputs', () => {
  assert.equal(parseKnowledgeCommand(command('approve'), questionId).action, 'approve');
  for (const key of ['reviewedBy', 'reviewedAt', 'publishedVersionId', 'actorId', 'status']) assert.throws(() => parseKnowledgeCommand({ ...command('approve'), [key]: 'forged' }, questionId), code('INVALID_INPUT'));
  for (const patch of [{ action: 'delete' }, { revisionId: 'cmtt45-q902:v3' }, { expectedVersion: -1 }, { expectedVersion: '1' }, { reason: ' ' }, { content: {} }]) assert.throws(() => parseKnowledgeCommand(command('publish', patch), questionId), code('INVALID_INPUT'));
  assert.throws(() => parseKnowledgeCommand(command('approve', { acknowledged: false }), questionId), code('REVIEW_REQUIRED'));
  const content = { canonicalQuestion: 'Test?', aliases: ['Test alias one', 'Test alias two'], approvedAnswer: 'Test', characterAnswers: fixtureState().revisions[0].characterAnswers, source: 'forged' };
  assert.throws(() => parseKnowledgeCommand(command('create_revision', { content }), questionId), code('INVALID_INPUT'));
});
test('all admin service entry points deny guests and ordinary users before reading source or DB', async () => {
  for (const account of [null, { ...testActor, role: 'user' }]) {
    let touched = false;
    const noAccess = async () => { touched = true; throw new Error('should not read'); };
    const service = loader({ './account-session': { currentAccount: async () => account },
      '@/server/repositories/knowledge-admin': { listKnowledgeRecords: noAccess, readKnowledgeState: noAccess, mutateKnowledge: noAccess },
      '@/server/repositories/knowledge-source': { readKnowledgeManifest: noAccess, readKnowledgePreview: noAccess },
    })('@/server/services/knowledge-admin');
    for (const task of [() => service.adminKnowledgeList(), () => service.adminKnowledgeDetail(questionId), () => service.adminKnowledgeMutation(questionId, command('approve'))]) await assert.rejects(task(), code(account ? 'FORBIDDEN' : 'UNAUTHENTICATED'));
    assert.equal(touched, false);
  }
});
test('service ignores no actor metadata, uses actual currentAccount for mutation and returns no automatic publication', async () => {
  let result;
  const service = loader({ './account-session': { currentAccount: async () => testActor },
    '@/server/repositories/knowledge-source': { readKnowledgeManifest: async () => manifest },
    '@/server/repositories/knowledge-admin': { readKnowledgeState: async () => fixtureState(), mutateKnowledge: async (id, expected, planner) => { assert.equal(id, questionId); assert.equal(expected, 0); result = planner(fixtureState()); return { revisionId: result.audit.revisionId }; } },
  })('@/server/services/knowledge-admin');
  await service.adminKnowledgeMutation(questionId, command('approve'));
  assert.equal(result.review.reviewedBy, testActor.userId); assert.equal(result.publication, undefined);
});
test('HTTP adapter authenticates before calling handler and hides DB errors', async () => {
  const deny = loader({ '@/server/services/knowledge-admin': { requireKnowledgeAdmin: async () => { throw new KnowledgeAdminError('FORBIDDEN', 'Denied', 403); } }, '@/server/domain/knowledge-admin': { KnowledgeAdminError } })('@/server/infrastructure/knowledge-admin-http');
  const res = await deny.adminKnowledgeHttp(async () => { throw new Error('handler must not run'); });
  assert.equal(res.status, 403); assert.match(res.headers.get('cache-control'), /no-store/);
  const allow = loader({ '@/server/services/knowledge-admin': { requireKnowledgeAdmin: async () => testActor } })('@/server/infrastructure/knowledge-admin-http');
  const bad = await allow.adminKnowledgeHttp(async () => { throw new Error('mongodb://secret'); });
  assert.equal(bad.status, 503); assert.doesNotMatch(await bad.text(), /mongodb|secret/);
  for (const [body, headers, status] of [['{}', {}, 403], ['{}', { origin: 'https://evil.test' }, 403], ['{}', { origin: 'https://game.test', 'content-type': 'text/plain' }, 415], ['x'.repeat(262145), { origin: 'https://game.test' }, 413], ['{', { origin: 'https://game.test' }, 400]]) {
    await assert.rejects(allow.readKnowledgeBody(new Request('https://game.test/api/admin/knowledge/id', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body })), e => e.status === status);
  }
});
test('revision serialization exposes no import internals to editable payload and preserves actual reviewer', () => {
  const row = approvedState().revisions[0], draft = revisionDraft(row);
  assert.equal(draft._id, questionId); assert.equal(draft.importBatchId, undefined); assert.equal(draft.reviewedBy, testActor.userId);
  assert.equal(typeof draft.reviewedAt, 'string');
});
test('missing source prevents approval/publication but does not prevent emergency unpublish or rejection', () => {
  const state = approvedState(); applyPlan(state, plan(state, command('publish')));
  assert.equal(planKnowledgeMutation(state, command('unpublish'), testActor, undefined).publication, null);
  assert.equal(planKnowledgeMutation(fixtureState(), command('reject'), testActor, undefined).review.status, 'rejected');
  assert.throws(() => planKnowledgeMutation(fixtureState(), command('approve'), testActor, undefined), code('SOURCE_UNAVAILABLE'));
  assert.throws(() => planKnowledgeMutation(approvedState(), command('publish'), testActor, undefined), code('SOURCE_UNAVAILABLE'));
});
test('repository writes use one transaction/session and check optimistic version before mutation planning', async () => {
  const state = fixtureState(), calls = [], session = { withTransaction: async fn => fn(), endSession: async () => calls.push('end') };
  let planCalled = false;
  const collections = {
    knowledge_questions: { createIndex: async () => {}, findOne: async (_q, options) => { assert.equal(options.session, session); return state.question; }, updateOne: async (query, _update, options) => { assert.equal(options.session, session); assert.deepEqual(query.managementVersion, { $exists: false }); calls.push('logical'); return { matchedCount: 1 }; } },
    knowledge_question_revisions: { createIndex: async () => {}, find: (_q, options) => { assert.equal(options.session, session); return { sort: () => ({ toArray: async () => state.revisions }) }; }, updateOne: async (query, _update, options) => { assert.equal(options.session, session); assert.equal(query.status, 'draft'); calls.push('review'); return { matchedCount: 1 }; } },
    knowledge_audit: { createIndex: async () => {}, insertOne: async (_row, options) => { assert.equal(options.session, session); calls.push('audit'); } },
  };
  const repo = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: name => collections[name] }), getMongoClient: async () => ({ startSession: () => session }) } })('@/server/repositories/knowledge-admin');
  await assert.rejects(repo.mutateKnowledge(questionId, 1, s => { planCalled = true; return plan(s, command('approve')); }), code('CONFLICT'));
  assert.equal(planCalled, false); assert.deepEqual(calls, ['end']); calls.length = 0;
  await repo.mutateKnowledge(questionId, 0, s => plan(s, command('approve')));
  assert.deepEqual(calls, ['logical', 'review', 'audit', 'end']);
});
