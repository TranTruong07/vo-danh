import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const nativeRequire = createRequire(import.meta.url);
function loader(mocks = {}) {
  const cache = new Map();
  const root = process.cwd();
  function load(name, parent = root) {
    if (name in mocks) return mocks[name];
    if (name === 'server-only') return {};
    if (!name.startsWith('@/') && !name.startsWith('.')) return nativeRequire(name);
    const file = (name.startsWith('@/') ? path.resolve(root, name.slice(2)) : path.resolve(parent, name)) + '.ts';
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
    vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(n => load(n, path.dirname(file)), module, module.exports);
    return module.exports;
  }
  return load;
}
const characterId = '0123456789abcdef01234567';
const requestId = '01234567-89ab-4def-8123-0123456789ab';
const generated = { question: 'Nhân vật thử nghiệm sinh sống ở đâu?', options: ['Địa điểm A', 'Địa điểm B', 'Địa điểm C', 'Địa điểm D'], correctIndex: 2, explanation: 'Nhân vật sinh sống tại địa điểm C.' };
const character = { name: 'Nhân vật thử nghiệm', openingLine: 'Cùng khám phá lịch sử!', backgroundImage: 'https://example.com/background.jpg', image: 'https://example.com/image.jpg' };

test('character creation requires only four presentation fields and safe image URLs', () => {
  const { validateCharacter } = loader()('@/server/domain/character');
  assert.equal(validateCharacter(character).name, character.name);
  for (const change of [{ openingLine: '' }, { openingLine: 'a'.repeat(1001) }, { backgroundImage: '' }, { backgroundImage: 'javascript:alert(1)' }, { image: 'javascript:alert(1)' }, { image: 'data:image/svg+xml;base64,PHN2Zz4=' }]) assert.throws(() => validateCharacter({ ...character, ...change }));
});

test('legacy character records retain IDs and get a background without inventing a quotation', () => {
  const { characterRecord, publicCharacter } = loader()('@/server/repositories/characters');
  const legacy = { ...character, _id: { toHexString: () => characterId }, updatedAt: new Date(), openingLine: undefined, backgroundImage: undefined };
  const record = characterRecord(legacy);
  assert.equal(record.id, characterId);
  assert.equal(record.openingLine, '');
  assert.equal(record.backgroundImage, '/images/history-landscape.webp');
  assert.equal(record.facts, undefined);
  const publicData = publicCharacter(legacy);
  assert.equal(publicData.facts, undefined);
  assert.equal(publicData.sources, undefined);
});
test('QR extracts only known play IDs, never arbitrary navigation', () => {
  const { characterIdFromQr } = loader()('@/server/domain/character');
  assert.equal(characterIdFromQr(`https://game.example/play/${characterId}`), characterId);
  assert.equal(characterIdFromQr(characterId), characterId);
  for (const value of ['javascript:alert(1)', 'https://elsewhere.example/login', 'https://game.example/play/not-an-id', `https://user:pass@game.example/play/${characterId}`, 'https://game.example/chat?authorId=auth-001']) assert.equal(characterIdFromQr(value), null);
});
function fixture() {
  const attempts = new Map(); const jar = new Map();
  let available = true; let calls = 0; let emptyBank = false; let limited = false;
  const repository = {
    getQuiz: async (id, owner) => { const row = attempts.get(id); return row?.ownerHash === owner && row.expiresAt > new Date() ? row : null; },
    limitQuizGeneration: async () => { if (limited) throw new Error('limited'); },
    reserveQuiz: async row => { if (attempts.has(row._id)) return false; attempts.set(row._id, row); return true; },
    finishQuiz: async (id, question, fact, sources) => Object.assign(attempts.get(id), { state: 'ready', question, fact, sources }),
    failQuiz: async id => { attempts.get(id).state = 'failed'; },
    chooseAnswer: async (id, owner, selectedIndex) => {
      const row = await repository.getQuiz(id, owner);
      if (row && row.selectedIndex === undefined) row.selectedIndex = selectedIndex;
      return row;
    },
  };
  const load = loader({
    './speech': { cachedNarration: async () => [] },
    'next/headers': { cookies: async () => ({ get: key => jar.has(key) ? { value: jar.get(key) } : undefined, set: (key, value) => jar.set(key, value) }) },
    '@/server/repositories/characters': { findCharacter: async () => available ? character : null },
    '@/server/repositories/question-cycles': { drawCharacterQuestion: async () => { calls++; return emptyBank ? null : { _id: { toHexString: () => 'a'.repeat(24) }, question: generated.question, answers: generated.options, correctIndex: generated.correctIndex, correctFeedback: 'Phản hồi đúng đã lưu', incorrectFeedback: 'Phản hồi sai đã lưu' }; } },
    '@/server/repositories/quizzes': repository,
  });
  return { ...load('@/server/services/quizzes'), attempts, jar, calls: () => calls, hide: () => { available = false; }, empty: () => { emptyBank = true; }, limit: () => { limited = true; } };
}
test('anonymous generation hides answers and deduplicates a request', async () => {
  const f = fixture();
  const q = await f.startQuiz(characterId, requestId);
  assert.equal(q.options.length, 4);
  for (const key of ['correctIndex', 'explanation', 'fact', 'ownerHash']) assert.equal(q[key], undefined);
  assert.deepEqual(await f.startQuiz(characterId, requestId), q);
  assert.equal(f.calls(), 1);
});
test('grading uses the stored answer and retains the first selection on replay', async () => {
  const f = fixture(); await f.startQuiz(characterId, requestId);
  const first = await f.answerQuiz(requestId, 0);
  assert.equal(first.correct, false); assert.equal(first.correctIndex, 2);
  const replay = await f.answerQuiz(requestId, 2);
  assert.equal(replay.correct, false); assert.equal(replay.selectedIndex, 0);
  await assert.rejects(f.answerQuiz(requestId, 4));
});
test('expired, foreign and deleted-character rounds cannot be answered', async () => {
  const f = fixture(); await f.startQuiz(characterId, requestId);
  const token = f.jar.get('history_player'); f.jar.set('history_player', 'b'.repeat(64));
  await assert.rejects(f.answerQuiz(requestId, 2));
  f.jar.set('history_player', token); f.attempts.get(requestId).expiresAt = new Date(0);
  await assert.rejects(f.answerQuiz(requestId, 2));
  f.attempts.get(requestId).expiresAt = new Date(Date.now() + 10000); f.hide();
  await assert.rejects(f.answerQuiz(requestId, 2));
  await assert.rejects(f.startQuiz(characterId, requestId));
});
test('an empty character bank never generates substitute questions and limits stop new draws', async () => {
  const f = fixture(); f.empty(); await assert.rejects(f.startQuiz(characterId, requestId), /chưa có câu hỏi/);
  assert.equal(f.attempts.get(requestId).state, 'failed');
  await assert.rejects(f.answerQuiz(requestId, 1));
  const limited = fixture(); limited.limit(); await assert.rejects(limited.startQuiz(characterId, requestId));
  assert.equal(limited.calls(), 0); assert.equal(limited.attempts.size, 0);
});
test('character mutations check admin before reading or writing data', async () => {
  const guarded = loader({ 'next/headers': { cookies: async () => ({ get: () => undefined }) }, '@/lib/db/client': { getDatabase: () => { throw new Error('Database must not be reached'); } } })('@/server/services/characters');
  await assert.rejects(guarded.saveCharacterForm(null, new FormData()), /admin/);
  await assert.rejects(guarded.removeCharacter(characterId), /admin/);
});
