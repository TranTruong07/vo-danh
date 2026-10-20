import test from 'node:test';
import assert from 'node:assert/strict';
import { loader } from './support/load-typescript.mjs';
import { historyMemory } from './support/chat-history-memory.mjs';

const load = loader();
const { matchChatQuestion } = load('@/server/services/chat-matcher');
const { retrieveAiCandidates } = load('@/server/services/chat-ai-candidates');
const { parseAiDecision, compatibleAiCandidate, safeAiMessage } = load('@/server/domain/chat-ai');
const config = { enabled: true, model: 'test-model', timeoutMs: 100, maxCandidates: 8, perMinute: 5, perDay: 100, matchTtlSeconds: 3600, noMatchTtlSeconds: 120 };
const row = { questionId: 'cmtt45-q017', revisionId: 'cmtt45-q017:v4', canonicalQuestion: 'Khởi nghĩa giành chính quyền ở Hà Nội thắng lợi ngày nào?', aliases: ['Hà Nội giành chính quyền khi nào?'] };
const message = 'Hà Nội khởi nghĩa thắng lợi vào hôm nào vậy?';
const sid = '12345678-1234-1234-1234-123456789abc';
const json = (questionId = row.questionId) => JSON.stringify({ decision: questionId ? 'match' : 'no_match', questionId, confidence: .99, reason: 'Cùng ý hỏi.' });

function fixture(options = {}) {
  const counters = new Map(), cache = new Map(), calls = [], writes = [];
  const entries = options.entries || [row];
  const configValue = { ...config, ...options.config };
  const mocks = {
    '@/server/repositories/chat-history': historyMemory(),
    './chat-ai-config': { chatAiConfig: () => configValue },
    '@/server/repositories/chat-ai-cache': {
      readAiCache: async key => { if (options.cacheError) throw Error('private'); return cache.get(key) || null; },
      writeAiCache: async (key, value, ttl) => { cache.set(key, value); writes.push({ key, value, ttl }); },
    },
    '@/server/repositories/chat-limits': { incrementChatLimit: async id => { if (options.quotaError) throw Error('db'); counters.set(id, (counters.get(id) || 0) + 1); return counters.get(id); } },
    '@/server/repositories/chat-knowledge': {
      readPublishedChatIndex: async () => options.fresh || entries,
      readPublishedChatAnswer: async (id, persona, revision) => {
        if (options.noAnswer) return null;
        const found = (options.fresh || entries).find(r => r.questionId === id && (!revision || revision === r.revisionId));
        return found ? { ...found, answer: `Đã duyệt ${persona}`, source: { document: 'source', sectionId: 'IV.2' } } : null;
      },
    },
    '@/server/infrastructure/gemini-question-matcher': { generateQuestionMatch: async (...args) => {
      calls.push(args); if (options.error) throw options.error; return options.output ?? json();
    } },
    './chat-session': { chatPlayerHash: async () => 'owner', resolveChatSession: async () => { if (options.invalidSession) throw Error('session'); return { characterId: options.persona || 'vo-nguyen-giap' }; } },
    './chat-rate-limit': { limitChatRequests: async () => { if (options.chatLimited) throw Error('chat_quota'); } },
  };
  const scoped = loader(mocks);
  const ai = scoped('@/server/services/chat-ai-matching');
  return { ...ai, chat: scoped('@/server/services/chat'), calls, cache, writes, counters, configValue,
    run: () => ai.assistChatMatch(message, entries, matchChatQuestion(message, entries), options.persona || 'vo-nguyen-giap') };
}

