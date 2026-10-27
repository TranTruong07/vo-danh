import type { OfflinePack } from "@/server/domain/offline-game";
import type { CharacterQuestionRecord } from "@/server/domain/character-question";
import type { AnswerResult, PublicQuestion } from "@/server/domain/quiz";
import { questionCandidates } from "@/server/domain/question-cycle";

export type SavedPack = OfflinePack & { savedAt: string };
export async function readPack(): Promise<SavedPack | null> {
  if (!navigator.serviceWorker?.controller) return null;
  const response = await fetch("/__offline/pack");
  return response.ok ? response.json() : null;
}

export async function drawLocalQuestion(pack: OfflinePack, characterId: string): Promise<CharacterQuestionRecord> {
  const draw = () => {
    const questions = pack.questions.filter(question => question.characterId === characterId);
    if (!questions.length) throw new Error("Nhân vật này chưa có câu hỏi. Hãy chọn một thẻ khác.");
    const key = `history-offline-cycle:${characterId}`;
    let previous: { seenIds: string[]; lastId?: string } = { seenIds: [] };
    try { const saved = JSON.parse(localStorage.getItem(key) || "null"); if (Array.isArray(saved?.seenIds)) previous = saved; } catch { /* Start a fresh cycle if storage was cleared. */ }
    const cycle = questionCandidates(questions.map(question => question.id), previous.seenIds, previous.lastId);
    const random = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
    const id = cycle.candidates[Math.floor(random * cycle.candidates.length)];
    try { localStorage.setItem(key, JSON.stringify({ seenIds: [...cycle.seenIds, id], lastId: id })); } catch { /* Quiz still works when storage is full. */ }
    return questions.find(question => question.id === id)!;
  };
  return navigator.locks ? navigator.locks.request(`history-question:${characterId}`, draw) : draw();
}

export async function rememberLocalQuestion(question: CharacterQuestionRecord) {
  const remember = () => {
    const key = `history-offline-cycle:${question.characterId}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      const seenIds: string[] = Array.isArray(saved?.seenIds) ? saved.seenIds : [];
      localStorage.setItem(key, JSON.stringify({ seenIds: [...new Set([...seenIds, question.id])], lastId: question.id }));
    } catch { /* Storage restrictions must not interrupt the current round. */ }
  };
  if (navigator.locks) await navigator.locks.request(`history-question:${question.characterId}`, remember);
  else remember();
}

export function localPublicQuestion(question: CharacterQuestionRecord): PublicQuestion {
  return { id: `offline:${crypto.randomUUID()}`, question: question.question, options: question.answers, expiresAt: "", ...(question.audio ? { narration: question.audio.prompt } : {}) };
}
export function gradeLocalQuestion(question: CharacterQuestionRecord, selectedIndex: number): AnswerResult {
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 3) throw new Error("Chọn một đáp án hợp lệ.");
  const correct = selectedIndex === question.correctIndex;
  return { selectedIndex, correctIndex: question.correctIndex, correct, explanation: correct ? question.correctFeedback : question.incorrectFeedback, fact: "", sources: "", ...(question.audio ? { narration: correct ? question.audio.correct : question.audio.incorrect } : {}) };
}
export function matchSavedQuestion(pack: OfflinePack, characterId: string, question: PublicQuestion) {
  return pack.questions.find(item => item.characterId === characterId && item.question === question.question && item.answers.every((answer, index) => answer === question.options[index]));
}

/** Refresh audio without replacing the already-drawn quiz or its grading snapshot. */
export function refreshLocalAudio(snapshot: CharacterQuestionRecord, fresh: CharacterQuestionRecord): CharacterQuestionRecord {
  if (!fresh.audio || snapshot.id !== fresh.id || snapshot.characterId !== fresh.characterId || snapshot.question !== fresh.question || snapshot.answers.some((answer, index) => answer !== fresh.answers[index])) return snapshot;
  return { ...snapshot, audio: {
    prompt: fresh.audio?.prompt || [],
    correct: snapshot.correctFeedback === fresh.correctFeedback ? fresh.audio?.correct || [] : [],
    incorrect: snapshot.incorrectFeedback === fresh.incorrectFeedback ? fresh.audio?.incorrect || [] : [],
  } };
}
