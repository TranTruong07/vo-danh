import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { loader } from './support/load-typescript.mjs';
import { historyMemory } from './support/chat-history-memory.mjs';

globalThis.fetch = async () => { throw Error('NETWORK_FORBIDDEN'); };
const load = loader();
const privacy = load('@/server/services/chat-history-privacy');
const { ChatError } = load('@/server/domain/chat');
const { KnowledgeAdminError } = load('@/server/domain/knowledge-admin');
const sid = '12345678-1234-1234-1234-123456789abc', owner = 'a'.repeat(64);
const entry = { questionId: 'cmtt45-q017', revisionId: 'cmtt45-q017:v4', canonicalQuestion: 'Hà Nội giành chính quyền ngày nào?', aliases: ['Khởi nghĩa Hà Nội thắng lợi khi nào?'] };
const other = { ...entry, questionId: 'cmtt45-q018', revisionId: 'cmtt45-q018:v3', canonicalQuestion: 'Huế giành chính quyền ngày nào?', aliases: [] };
const suggestion = { questionId: entry.questionId, question: entry.canonicalQuestion };
function fixture(options = {}) {
  const memory = historyMemory(), calls = { ai: 0, answers: 0, limits: 0 };
  let entries = [entry, other];
  const scoped = loader({
    '@/server/domain/chat': load('@/server/domain/chat'),
    '@/server/repositories/chat-history': options.repository || memory,
    './chat-session': { chatPlayerHash: async () => options.owner || owner, resolveChatSession: async () => {
      if (options.invalidSession) throw new ChatError('INVALID_SESSION', 'Expired', 401);
      return { characterId: options.character || 'vo-nguyen-giap' };
    } },
    './chat-rate-limit': { limitChatRequests: async () => { calls.limits++; } },
    './chat-ai-matching': { assistChatMatch: async () => { calls.ai++; return options.ai || { match: { type: 'suggest', suggestions: [suggestion] }, outcome: 'disabled', calls: 0, cacheHit: false }; } },
    '@/server/repositories/chat-knowledge': {
      readPublishedChatIndex: async () => entries,
      readPublishedChatAnswer: async (id, character, revision) => {
        calls.answers++;
        const row = entries.find(e => e.questionId === id && (!revision || e.revisionId === revision));
        return row ? { ...row, answer: `Stored ${character}`, source: { sectionId: 'IV', document: 'source' } } : null;
      },
    },
  });
  return { chat: scoped('@/server/services/chat'), history: scoped('@/server/services/chat-history'), memory, calls, revoke: () => { entries = []; } };
}
const ask = (f, message = 'Hà Nội khởi nghĩa vào hôm nào nhỉ?', requestId = randomUUID()) => f.chat.sendChatMessage({ sessionId: sid, message, requestId });
const only = f => [...f.memory.rows.values()][0];

