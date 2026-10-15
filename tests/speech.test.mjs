import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loader } from './support/load-typescript.mjs';

const id = '0123456789abcdef01234567', questionId = '0123456789abcdef01234568';
const character = { _id: { toHexString: () => id }, name: 'Nhân vật', openingLine: 'Xin chào các bạn!', voiceName: 'vi-VN-Standard-B', image: '/images/a.webp', backgroundImage: '/images/a.webp' };
const question = { id: questionId, characterId: id, question: 'Đây là câu hỏi thử nghiệm nào?', answers: ['Một', 'Hai', 'Ba', 'Bốn'], correctIndex: 0, correctFeedback: 'Bạn đã trả lời đúng.', incorrectFeedback: 'Bạn đã trả lời sai.' };
function fixture() {
  const state = { admin: true, configured: true, ready: new Set(), calls: [], stored: [], row: { ...character }, question: { ...question } };
  const load = loader({
    './admin-auth': { requireAdmin: async () => { if (!state.admin) throw new Error('Unauthorized'); } },
    '@/server/infrastructure/google-tts': { isGoogleTtsConfigured: () => state.configured, validateGoogleVoice: async () => {}, vietnameseVoices: async () => [], synthesizeSpeech: async (text, voice) => { state.calls.push({ text, voice }); return Buffer.from('audio'); } },
    '@/server/infrastructure/r2': { isR2Configured: () => true },
    '@/server/repositories/characters': { findCharacter: async () => state.row, publicCharacter: row => ({ ...row, id }) },
    '@/server/repositories/character-questions': { findCharacterQuestion: async () => state.question, questionsForSpeech: async () => [state.question] },
    '@/server/repositories/speech': {
      readySpeechIds: async ids => new Set(ids.filter(id => state.ready.has(id))),
      claimSpeech: async () => 'owner', releaseSpeech: async () => {},
      storeSpeech: async id => { state.ready.add(id); state.stored.push(id); },
    },
  });
  return { state, api: load('@/server/services/speech') };
}
test('four distinct Vietnamese voices and UTF-8 byte splitting preserve the complete text', () => {
  const { speechChunks, VIETNAMESE_VOICES, questionSpeech } = loader()('@/server/domain/speech');
  assert.equal(VIETNAMESE_VOICES.filter(voice => voice.name.startsWith('vi-VN-Standard-')).length, 4);
  const text = 'Lịch sử Việt Nam. '.repeat(1200).trim();
  const chunks = speechChunks(text);
  assert.ok(chunks.length > 1); assert.ok(chunks.every(chunk => Buffer.byteLength(chunk) <= 4500));
  assert.equal(chunks.join(' '), text);
  assert.ok(speechChunks('ế'.repeat(6000)).every(chunk => Buffer.byteLength(chunk) <= 4500));
  const spoken = questionSpeech(question.question, question.answers);
  for (const letter of 'ABCD') assert.ok(spoken.includes('Đáp án ' + letter));
});
test('admin preparation caches clips, voice changes change cache keys, and stale tasks are rejected', async () => {
  const { state, api } = fixture(); const plan = await api.loadSpeechPlan(id);
  for (const task of plan.tasks) await api.prepareSpeechTask(id, task.questionId, task.revision);
  assert.equal(state.calls.length, 4); // Intro, question + options, correct, incorrect.
  for (const task of plan.tasks) await api.prepareSpeechTask(id, task.questionId, task.revision);
  assert.equal(state.calls.length, 4);
  state.row.voiceName = 'vi-VN-Standard-D';
  await assert.rejects(api.prepareSpeechTask(id, null, plan.tasks[0].revision), /thay đổi/);
  const next = await api.loadSpeechPlan(id);
  await api.prepareSpeechTask(id, null, next.tasks[0].revision);
  assert.equal(state.calls.at(-1).voice, 'vi-VN-Standard-D');
  assert.equal(state.ready.size, 5);
});
test('public and offline playback use stored audio without calling Google, including correct/incorrect feedback', async () => {
  const { state, api } = fixture(); const plan = await api.loadSpeechPlan(id);
  for (const task of plan.tasks) await api.prepareSpeechTask(id, task.questionId, task.revision);
  const enriched = await api.attachOfflineSpeech([{ ...state.row, id }], [state.question]);
  assert.equal(enriched[0].audio.prompt.length, 2);
  assert.notDeepEqual(enriched[0].audio.correct, enriched[0].audio.incorrect);
  assert.ok(enriched[0].audio.prompt.every(url => /^\/audio\/[a-f0-9]{64}$/.test(url)));
  const local = loader()('@/features/pwa/local-game');
  assert.deepEqual(local.localPublicQuestion(enriched[0]).narration, enriched[0].audio.prompt);
  assert.deepEqual(local.gradeLocalQuestion(enriched[0], 0).narration, enriched[0].audio.correct);
  assert.deepEqual(local.gradeLocalQuestion(enriched[0], 1).narration, enriched[0].audio.incorrect);
  assert.equal(state.calls.length, 4);
  state.question.question = 'Nội dung câu hỏi vừa được sửa?';
  const changed = await api.attachOfflineSpeech([{ ...state.row, id }], [state.question]);
  assert.deepEqual(changed[0].audio.prompt, []); // Never narrate obsolete question text.
});
test('unauthorized, missing credentials and cross-character tasks never synthesize', async () => {
  const { state, api } = fixture(); state.admin = false;
  await assert.rejects(api.previewVoice('vi-VN-Standard-B'), /Unauthorized/);
  await assert.rejects(api.loadSpeechPlan(id), /Unauthorized/);
  await assert.rejects(api.prepareSpeechTask(id, null, 'bad'), /Unauthorized/);
  state.admin = true; state.configured = false;
  await assert.rejects(api.previewVoice('vi-VN-Standard-B'), /Chưa cấu hình/);
  state.configured = true; state.question.characterId = questionId;
  await assert.rejects(api.prepareSpeechTask(id, questionId, 'bad'), /không còn thuộc/);
  assert.equal(state.calls.length, 0);
});
