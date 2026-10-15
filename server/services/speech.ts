import "server-only";
import { createHash } from "node:crypto";
import { requireAdmin } from "./admin-auth";
import { GameError, isCharacterId, type PublicCharacter } from "@/server/domain/character";
import { DEFAULT_VOICE, questionSpeech, speechChunks } from "@/server/domain/speech";
import type { CharacterQuestionInput, CharacterQuestionRecord } from "@/server/domain/character-question";
import { isGoogleTtsConfigured, synthesizeSpeech, validateGoogleVoice, vietnameseVoices } from "@/server/infrastructure/google-tts";
import { isR2Configured } from "@/server/infrastructure/r2";
import { findCharacter, publicCharacter } from "@/server/repositories/characters";
import { findCharacterQuestion, questionsForSpeech } from "@/server/repositories/character-questions";
import { claimSpeech, readySpeechIds, releaseSpeech, storeSpeech } from "@/server/repositories/speech";

export function speechParts(voice: string, text: string) {
  return speechChunks(text).map(text => ({ text, id: createHash("sha256").update(JSON.stringify(["google-mp3-v1", voice, text])).digest("hex") }));
}
const audioUrl = (id: string) => `/audio/${id}`;
export async function cachedNarration(voice: string, texts: string[]) {
  const parts = texts.flatMap(text => speechParts(voice, text));
  const ready = await readySpeechIds(parts.map(part => part.id));
  return parts.length && parts.every(part => ready.has(part.id)) ? parts.map(part => audioUrl(part.id)) : [];
}
function questionTexts(character: PublicCharacter, question: CharacterQuestionInput) {
  return { prompt: [character.openingLine, questionSpeech(question.question, question.answers)], correct: [question.correctFeedback], incorrect: [question.incorrectFeedback] };
}
export async function attachOfflineSpeech(characters: PublicCharacter[], questions: CharacterQuestionRecord[]) {
  const byId = new Map(characters.map(character => [character.id, character]));
  const groups = questions.map(question => {
    const character = byId.get(question.characterId)!;
    const texts = questionTexts(character, question);
    const parts = (values: string[]) => values.flatMap(text => speechParts(character.voiceName || DEFAULT_VOICE, text));
    return { question, prompt: parts(texts.prompt), correct: parts(texts.correct), incorrect: parts(texts.incorrect) };
  });
  const ready = await readySpeechIds([...new Set(groups.flatMap(group => [...group.prompt, ...group.correct, ...group.incorrect].map(part => part.id)))]);
  const urls = (parts: ReturnType<typeof speechParts>) => parts.every(part => ready.has(part.id)) ? parts.map(part => audioUrl(part.id)) : [];
  return groups.map(group => ({ ...group.question, audio: { prompt: urls(group.prompt), correct: urls(group.correct), incorrect: urls(group.incorrect) } }));
}
export async function loadVoiceOptions() {
  await requireAdmin();
  return { configured: isGoogleTtsConfigured(), voices: await vietnameseVoices() };
}
async function ensureAudio(voice: string, text: string) {
  const parts = speechParts(voice, text);
  for (const part of parts) {
    if ((await readySpeechIds([part.id])).has(part.id)) continue;
    const owner = await claimSpeech(part.id);
    if (!owner) {
      if ((await readySpeechIds([part.id])).has(part.id)) continue;
      throw new GameError("Đoạn âm thanh này đang được tạo ở một phiên khác. Vui lòng thử lại sau ít giây.");
    }
    try { await storeSpeech(part.id, owner, await synthesizeSpeech(part.text, voice)); }
    catch (error) { await releaseSpeech(part.id, owner).catch(() => {}); throw error; }
  }
  return parts.map(part => audioUrl(part.id));
}
function requireConfiguration() {
  if (!isGoogleTtsConfigured()) throw new GameError("Chưa cấu hình Google Cloud TTS. Bổ sung các biến trong .env.tts.example vào .env.local rồi khởi động lại máy chủ.");
  if (!isR2Configured()) throw new GameError("Cần cấu hình R2 để lưu âm thanh của nhân vật.");
}
export async function previewVoice(voice: string) {
  await requireAdmin(); requireConfiguration(); await validateGoogleVoice(voice);
  return ensureAudio(voice, "Xin chào! Cùng khám phá lịch sử Việt Nam. Bạn đã sẵn sàng trả lời câu hỏi chưa?");
}
async function speechTask(characterId: string, questionId: string | null) {
  if (!isCharacterId(characterId) || (questionId !== null && !isCharacterId(questionId))) throw new GameError("Mã nhân vật hoặc câu hỏi không hợp lệ.");
  const row = await findCharacter(characterId);
  if (!row) throw new GameError("Nhân vật không còn tồn tại.");
  const character = publicCharacter(row);
  let texts = [character.openingLine];
  if (questionId) {
    const question = await findCharacterQuestion(questionId);
    if (!question || question.characterId !== characterId) throw new GameError("Câu hỏi không còn thuộc nhân vật này. Hãy tải lại danh sách âm thanh.");
    texts = [questionSpeech(question.question, question.answers), question.correctFeedback, question.incorrectFeedback];
  }
  const voice = character.voiceName || DEFAULT_VOICE;
  const revision = createHash("sha256").update(JSON.stringify([voice, texts])).digest("hex");
  return { voice, texts, revision };
}
export async function loadSpeechPlan(characterId: string) {
  await requireAdmin();
  const intro = await speechTask(characterId, null);
  const questions = await questionsForSpeech(characterId);
  return { configured: isGoogleTtsConfigured() && isR2Configured(), voiceName: intro.voice, tasks: [
    { questionId: null as string | null, label: "Câu nói mở đầu", revision: intro.revision },
    ...questions.map(question => ({ questionId: question.id, label: question.question, revision: createHash("sha256").update(JSON.stringify([intro.voice, [questionSpeech(question.question, question.answers), question.correctFeedback, question.incorrectFeedback]])).digest("hex") })),
  ] };
}
export async function prepareSpeechTask(characterId: string, questionId: string | null, revision: string) {
  await requireAdmin(); requireConfiguration();
  const task = await speechTask(characterId, questionId);
  if (revision !== task.revision) throw new GameError("Nội dung hoặc giọng đọc vừa thay đổi. Hãy bấm tạo/cập nhật âm thanh lại.");
  await validateGoogleVoice(task.voice);
  for (const text of task.texts) await ensureAudio(task.voice, text);
  return true;
}
