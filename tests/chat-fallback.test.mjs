import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loader } from './support/load-typescript.mjs';
import { historyMemory } from './support/chat-history-memory.mjs';
import { FALLBACK_CASES } from './fixtures/chat-fallback-cases.mjs';

// Fail immediately if a mock is missing. No live network is permitted in this suite.
globalThis.fetch = async () => { throw Error('NETWORK_FORBIDDEN'); };
const fixture = JSON.parse(fs.readFileSync('tests/fixtures/chat-matching-baseline-5c3b.json', 'utf8'));
const load = loader(), index = fixture.index;
const { matchChatQuestion } = load('@/server/services/chat-matcher');
const { retrieveAiCandidates } = load('@/server/services/chat-ai-candidates');
const { compatibleVietnameseCandidate } = load('@/server/services/chat-vietnamese-ranking');
const { chatResponseText, requestChat } = load('@/features/game/chat-client');
const sid = '12345678-1234-1234-1234-123456789abc';
const personas = ['truong-chinh', 'le-duan', 'pham-van-dong', 'vo-nguyen-giap'];
const message = 'Hà Nội khởi nghĩa thắng lợi vào hôm nào vậy?';
const ids = result => result.type === 'suggest' ? result.suggestions.map(s => s.questionId) : [];

for (const row of FALLBACK_CASES) test(`Vietnamese guard ${row.id}: ${row.category}`, () => {
  const match = matchChatQuestion(row.message, index);
  assert.notEqual(match.type, 'exact', 'paraphrases must never auto-answer');
  assert.ok(ids(match).length <= 3);
  assert.ok(ids(match).every(id => row.expectedIds.includes(id)), 'no incorrect suggestion; misses are measured separately in benchmark');
  assert.ok(ids(match).every(id => index.some(e => e.questionId === id)));
});

test('critical location/date/event guards reject contradictory IDs, including absent date evidence', () => {
  const row = n => index.find(e => e.questionId === `cmtt45-q${n}`);
  for (const [text, wrong] of [
    ['Hà Nội khởi nghĩa khi nào?', '018'], ['Huế khởi nghĩa khi nào?', '019'], ['Sài Gòn khởi nghĩa khi nào?', '017'],
    ['Hà Nội 23 tháng 8 năm 1945 giành chính quyền?', '017'], ['Huế 19/8/1945 khởi nghĩa?', '018'],
    ['Quân lệnh số 1 được ban bố khi nào?', '026'], ['Ai đọc Quân lệnh số 1?', '014'],
    ['Quân lệnh số 1 được đọc năm 1954?', '026'], ['Võ Nguyên Giáp đọc Quân lệnh số 1 ngày 13/8/1945?', '026'],
    ['Hà Nội không khởi nghĩa thắng lợi khi nào?', '017'],
  ]) assert.equal(compatibleVietnameseCandidate(text, row(wrong)), false, `${text} vs ${wrong}`);
});