test('history stores exact and alias separately, untouched answers, server character and Published revision', async () => {
  for (const [message, source] of [[entry.canonicalQuestion, 'exact_match'], [entry.aliases[0], 'alias_match']]) {
    const f = fixture(); const response = await ask(f, message); const row = only(f);
    assert.equal(response.answer, 'Stored vo-nguyen-giap'); assert.equal(row.matchingSource, source);
    assert.equal(row.outcome, 'answered'); assert.equal(row.publishedVersionId, entry.revisionId);
    assert.equal(row.characterId, 'vo-nguyen-giap'); assert.equal(f.calls.ai, 0); assert.equal(row.providerCalls, 0);
    assert.ok(row.latencyMs >= 0); assert.equal(row.feedbackStatus, 'not_requested');
    assert.notEqual(row.sessionRef, sid); assert.notEqual(row.sessionRef, owner);
    assert.doesNotMatch(JSON.stringify(row), /Stored|cookie|apiKey|userAgent|sessionId|ownerHash/);
    assert.doesNotMatch(JSON.stringify(response), /sessionRef|requestHash|interactionId/);
  }
});
for (const character of ['truong-chinh', 'le-duan', 'pham-van-dong', 'vo-nguyen-giap']) test(`server persona history: ${character}`, async () => {
  const f = fixture({ character }); await ask(f, entry.canonicalQuestion); assert.equal(only(f).characterId, character);
});
for (const [label, ai, source, failure] of [
  ['Gemini success', { outcome: 'match', calls: 1, suggestionSource: 'gemini' }, 'gemini_match'],
  ['cache hit', { outcome: 'cache', cacheHit: true, suggestionSource: 'cache' }, 'cache_hit'],
  ['cached no_match uses local candidates', { outcome: 'cache', cacheHit: true }, 'local_fallback'],
  ['local disabled', { outcome: 'disabled' }, 'local_fallback'],
  ['HTTP 504 fallback', { outcome: 'provider_504', unavailable: true, calls: 1, failureKind: 'timeout' }, 'local_fallback', 'timeout'],
  ['HTTP 503', { outcome: 'provider_503', unavailable: true, calls: 1, failureKind: 'provider_error' }, 'local_fallback', 'provider_error'],
  ['quota', { outcome: 'quota', unavailable: true }, 'quota_exceeded', 'quota_exceeded'],
  ['HTTP 429', { outcome: 'provider_429', unavailable: true, calls: 1, failure: { httpStatus: 429 } }, 'quota_exceeded', 'quota_exceeded'],
  ['invalid JSON', { outcome: 'invalid_output', unavailable: true, calls: 1 }, 'local_fallback', 'invalid_output'],
]) test(`matching metadata: ${label}`, async () => {
  const f = fixture({ ai: { match: { type: 'suggest', suggestions: [suggestion] }, calls: 0, cacheHit: false, ...ai } });
  const response = await ask(f); const row = only(f);
  assert.equal(response.status, 'suggest'); assert.equal(row.outcome, 'suggested'); assert.equal(row.matchingSource, source);
  assert.equal(row.providerFailure, failure); assert.equal(row.providerCalls, ai.calls || 0);
  assert.equal(row.answeredQuestionId, undefined); assert.equal(row.selectedQuestionId, undefined);
});
for (const [message, ai, source] of [
  ['Câu hỏi chưa rõ', { outcome: 'no_candidates' }, 'clarify'],
  ['Câu hỏi chưa rõ', { outcome: 'provider_504', unavailable: true, failureKind: 'timeout' }, 'provider_unavailable'],
  ['Giá Bitcoin hôm nay?', { outcome: 'no_candidates' }, 'out_of_scope'],
]) test(`unresolved category: ${source}`, async () => {
  const f = fixture({ ai: { match: { type: 'none' }, calls: 0, cacheHit: false, ...ai } });
  await ask(f, message); assert.equal(only(f).matchingSource, source); assert.equal(only(f).outcome, 'unresolved');
  assert.equal(only(f).reviewReason, source === 'clarify' ? 'no_candidate' : source);
});
test('selecting a server-offered suggestion records one selection and stored revision; repeated selection is idempotent', async () => {
  const f = fixture(); const response = await ask(f);
  const input = { sessionId: sid, questionId: entry.questionId, offerToken: response.suggestions[0].offerToken, requestId: randomUUID() };
  const answer = await f.chat.selectChatAnswer(input), before = only(f).selectedAt;
  await f.chat.selectChatAnswer(input);
  assert.equal(answer.status, 'answered'); assert.equal(f.memory.rows.size, 1);
  assert.equal(only(f).selectedQuestionId, entry.questionId); assert.equal(only(f).publishedVersionId, entry.revisionId);
  assert.equal(only(f).selectedAt, before); assert.equal(only(f).outcome, 'answered');
});
test('legacy client may select only a persisted offer in the same session', async () => {
  const f = fixture();
  await assert.rejects(f.chat.selectChatAnswer({ sessionId: sid, questionId: entry.questionId }), e => e.code === 'INVALID_SUGGESTION');
  await ask(f);
  assert.equal((await f.chat.selectChatAnswer({ sessionId: sid, questionId: entry.questionId })).status, 'answered');
  await assert.rejects(f.chat.selectChatAnswer({ sessionId: sid, questionId: other.questionId }), e => e.code === 'INVALID_SUGGESTION');
});
test('foreign session, changed ID and altered signature cannot select an offer', async () => {
  const f = fixture(); const offered = (await ask(f)).suggestions[0];
  for (const patch of [{ sessionId: randomUUID() }, { questionId: other.questionId }, { sessionId: randomUUID(), offerToken: offered.offerToken + 'x' }]) {
    await assert.rejects(f.chat.selectChatAnswer({ sessionId: sid, questionId: entry.questionId, offerToken: offered.offerToken, ...patch }), e => e.code === 'INVALID_SUGGESTION');
  }
});
test('concurrent selections from the same offer have only one winner; same choice retry succeeds', async () => {
  const f = fixture({ ai: { match: { type: 'suggest', suggestions: [suggestion, { questionId: other.questionId, question: other.canonicalQuestion }] }, outcome: 'disabled', calls: 0, cacheHit: false } });
  const offered = (await ask(f)).suggestions;
  const result = await Promise.allSettled(offered.map(s => f.chat.selectChatAnswer({ sessionId: sid, questionId: s.questionId, offerToken: s.offerToken })));
  assert.equal(result.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(result.find(r => r.status === 'rejected').reason.code, 'SELECTION_CONFLICT');
});
test('request replay avoids a second provider call and record; new request ID remains a new ask', async () => {
  const f = fixture(), id = randomUUID();
  await ask(f, 'Hà Nội khởi nghĩa hôm nào?', id); await ask(f, 'Hà Nội khởi nghĩa hôm nào?', id);
  assert.equal(f.memory.rows.size, 1); assert.equal(f.calls.ai, 1); assert.equal(f.calls.limits, 2);
  await assert.rejects(ask(f, 'Huế khởi nghĩa hôm nào?', id), e => e.code === 'REQUEST_CONFLICT');
  await ask(f, 'Hà Nội khởi nghĩa hôm nào?'); assert.equal(f.memory.rows.size, 2);
});
test('concurrent identical request inserts only one history row', async () => {
  const f = fixture(), id = randomUUID(); await Promise.all([ask(f, entry.canonicalQuestion, id), ask(f, entry.canonicalQuestion, id)]);
  assert.equal(f.memory.rows.size, 1);
});
test('revoked Published revisions are not returned on retry or suggestion selection', async () => {
  const f = fixture(), id = randomUUID(); await ask(f, entry.canonicalQuestion, id); f.revoke();
  assert.notEqual((await ask(f, entry.canonicalQuestion, id)).status, 'answered');
  const g = fixture(); const offered = (await ask(g)).suggestions[0]; g.revoke();
  assert.notEqual((await g.chat.selectChatAnswer({ sessionId: sid, questionId: offered.questionId, offerToken: offered.offerToken })).status, 'answered');
  assert.equal(only(g).outcome, 'suggested');
});
test('history outages never suppress valid exact, suggestion or signed selection responses', async () => {
  const fail = async () => { throw Error('secret mongodb uri'); };
  const f = fixture({ repository: { readInteraction: fail, recordInteraction: fail, latestOfferedInteraction: fail, recordSelection: fail } });
  assert.equal((await ask(f, entry.canonicalQuestion)).status, 'answered');
  const s = (await ask(f)).suggestions[0];
  assert.equal((await f.chat.selectChatAnswer({ sessionId: sid, questionId: s.questionId, offerToken: s.offerToken })).status, 'answered');
});
test('a hanging history write is bounded and still returns the stored answer', async () => {
  const memory = historyMemory();
  const f = fixture({ repository: { ...memory, recordInteraction: async () => new Promise(() => {}) } });
  const start = performance.now();
  assert.equal((await ask(f, entry.canonicalQuestion)).status, 'answered');
  assert.ok(performance.now() - start < 2200);
});
test('request fingerprints contain only sanitized text, not a hash of a raw secret', async () => {
  const f = fixture(); const raw = 'api_key=very-private-secret'; await ask(f, raw);
  assert.notEqual(only(f).requestHash, privacy.historyHash(raw));
  assert.equal(only(f).requestHash, privacy.historyHash(privacy.sanitizeChatText(raw).text));
});
test('invalid sessions and persona overrides do not create history', async () => {
  const f = fixture({ invalidSession: true });
  await assert.rejects(ask(f), e => e.code === 'INVALID_SESSION'); assert.equal(f.memory.rows.size, 0);
  await assert.rejects(f.chat.sendChatMessage({ sessionId: sid, message: 'hi', characterId: 'le-duan' }), e => e.code === 'INVALID_INPUT');
});
test('starter offers are recorded separately from user questions', async () => {
  const f = fixture(); await f.chat.suggestChatQuestions({ sessionId: sid }); assert.equal(only(f).kind, 'starter'); assert.equal(only(f).question, '');
});
test('normalization groups Unicode/case/spacing but preserves historical distinctions and server persona', () => {
  const id = text => privacy.chatGroupId('vo-nguyen-giap', text);
  assert.equal(id('  HÀ NỘI   ở đâu?'), id('hà nội ở đâu'.normalize('NFD')));
  for (const [a, b] of [['Hà Nội thắng lợi?', 'Huế thắng lợi?'], ['Huế thắng lợi?', 'Sài Gòn thắng lợi?'], ['Ngày 19/8?', 'Ngày 23/8?'], ['Ngày 23/8?', 'Ngày 25/8?'], ['Ban bố Quân lệnh số 1?', 'Đọc Quân lệnh số 1?'], ['Đã thắng lợi?', 'Không thắng lợi?'], ['Vai trò Lê Duẩn?', 'Vai trò Trường Chinh?']]) assert.notEqual(id(a), id(b));
  assert.notEqual(id('hà nội'), privacy.chatGroupId('le-duan', 'hà nội'));
  assert.notEqual(id('hà nội'), id('ha noi'));
});
test('sensitive input is redacted; unrelated redacted questions never auto-merge', () => {
  for (const raw of ['api_key=SECRET', 'Mật khẩu abc123', 'email a@demo.com', 'Liên hệ 0901234567', 'https://example.test/private?token=secret', 'mongodb+srv://secret']) {
    const result = privacy.sanitizeChatText(raw); assert.equal(result.redacted, true);
    assert.doesNotMatch(result.text, /SECRET|abc123|demo.com|0901234567|example.test|mongodb/);
  }
  assert.equal(privacy.sanitizeChatText('Ngày 19/8/1945?').text, 'Ngày 19/8/1945?');
  assert.equal(privacy.sanitizeChatText('x '.repeat(400)).text.length, 500);
  assert.notEqual(privacy.chatGroupId('le-duan', '[redacted]', true, 'one'), privacy.chatGroupId('le-duan', '[redacted]', true, 'two'));
});
test('retention defaults to 30 days and rejects unsafe configuration', async () => {
  for (const value of [undefined, 'bad', '-1', '0', '366']) assert.equal(privacy.historyRetentionDays({ CHAT_HISTORY_RETENTION_DAYS: value }), 30);
  assert.equal(privacy.historyRetentionDays({ CHAT_HISTORY_RETENTION_DAYS: '7' }), 7);
  const f = fixture(); await ask(f); assert.ok(only(f).expiresAt > only(f).createdAt);
});

function adminFixture(options = {}) {
  const calls = [], groupId = 'b'.repeat(64);
  const group = { _id: groupId, question: 'Hà Nội hỏi gì?', characterId: 'vo-nguyen-giap', count: 1, unresolved: 1, review: null };
  const scoped = loader({
    '@/server/domain/knowledge-admin': load('@/server/domain/knowledge-admin'),
    './knowledge-admin': { requireKnowledgeAdmin: async () => { if (options.denied) throw new KnowledgeAdminError('FORBIDDEN', 'No', 403); return { userId: 'real-admin', email: 'test@example.invalid' }; } },
    '@/server/repositories/chat-knowledge': { readPublishedChatIndex: async () => [entry] },
    '@/server/repositories/chat-history': {
      chatAnalytics: async f => { calls.push(f); return {}; }, queryChatGroups: async f => { calls.push(f); return { items: [], total: 0 }; },
      readChatGroup: async id => id === groupId ? { group, interactions: [], audit: [] } : null,
      updateChatReview: async (row, expected, actor) => { calls.push({ row, expected, actor }); return !options.conflict; },
      deleteChatGroup: async (id, actor) => { calls.push({ id, actor }); return 1; },
    },
  });
  return { service: scoped('@/server/services/chat-history-admin'), calls, groupId };
}
test('admin filters bound dates, pages, page size, strings and known personas; reject Mongo operators', () => {
  const { service } = adminFixture(); const parse = service.parseChatHistoryFilter;
  assert.equal(parse({}).pageSize, 20);
  for (const filter of [{ page: 0 }, { page: 501 }, { pageSize: 100 }, { text: { $ne: '' } }, { characterId: 'fake' }, { status: 'approved' }, { from: '2020-01-01', to: '2026-01-01' }, { from: 'nonsense' }, { token: 'secret' }, { text: 'x'.repeat(121) }]) assert.throws(() => parse(filter));
});
test('all admin service entrypoints enforce authorization before repository access', async () => {
  const f = adminFixture({ denied: true });
  for (const [method, args] of [['adminChatAnalytics', [{}]], ['adminChatQuestions', [{}]], ['adminChatDetail', [f.groupId, {}]], ['adminChatReview', [f.groupId, {}]], ['adminDeleteChatHistory', [f.groupId, {}]]]) {
    await assert.rejects(f.service[method](...args), e => e.code === 'FORBIDDEN');
  }
  assert.equal(f.calls.length, 0);
});
test('review persists real admin, increments version, sanitizes notes and links only Published', async () => {
  const f = adminFixture();
  const input = { status: 'linked_existing', expectedVersion: 0, note: 'email me a@test.invalid', linkedQuestionId: entry.questionId };
  await f.service.adminChatReview(f.groupId, input);
  assert.equal(f.calls[0].actor, 'real-admin'); assert.equal(f.calls[0].row.version, 1);
  assert.equal(f.calls[0].row.linkedRevisionId, entry.revisionId); assert.doesNotMatch(f.calls[0].row.note, /test.invalid/);
  await assert.rejects(f.service.adminChatReview(f.groupId, { ...input, linkedQuestionId: 'cmtt45-q999' }), e => e.code === 'NOT_PUBLISHED');
  await assert.rejects(f.service.adminChatReview(f.groupId, { ...input, reviewer: 'fake' }), e => e.code === 'INVALID_INPUT');
});
test('stale admin revision rejects without overwriting another review', async () => {
  const f = adminFixture({ conflict: true });
  await assert.rejects(f.service.adminChatReview(f.groupId, { status: 'resolved', expectedVersion: 0, note: 'Reviewed' }), e => e.code === 'CONFLICT');
});
test('manual equivalent reference requires a real different group; no automatic fuzzy merging', async () => {
  const f = adminFixture();
  for (const id of [f.groupId, 'c'.repeat(64)]) await assert.rejects(f.service.adminChatReview(f.groupId, { status: 'reviewing', expectedVersion: 0, note: '', equivalentGroupId: id }), e => e.code === 'INVALID_GROUP');
});
test('history deletion needs explicit confirmation and authenticated real actor', async () => {
  const f = adminFixture();
  await assert.rejects(f.service.adminDeleteChatHistory(f.groupId, { confirm: true }));
  assert.deepEqual(await f.service.adminDeleteChatHistory(f.groupId, { confirm: 'DELETE_HISTORY' }), { deleted: 1 });
  assert.equal(f.calls[0].actor, 'real-admin');
});
test('admin search stays in request body and uses escaped React content', () => {
  const ui = fs.readFileSync('features/admin/chat-history-admin.tsx', 'utf8');
  assert.doesNotMatch(ui, /dangerouslySetInnerHTML|URLSearchParams|\?text=/);
  assert.match(ui, /JSON.stringify\(body\)/);
});

test('Mongo adapter initializes TTL only on history, uses setOnInsert and conditional selection', async () => {
  const calls = []; let stored = null;
  const db = { collection: name => ({
    createIndexes: async indexes => { calls.push({ name, indexes }); }, createIndex: async index => { calls.push({ name, index }); },
    updateOne: async (...args) => { calls.push({ name, update: args }); },
    findOneAndUpdate: async (...args) => { calls.push({ name, selection: args }); return null; },
    findOne: async () => stored,
  }) };
  const repo = loader({ '@/lib/db/client': { getDatabase: async () => db } })('@/server/repositories/chat-history');
  await repo.recordInteraction({ _id: 'id' });
  assert.equal(calls.filter(c => c.indexes).length, 1); assert.equal(calls[0].name, 'chat_interactions');
  assert.deepEqual(calls[0].indexes.find(i => i.expireAfterSeconds === 0).key, { expiresAt: 1 });
  assert.deepEqual(calls.find(c => c.update).update[1], { $setOnInsert: { _id: 'id' } });
  stored = { selectedQuestionId: 'cmtt45-q018', suggestedQuestionIds: [entry.questionId] };
  assert.equal(await repo.recordSelection('id', 'ref', entry.questionId, entry.revisionId, 5), 'conflict');
  const selection = calls.find(c => c.selection).selection;
  assert.deepEqual(selection[0].selectedQuestionId, { $exists: false }); assert.equal(selection[0].sessionRef, 'ref');
});
test('Mongo list escapes regex, excludes expired rows, caps pagination and applies review status', async () => {
  let captured;
  const repo = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: () => ({ aggregate: (pipeline, options) => { captured = { pipeline, options }; return { toArray: async () => [{ items: [], count: [] }] }; } }) }) } })('@/server/repositories/chat-history');
  const f = adminFixture().service.parseChatHistoryFilter({ text: '.*', status: 'new', page: 2, pageSize: 10 });
  await repo.queryChatGroups(f);
  assert.equal(captured.pipeline[0].$match.question.$regex, '\\.\\*');
  assert.ok(captured.pipeline[0].$match.expiresAt.$gt instanceof Date);
  assert.deepEqual(captured.pipeline.at(-1).$facet.items, [{ $skip: 10 }, { $limit: 10 }]);
  assert.equal(captured.options.maxTimeMS, 3000);
});
test('Mongo detail projection never sends pseudonymous session or request fingerprint to client', async () => {
  const finds = [];
  const cursor = { sort() { return this; }, skip() { return this; }, limit() { return this; }, async toArray() { return []; } };
  const repo = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: name => ({
    aggregate: () => ({ toArray: async () => [{ _id: 'group' }] }), find: (filter, options) => { finds.push({ name, filter, options }); return cursor; },
  }) }) } })('@/server/repositories/chat-history');
  await repo.readChatGroup('group');
  assert.deepEqual(finds[0].options.projection, { sessionRef: 0, requestHash: 0 });
});