test('exact and normalized alias bypass AI even enabled; all four stored personas unchanged', async () => {
  for (const persona of ['truong-chinh', 'le-duan', 'pham-van-dong', 'vo-nguyen-giap']) {
    const f = fixture({ persona });
    for (const text of [row.canonicalQuestion, '  HÀ NỘI GIÀNH CHÍNH QUYỀN KHI NÀO?!  ']) {
      const answer = await f.chat.sendChatMessage({ sessionId: sid, message: text });
      assert.equal(answer.status, 'answered'); assert.equal(answer.answer, `Đã duyệt ${persona}`);
    }
    assert.equal(f.calls.length, 0); assert.equal(f.counters.size, 0);
  }
});
test('fuzzy enabled uses one call, valid selection is suggest only, click reads stored answer', async () => {
  const f = fixture();
  const response = await f.chat.sendChatMessage({ sessionId: sid, message });
  assert.equal(response.status, 'suggest'); assert.equal(response.suggestions[0].questionId, row.questionId);
  assert.equal('answer' in response, false); assert.equal(f.calls.length, 1);
  const selected = await f.chat.selectChatAnswer({ sessionId: sid, questionId: row.questionId });
  assert.equal(selected.answer, 'Đã duyệt vo-nguyen-giap'); assert.equal(f.calls.length, 1);
});
test('disabled has identical legacy result and no AI cache or quota access', async () => {
  const f = fixture({ config: { enabled: false }, cacheError: true });
  const result = await f.run();
  assert.deepEqual(result.match, matchChatQuestion(message, [row])); assert.equal(result.calls, 0); assert.equal(f.counters.size, 0);
});
test('no_match falls back and caches for the shorter TTL', async () => {
  const f = fixture({ output: json(null) });
  assert.deepEqual((await f.run()).match, matchChatQuestion(message, [row]));
  assert.equal(f.writes[0].ttl, 120); assert.deepEqual(f.writes[0].value, { decision: 'no_match', questionId: null });
  assert.equal((await f.run()).cacheHit, true); assert.equal(f.calls.length, 1);
});
for (const [name, options] of [
  ['unknown ID', { output: json('cmtt45-q999') }], ['invalid JSON', { output: '{bad' }],
  ['timeout', { error: Error('gemini_timeout') }], ['429', { error: { status: 429 } }],
  ['503', { error: { status: 503 } }], ['invalid key', { error: { status: 400 } }],
  ['model unavailable', { error: { status: 404 } }], ['network', { error: Error('network') }],
]) test(`${name} falls back without retry or leaking provider output`, async () => {
  const f = fixture(options), result = await f.run();
  assert.deepEqual(result.match, matchChatQuestion(message, [row])); assert.equal(f.calls.length, 1);
  assert.equal(f.writes.length, 0); assert.equal('reason' in result, false);
});
test('cache hit avoids second call and rereads selected persona answer', async () => {
  const f = fixture();
  await f.run(); const result = await f.run();
  assert.equal(result.cacheHit, true); assert.equal(result.calls, 0); assert.equal(f.calls.length, 1);
  assert.match(f.writes[0].key, /^[a-f0-9]{64}$/);
  assert.deepEqual(Object.keys(f.writes[0].value).sort(), ['decision', 'questionId']);
});
test('cache key includes model, canonical, aliases, candidates, revision, normalized query', () => {
  const f = fixture(), key = f.aiCacheKey(message, [row], config.model);
  assert.equal(key, f.aiCacheKey(` ${message.toUpperCase()} `, [row], config.model));
  for (const [text, rows, model] of [
    [message + ' không', [row], config.model], [message, [row], 'other'],
    [message, [{ ...row, revisionId: 'v5' }], config.model], [message, [{ ...row, aliases: ['other'] }], config.model],
    [message, [{ ...row, canonicalQuestion: 'other' }], config.model], [message, [], config.model],
  ]) assert.notEqual(key, f.aiCacheKey(text, rows, model));
});
test('republish/revoke/missing persona while awaiting AI rejects stale choice, including cache hits', async () => {
  for (const options of [{ fresh: [] }, { fresh: [{ ...row, revisionId: 'v5' }] }, { noAnswer: true }]) {
    const f = fixture(options);
    assert.equal((await f.run()).outcome, 'revalidation_rejected');
    assert.equal((await f.run()).outcome, 'revalidation_rejected');
    assert.equal(f.calls.length, 1);
  }
});
test('shared quota reservations cap concurrent instances at minute/day budgets; storage failure is closed', async () => {
  const f = fixture();
  const accepted = await Promise.all(Array.from({ length: 30 }, () => f.reserveAiQuota({ ...config, perMinute: 5 }, 65000)));
  assert.equal(accepted.filter(Boolean).length, 5);
  const day = fixture();
  assert.equal(await day.reserveAiQuota({ ...config, perDay: 1 }, 65000), true);
  assert.equal(await day.reserveAiQuota({ ...config, perDay: 1 }, 125000), false);
  for (const options of [{ quotaError: true }, { cacheError: true }, { config: { perMinute: 0 } }, { config: { perDay: 0 } }]) {
    const blocked = fixture(options); await blocked.run(); assert.equal(blocked.calls.length, 0);
  }
});
test('invalid session and existing chat quota reject before AI work', async () => {
  for (const options of [{ invalidSession: true }, { chatLimited: true }]) {
    const f = fixture(options);
    await assert.rejects(f.chat.sendChatMessage({ sessionId: sid, message }));
    assert.equal(f.calls.length, 0); assert.equal(f.counters.size, 0);
  }
});
test('retrieval expands beyond legacy top3, deduplicates, caps and uses only supplied published index', () => {
  const entries = Array.from({ length: 12 }, (_, i) => ({ ...row, questionId: `cmtt45-q${String(i + 1).padStart(3, '0')}` }));
  entries[10] = { ...entries[10], canonicalQuestion: 'Tân Trào chuẩn bị khởi nghĩa ra sao?', aliases: [] };
  const legacy = { type: 'suggest', suggestions: entries.slice(0, 3).map(e => ({ questionId: e.questionId, question: e.canonicalQuestion })) };
  const selected = retrieveAiCandidates('chuẩn bị khởi nghĩa Tân Trào', entries, legacy, 8);
  // Phase 5C.3B: do not pad Tân Trào results with incompatible Hà Nội rows.
  assert.equal(selected.length, 1); assert.equal(selected[0].questionId, entries[10].questionId);
  const capped = retrieveAiCandidates(message, entries, legacy, 8);
  assert.equal(capped.length, 8); assert.equal(new Set(capped.map(e => e.questionId)).size, 8);
  assert.ok(selected.every(e => entries.includes(e)));
  assert.deepEqual(retrieveAiCandidates('recipe pasta', entries, { type: 'none' }, 8), []);
});
test('runtime schema rejects extra fields, fake IDs, invalid confidence/reason and inconsistent decisions', () => {
  assert.deepEqual(parseAiDecision(json(), [row]), { decision: 'match', questionId: row.questionId });
  for (const patch of [{ answer: 'invented' }, { confidence: 5 }, { confidence: '1' }, { reason: 'x'.repeat(201) }, { decision: 'no_match' }, { questionId: null }]) {
    assert.equal(parseAiDecision(JSON.stringify({ ...JSON.parse(json()), ...patch }), [row]), null);
  }
});
test('conservative location/person/date/negation guards and private input filter', () => {
  assert.equal(compatibleAiCandidate('Huế khởi nghĩa ngày nào?', row), false);
  assert.equal(compatibleAiCandidate('Hà Nội chưa thắng lợi khi nào?', row), false);
  assert.equal(compatibleAiCandidate('Võ Nguyên Giáp làm gì?', { ...row, canonicalQuestion: 'Lê Duẩn làm gì?', aliases: [] }), false);
  assert.equal(compatibleAiCandidate('Ngày 2/9/1954 xảy ra chuyện gì?', { ...row, canonicalQuestion: 'Ngày 2/9/1945 xảy ra chuyện gì?', aliases: [] }), false);
  for (const text of ['Liên hệ me@example.test', 'https://secret.test', 'Gọi 0912345678', 'a'.repeat(40)]) assert.equal(safeAiMessage(text), false);
  assert.equal(safeAiMessage('Ngày 2/9/1945 có gì?'), true);
});
test('cache repository uses dedicated collection, TTL and no raw prompts', async () => {
  const operations = [];
  const rows = { createIndex: async (...args) => operations.push(['index', ...args]),
    findOne: async (query, options) => { operations.push(['find', query, options]); return { decision: { decision: 'match', questionId: row.questionId } }; },
    updateOne: async (...args) => operations.push(['update', ...args]),
  };
  const repo = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: name => { assert.equal(name, 'chat_ai_match_cache'); return rows; } }) } })('@/server/repositories/chat-ai-cache');
  await repo.writeAiCache('hash', { decision: 'no_match', questionId: null }, 120);
  assert.equal((await repo.readAiCache('hash')).questionId, row.questionId);
  assert.equal(operations.filter(o => o[0] === 'index').length, 1);
  assert.equal(operations.find(o => o[0] === 'index')[2].expireAfterSeconds, 0);
  assert.ok(operations.find(o => o[0] === 'find')[1].expiresAt.$gt instanceof Date);
  assert.equal(JSON.stringify(operations).includes(message), false);
});
test('official SDK wire uses only question metadata, one attempt, bounded structured output and abort', async () => {
  let options, payload, calls = 0;
  const transport = loader({ '@google/genai': { GoogleGenAI: class {
    constructor(input) { options = input; }
    models = { generateContent: async input => { calls++; payload = input; return { text: json() }; } };
  } } })('@/server/infrastructure/gemini-question-matcher');
  await transport.generateQuestionMatch(message, [{ ...row, answer: 'SECRET', source: 'SECRET', sessionId: 'SECRET' }], config);
  assert.equal(calls, 1); assert.equal(options.httpOptions.retryOptions.attempts, 1);
  assert.equal(options.apiVersion, 'v1beta');
  assert.equal(payload.config.maxOutputTokens, 256); assert.equal(payload.config.responseMimeType, 'application/json');
  const body = JSON.parse(payload.contents);
  assert.deepEqual(Object.keys(body).sort(), ['candidates', 'question']);
  assert.deepEqual(Object.keys(body.candidates[0]).sort(), ['aliases', 'canonicalQuestion', 'questionId']);
  assert.equal(payload.contents.includes('SECRET'), false); assert.ok(payload.config.abortSignal instanceof AbortSignal);
});
test('transport deadline aborts hanging SDK call without retries', async () => {
  let signal, calls = 0;
  const transport = loader({ '@google/genai': { GoogleGenAI: class { models = { generateContent: input => { calls++; signal = input.config.abortSignal; return new Promise(() => {}); } }; } } })('@/server/infrastructure/gemini-question-matcher');
  await assert.rejects(transport.generateQuestionMatch(message, [row], { ...config, timeoutMs: 10 }), /gemini_timeout/);
  assert.equal(signal.aborted, true); assert.equal(calls, 1);
});
test('AUTO_ANSWER=true cannot change assisted response into answer', async () => {
  const previous = process.env.CHAT_AI_AUTO_ANSWER;
  process.env.CHAT_AI_AUTO_ANSWER = 'true';
  try { assert.equal((await fixture().chat.sendChatMessage({ sessionId: sid, message })).status, 'suggest'); }
  finally { if (previous === undefined) delete process.env.CHAT_AI_AUTO_ANSWER; else process.env.CHAT_AI_AUTO_ANSWER = previous; }
});
test('missing API key disables matching; invalid quota values fail closed', () => {
  const names = ['GEMINI_API_KEY', 'CHAT_AI_MATCHING_ENABLED', 'CHAT_AI_CALLS_PER_MINUTE', 'CHAT_AI_CALLS_PER_DAY'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  try {
    delete process.env.GEMINI_API_KEY; process.env.CHAT_AI_MATCHING_ENABLED = 'true';
    process.env.CHAT_AI_CALLS_PER_MINUTE = 'invalid'; process.env.CHAT_AI_CALLS_PER_DAY = '-10';
    const result = load('@/server/services/chat-ai-config').chatAiConfig();
    assert.equal(result.enabled, false); assert.equal(result.perMinute, 0); assert.equal(result.perDay, 0);
  } finally {
    for (const name of names) { if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name]; }
  }
});
