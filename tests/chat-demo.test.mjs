import test from 'node:test';
import assert from 'node:assert/strict';
import { loader } from './support/load-typescript.mjs';

const sid = '12345678-1234-1234-1234-123456789abc', owner = 'a'.repeat(64), character = 'b'.repeat(24);
const load = loader(), { ChatError, validateChatSessionInput } = load('@/server/domain/chat');
test('starter suggestions accept only a valid session ID, with no persona override', () => {
  assert.equal(validateChatSessionInput({ sessionId: sid }), sid);
  for (const input of [null, [], {}, { sessionId: 'offline:abc' }, { sessionId: sid, characterId: character }]) {
    assert.throws(() => validateChatSessionInput(input), e => e.code === 'INVALID_INPUT');
  }
});
test('starter suggestions check owner/session/quota and project only three published question labels', async () => {
  const calls = [], entries = Array.from({ length: 5 }, (_, n) => ({ questionId: `cmtt45-q00${n + 1}`, canonicalQuestion: `Published ${n}`, aliases: ['Hidden alias'], characterAnswers: { hidden: 'must not leak' } }));
  const service = loader({
    './chat-session': { chatPlayerHash: async () => owner, resolveChatSession: async (id, hash) => { calls.push('session'); assert.equal(id, sid); assert.equal(hash, owner); return { characterId: 'le-duan' }; } },
    './chat-rate-limit': { limitChatRequests: async () => { calls.push('limit'); } },
    '@/server/repositories/chat-knowledge': { readPublishedChatIndex: async () => { calls.push('published'); return entries; } },
  })('@/server/services/chat');
  const result = await service.suggestChatQuestions({ sessionId: sid });
  assert.deepEqual(calls, ['limit', 'session', 'published']); assert.equal(result.status, 'suggest'); assert.equal(result.suggestions.length, 3);
  assert.deepEqual(Object.keys(result.suggestions[0]).sort(), ['question', 'questionId']);
});
function bindingFixture(patch = {}) {
  const calls = [];
  const session = { _id: sid, ownerHash: owner, characterId: character, expiresAt: new Date(Date.now() + 60000), ...patch };
  const service = loader({
    './player-session': { playerSession: async create => { assert.equal(create, true); return owner; } },
    './chat-rate-limit': { limitChatRequests: async hash => { assert.equal(hash, owner); calls.push('limit'); } },
    './chat-characters': { resolveMappedCharacter: id => { assert.equal(id, character); calls.push('map'); return 'le-duan'; } },
    '@/server/repositories/chat-session': { chatCharacterExists: async () => true },
    '@/server/repositories/chat-game-sessions': { reserveChatBinding: async (...args) => { calls.push(args); return session; } },
  })('@/server/services/chat-game-session');
  return { ...service, calls };
}
test('cached quiz chat receives a server binding without generating or changing quiz questions', async () => {
  const fixture = bindingFixture();
  const result = await fixture.openCharacterChat(character, sid);
  assert.equal(result.ok, true); assert.equal(result.sessionId, sid);
  assert.deepEqual(fixture.calls, ['limit', 'map', [character, owner, sid]]);
  assert.deepEqual(Object.keys(result).sort(), ['expiresAt', 'ok', 'sessionId']);
});
test('binding rejects invalid request IDs, expired bindings and character/owner changes', async () => {
  for (const patch of [{ expiresAt: new Date(0) }, { characterId: 'c'.repeat(24) }, { ownerHash: 'foreign' }]) {
    const result = await bindingFixture(patch).openCharacterChat(character, sid);
    assert.equal(result.ok, false); assert.equal(result.code, 'INVALID_SESSION');
  }
  const fixture = bindingFixture();
  assert.equal((await fixture.openCharacterChat(character, 'bad')).code, 'INVALID_INPUT');
  assert.equal(fixture.calls.length, 0);
});
test('binding error responses preserve quota retry but hide internal database errors', async () => {
  for (const error of [new ChatError('RATE_LIMITED', 'Wait', 429, 20), new Error('mongodb://secret')]) {
    const service = loader({ '@/server/domain/chat': { ...load('@/server/domain/chat'), ChatError }, './player-session': { playerSession: async () => { throw error; } } })('@/server/services/chat-game-session');
    const result = await service.openCharacterChat(character, sid);
    assert.equal(result.ok, false); assert.doesNotMatch(JSON.stringify(result), /mongodb|secret/);
    assert.equal(result.code, error.code || 'CHAT_UNAVAILABLE');
    if (error.code) assert.equal(result.retryAfter, 20);
  }
});
test('binding repository creates only chat indexes and inserts once for a repeated owner/request', async () => {
  let saved; const updates = [];
  const repo = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: name => {
    assert.equal(name, 'chat_game_sessions');
    return { createIndex: async () => {}, updateOne: async (filter, update) => { updates.push(update); saved ??= update.$setOnInsert; assert.deepEqual(filter, { ownerHash: owner, requestId: sid }); }, findOne: async () => saved };
  } }) } })('@/server/repositories/chat-game-sessions');
  const first = await repo.reserveChatBinding(character, owner, sid), second = await repo.reserveChatBinding(character, owner, sid);
  assert.equal(first._id, second._id); assert.notEqual(first._id, sid);
  assert.ok(updates.every(u => Object.keys(u).join() === '$setOnInsert'));
  assert.equal(first.question, undefined); assert.equal(first.selectedIndex, undefined);
});
test('session resolver reads cached-game binding only after no valid quiz binding is found', async () => {
  const calls = [], record = { _id: sid, ownerHash: owner, characterId: character, state: 'ready', expiresAt: new Date(Date.now() + 60000) };
  const repo = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: name => ({ findOne: async (query, options) => {
    calls.push(name); assert.equal(query.ownerHash, owner); assert.equal(query.state, 'ready'); assert.ok(query.expiresAt.$gt instanceof Date);
    assert.equal(options.projection.question, undefined); return name === 'chat_game_sessions' ? record : null;
  } }) }) } })('@/server/repositories/chat-session');
  assert.equal(await repo.readChatGameSession(sid, owner), record); assert.deepEqual(calls, ['quiz_attempts', 'chat_game_sessions']);
});
test('client sends session/message or questionId, includes cookies and never sends persona', async () => {
  const original = globalThis.fetch, calls = [];
  globalThis.fetch = async (path, options) => { calls.push({ path, ...options }); return Response.json({ status: 'suggest', suggestions: [] }); };
  try {
    const { requestChat } = load('@/features/game/chat-client');
    for (const input of [null, { message: 'Question?' }, { questionId: 'cmtt45-q001' }]) await requestChat(sid, input, new AbortController().signal);
    assert.deepEqual(calls.map(c => c.path), ['/api/chat/suggestions', '/api/chat', '/api/chat/answer']);
    assert.ok(calls.every(c => c.credentials === 'same-origin' && c.cache === 'no-store'));
    assert.deepEqual(calls.map(c => JSON.parse(c.body)), [{ sessionId: sid }, { sessionId: sid, message: 'Question?' }, { sessionId: sid, questionId: 'cmtt45-q001' }]);
  } finally { globalThis.fetch = original; }
});
test('client handles offline, session expiry, rate limit and malformed/server responses without leaking internals', async () => {
  const original = globalThis.fetch, { requestChat, requestChatSession } = load('@/features/game/chat-client');
  try {
    for (const [status, code] of [[401, 'INVALID_SESSION'], [429, 'RATE_LIMITED'], [503, 'CHAT_UNAVAILABLE']]) {
      globalThis.fetch = async () => Response.json({ code: 'CHAT_UNAVAILABLE', message: 'mongodb://secret' }, { status, headers: { 'Retry-After': '5' } });
      await assert.rejects(requestChat(sid, null, new AbortController().signal), e => e.code === code && !e.message.includes('secret') && (status !== 429 || e.retryAfter === 5));
    }
    globalThis.fetch = async () => { throw new Error('network'); };
    await assert.rejects(requestChat(sid, null, new AbortController().signal), e => e.code === 'NETWORK');
    globalThis.fetch = async () => Response.json({ status: 'answered', answer: 'missing source' });
    await assert.rejects(requestChat(sid, null, new AbortController().signal), e => e.code === 'UNAVAILABLE');
    await assert.rejects(requestChatSession(() => new Promise(() => {}), sid, 5), e => e.code === 'NETWORK');
  } finally { globalThis.fetch = original; }
});
