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
  function load(name, parent = process.cwd()) {
    if (name in mocks) return mocks[name];
    if (name === 'server-only') return {};
    if (!name.startsWith('@/') && !name.startsWith('.')) return nativeRequire(name);
    const file = (name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(parent, name)) + '.ts';
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
    vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(n => load(n, path.dirname(file)), module, module.exports);
    return module.exports;
  }
  return load;
}
const input = { characterId: '0123456789abcdef01234567', question: 'Ngô Quyền chiến thắng trên con sông nào?', answers: ['Bạch Đằng', 'Sông Hồng', 'Sông Mã', 'Sông Hương'], correctIndex: 0, correctFeedback: 'Chính xác, đó là sông Bạch Đằng.', incorrectFeedback: 'Hãy ghi nhớ chiến thắng Bạch Đằng.' };
test('question validation enforces four unique choices, one correct answer and both feedbacks', () => {
  const { validateCharacterQuestion } = loader()('@/server/domain/character-question');
  assert.deepEqual(validateCharacterQuestion(input), input);
  for (const change of [{ characterId: 'bad' }, { question: 'ngắn' }, { answers: ['A'] }, { answers: ['A', ' a ', 'C', 'D'] }, { answers: ['é', 'e\u0301', 'C', 'D'] }, { correctIndex: -1 }, { correctIndex: 4 }, { correctIndex: 1.5 }, { correctFeedback: ' ' }, { incorrectFeedback: '' }]) assert.throws(() => validateCharacterQuestion({ ...input, ...change }));
});
test('question writes require admin and a real character; forged form values never write', async () => {
  let authorized = false; let exists = true; let writes = 0;
  const service = loader({
    './admin-auth': { requireAdmin: async () => { if (!authorized) throw new Error('Unauthorized'); } },
    '@/server/repositories/characters': { findCharacter: async () => exists ? {} : null },
    '@/server/repositories/character-questions': { existingQuestionTexts: async () => [], saveCharacterQuestion: async () => { writes++; return {}; }, questionRecord: row => row },
  })('@/server/services/character-questions');
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) if (key !== 'answers') form.set(key, String(value));
  input.answers.forEach((value, index) => form.set('answer' + index, value));
  await assert.rejects(service.saveQuestionForm(null, form), /Unauthorized/);
  authorized = true; exists = false;
  await assert.rejects(service.saveQuestionForm(null, form), /không còn tồn tại/);
  exists = true; form.set('correctIndex', '');
  await assert.rejects(service.saveQuestionForm(null, form), /đáp án đúng/);
  assert.equal(writes, 0);
  form.set('correctIndex', '0');
  await service.saveQuestionForm(null, form);
  assert.equal(writes, 1);
});

test('characters with saved questions cannot be deleted until their questions are moved or removed', async () => {
  let hasQuestions = true;
  let deleted = false;
  const service = loader({
    './admin-auth': { requireAdmin: async () => {} },
    '@/server/repositories/characters': { deleteCharacter: async () => { deleted = true; } },
    '@/server/repositories/character-questions': { hasCharacterQuestions: async () => hasQuestions },
  })('@/server/services/characters');
  await assert.rejects(service.removeCharacter(input.characterId), /còn câu hỏi/);
  assert.equal(deleted, false);
  hasQuestions = false;
  await service.removeCharacter(input.characterId);
  assert.equal(deleted, true);
});