test('actual admin authentication rejects missing account/user role and accepts real admin identity', async () => {
  for (const account of [null, { role: 'user', userId: 'u' }, { role: 'admin', userId: 'admin-real', email: 'admin@example.invalid' }]) {
    const scoped = loader({ './account-session': { currentAccount: async () => account } });
    const auth = scoped('@/server/services/knowledge-admin');
    if (account?.role === 'admin') assert.equal((await auth.requireKnowledgeAdmin()).userId, 'admin-real');
    else await assert.rejects(auth.requireKnowledgeAdmin(), e => e.status === (account ? 403 : 401));
  }
});
test('admin HTTP rejects foreign origins, malformed input and emits private no-store responses', async () => {
  const scoped = loader({ '@/server/services/knowledge-admin': { requireKnowledgeAdmin: async () => ({ userId: 'real' }) } });
  const http = scoped('@/server/infrastructure/knowledge-admin-http');
  const request = origin => new Request('https://game.test/api/admin/chat-questions', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{}' });
  await assert.rejects(http.readKnowledgeBody(request('https://foreign.test')), e => e.status === 403);
  assert.deepEqual(await http.readKnowledgeBody(request('https://game.test')), {});
  const response = await http.adminKnowledgeHttp(async () => ({ ok: true }));
  assert.match(response.headers.get('cache-control'), /no-store, private/); assert.equal(response.headers.get('vary'), 'Cookie');
});
test('review and audit share the same transaction; stale version writes neither', async () => {
  const calls = [];
  const session = { withTransaction: async (operation, options) => { calls.push({ options }); return operation(); }, endSession: async () => {} };
  let before = null;
  const db = { collection: name => ({
    createIndexes: async () => {}, createIndex: async () => {},
    findOne: async (filter, options) => { assert.equal(options.session, session); return before; },
    replaceOne: async (filter, row, options) => { calls.push({ name, row, options, filter }); },
    insertOne: async (row, options) => { calls.push({ name, row, options }); },
  }) };
  const repo = loader({ '@/lib/db/client': { getDatabase: async () => db, getMongoClient: async () => ({ startSession: () => session }) } })('@/server/repositories/chat-history');
  const row = { _id: 'g', status: 'reviewing', version: 1, note: 'private note', updatedAt: new Date(), updatedBy: 'admin' };
  assert.equal(await repo.updateChatReview(row, 0, 'admin'), true);
  const audit = calls.find(c => c.name === 'chat_review_audit');
  assert.equal(audit.options.session, session); assert.equal(audit.row.actorId, 'admin');
  assert.equal(audit.row.action, 'review'); assert.equal(audit.row.note, undefined);
  assert.equal(calls[0].options.writeConcern.w, 'majority');
  before = { ...row, version: 4 }; calls.length = 0;
  assert.equal(await repo.updateChatReview(row, 0, 'admin'), false);
  assert.equal(calls.filter(c => c.row).length, 0);
});
test('history deletion transaction affects only chat history/review, preserving knowledge and audit', async () => {
  const calls = [], session = { withTransaction: async fn => fn(), endSession: async () => {} };
  const db = { collection: name => ({
    createIndexes: async () => {}, createIndex: async () => {},
    deleteMany: async (filter, options) => { calls.push({ name, method: 'deleteMany', filter }); assert.equal(options.session, session); return { deletedCount: 2 }; },
    deleteOne: async (filter, options) => { calls.push({ name, method: 'deleteOne', filter }); assert.equal(options.session, session); },
    insertOne: async (row, options) => { calls.push({ name, method: 'insertOne', row }); assert.equal(options.session, session); },
  }) };
  const repo = loader({ '@/lib/db/client': { getDatabase: async () => db, getMongoClient: async () => ({ startSession: () => session }) } })('@/server/repositories/chat-history');
  assert.equal(await repo.deleteChatGroup('group', 'real-admin'), 2);
  assert.deepEqual(calls.map(c => [c.name, c.method]), [['chat_interactions', 'deleteMany'], ['chat_question_reviews', 'deleteOne'], ['chat_review_audit', 'insertOne']]);
  assert.equal(calls[2].row.deletedCount, 2);
});
test('analytics is bounded server-side, uses distinct groups and never counts starter offers as asks', async () => {
  const pipelines = [];
  const repo = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: () => ({ aggregate: (pipeline, options) => {
    pipelines.push(pipeline); assert.equal(options.maxTimeMS, 3000);
    return { toArray: async () => [] };
  } }) }) } })('@/server/repositories/chat-history');
  const result = await repo.chatAnalytics(adminFixture().service.parseChatHistoryFilter({}));
  assert.equal(result.totals.asks, 0);
  assert.ok(pipelines.every(p => p[0].$match.kind === 'question'));
  assert.equal(pipelines[0].at(-1).$facet.popular.at(-1).$limit, 10);
});
test('long or invalid optional client metadata is rejected without weakening strict payload validation', () => {
  const { validateChatInput } = load('@/server/domain/chat');
  for (const input of [{ sessionId: sid, message: 'hi', requestId: 'fake' }, { sessionId: sid, message: 'hi', offerToken: 'abc' }, { sessionId: sid, questionId: entry.questionId, offerToken: 'x'.repeat(1001) }]) assert.throws(() => validateChatInput(input, 'questionId' in input ? 'answer' : 'message'));
});