function service(options = {}) {
  const calls = [], cache = new Map(), quotas = [], answers = [];
  const entries = options.entries || index;
  const config = { enabled: true, model: 'gemini-3.5-flash-lite', timeoutMs: 5000, maxCandidates: 8, perMinute: 5, perDay: 100, matchTtlSeconds: 3600, noMatchTtlSeconds: 120 };
  const scoped = loader({
    '@/server/repositories/chat-history': historyMemory(),
    '@/server/domain/chat': load('@/server/domain/chat'),
    './chat-ai-config': { chatAiConfig: () => ({ ...config, ...options.config }) },
    './chat-session': { chatPlayerHash: async () => 'owner', resolveChatSession: async () => {
      if (options.sessionError) throw options.sessionError;
      return { characterId: options.persona || 'vo-nguyen-giap' };
    } },
    './chat-rate-limit': { limitChatRequests: async () => {} },
    '@/server/repositories/chat-limits': { incrementChatLimit: async key => { quotas.push(key); return options.quotaExhausted ? 999 : 1; } },
    '@/server/repositories/chat-ai-cache': { readAiCache: async key => cache.get(key) || null,
      writeAiCache: async (key, value) => { cache.set(key, value); } },
    '@/server/repositories/chat-knowledge': {
      readPublishedChatIndex: async () => calls.length && options.fresh ? options.fresh : entries,
      readPublishedChatAnswer: async (id, persona, revision) => {
        answers.push({ id, persona, revision });
        const found = (options.fresh || entries).find(e => e.questionId === id && (!revision || e.revisionId === revision));
        return found ? { ...found, answer: `Stored approved ${persona}`, source: { document: 'fixture', sectionId: 'IV' } } : null;
      },
    },
    '@/server/infrastructure/gemini-question-matcher': { generateQuestionMatch: async (...args) => {
      calls.push(args); if (options.error) throw options.error;
      return options.output ?? JSON.stringify({ decision: 'match', questionId: 'cmtt45-q017', confidence: .99, reason: 'metadata match' });
    } },
  });
  return { chat: scoped('@/server/services/chat'), ai: scoped('@/server/services/chat-ai-matching'),
    http: scoped('@/server/infrastructure/chat-http'), calls, cache, quotas, answers };
}
for (const [name, options] of [
  ['HTTP 504', { error: { status: 504, message: 'private provider detail' } }],
  ['timeout', { error: Error('gemini_timeout') }], ['HTTP 429', { error: { status: 429 } }],
  ['HTTP 503', { error: { status: 503 } }], ['invalid response', { output: '{bad' }],
  ['quota exhausted', { quotaExhausted: true }],
]) test(`${name}: safe local suggestions, no retry, click uses each stored persona`, async () => {
  for (const persona of personas) {
    const f = service({ ...options, persona });
    const result = await f.chat.sendChatMessage({ sessionId: sid, message });
    assert.equal(result.status, 'suggest'); assert.equal(result.reason, 'provider_unavailable');
    assert.deepEqual(result.suggestions.map(e => e.questionId), ['cmtt45-q017']);
    assert.equal('answer' in result, false); assert.equal(f.calls.length, options.quotaExhausted ? 0 : 1);
    assert.equal(f.cache.size, 0); assert.doesNotMatch(result.message, /private|504|API/);
    const answer = await f.chat.selectChatAnswer({ sessionId: sid, questionId: result.suggestions[0].questionId });
    assert.equal(answer.answer, `Stored approved ${persona}`);
  }
});
test('weak fallback after provider failure asks to clarify, never labels it out_of_scope', async () => {
  const f = service({ error: { status: 504 } });
  // Retrieval has candidates, but query does not meet the stricter fallback score.
  const text = 'Hà Nội khởi nghĩa thắng lợi và kể chuyện du lịch được chứ?';
  assert.ok(retrieveAiCandidates(text, index, matchChatQuestion(text, index), 8).length);
  assert.equal(matchChatQuestion(text, index).type, 'none');
  const result = await f.chat.sendChatMessage({ sessionId: sid, message: text });
  assert.equal(result.status, 'suggest'); assert.deepEqual(result.suggestions, []);
  assert.equal(result.reason, 'provider_unavailable'); assert.match(chatResponseText(result), /tạm gián đoạn/);
  assert.equal(f.calls.length, 1);
});
test('cache miss then hit uses one mock call; exact and alias never touch provider or cache', async () => {
  const f = service();
  const first = await f.chat.sendChatMessage({ sessionId: sid, message });
  const again = await f.chat.sendChatMessage({ sessionId: sid, message });
  assert.equal(first.status, again.status);
  assert.deepEqual(first.suggestions.map(({ questionId, question }) => ({ questionId, question })), again.suggestions.map(({ questionId, question }) => ({ questionId, question })));
  assert.equal(f.calls.length, 1); assert.equal(f.cache.size, 1);
  const q = index.find(e => e.questionId === 'cmtt45-q017');
  for (const persona of personas) {
    const exact = service({ persona });
    for (const text of [q.canonicalQuestion, q.aliases[0]]) {
      const answer = await exact.chat.sendChatMessage({ sessionId: sid, message: text });
      assert.equal(answer.answer, `Stored approved ${persona}`);
    }
    assert.equal(exact.calls.length, 0); assert.equal(exact.quotas.length, 0); assert.equal(exact.cache.size, 0);
  }
});
test('unpublished during provider failure does not survive fallback publication re-read', async () => {
  const f = service({ error: { status: 504 }, fresh: [] });
  const result = await f.chat.sendChatMessage({ sessionId: sid, message });
  assert.deepEqual(result.suggestions, []); assert.equal(result.reason, 'provider_unavailable');
});
test('malicious or geographically wrong model selection is never surfaced', async () => {
  for (const id of ['cmtt45-q999', 'cmtt45-q018', 'cmtt45-q019']) {
    const f = service({ output: JSON.stringify({ decision: 'match', questionId: id, confidence: 1, reason: 'injected' }) });
    const result = await f.chat.sendChatMessage({ sessionId: sid, message });
    assert.deepEqual(result.suggestions.map(s => s.questionId), ['cmtt45-q017']);
    assert.equal('answer' in result, false);
  }
});
test('API fallback response is HTTP 200/no-store; session failure and character override remain blocked', async () => {
  const f = service({ error: { status: 504 } });
  const req = body => new Request('https://game.test/api/chat', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://game.test' }, body: JSON.stringify(body) });
  const response = await f.http.handleChatRequest(req({ sessionId: sid, message }), f.chat.sendChatMessage);
  assert.equal(response.status, 200); assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal((await response.json()).reason, 'provider_unavailable');
  assert.equal((await f.http.handleChatRequest(req({ sessionId: sid, message, characterId: 'le-duan' }), f.chat.sendChatMessage)).status, 400);
  const { ChatError } = load('@/server/domain/chat');
  const blocked = service({ sessionError: new ChatError('INVALID_SESSION', 'Expired', 401) });
  assert.equal((await blocked.http.handleChatRequest(req({ sessionId: sid, message }), blocked.chat.sendChatMessage)).status, 401);
  assert.equal(blocked.calls.length, 0);
});
test('UI/client accepts additive clarification metadata and still accepts old suggest responses', async () => {
  const original = globalThis.fetch;
  try {
    for (const result of [{ status: 'suggest', suggestions: [] }, { status: 'suggest', suggestions: [], reason: 'provider_unavailable', message: 'Hãy hỏi rõ hơn.' }]) {
      globalThis.fetch = async () => Response.json(result);
      const parsed = await requestChat(sid, { message }, new AbortController().signal);
      assert.ok(chatResponseText(parsed).length); assert.deepEqual(parsed, result);
    }
  } finally { globalThis.fetch = original; }
});
