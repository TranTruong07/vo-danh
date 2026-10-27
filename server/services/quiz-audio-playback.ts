import "server-only";
import { readQuizAudio, readQuizAudioBatch } from "@/server/repositories/speech";
import { quizAudioTexts, type AudioSegment } from "@/server/domain/quiz-audio";
import { ttsForFreeAudioHash, ttsForFreeAudioKey } from "@/server/domain/quiz-audio-hash";
import type { CharacterQuestionInput, CharacterQuestionRecord } from "@/server/domain/character-question";
import type { QuizAudioManifest } from "@/server/models/quiz-audio";
import type { QuestionAudio } from "@/server/domain/speech";
import type { QuizAttemptModel } from "@/server/models/character";

const emptyAudio = (): QuestionAudio => ({ prompt: [], correct: [], incorrect: [] });

/** Read-only playback: never imports a provider, admin auth, or generation config. */
export function playableQuestionAudio(id: string, question: CharacterQuestionInput, manifest: QuizAudioManifest | null): QuestionAudio {
  if (!manifest || manifest.questionId !== id || !/^[a-f0-9]{24}$/.test(id) || !/^[a-f0-9]{24}$/.test(question.characterId)) return emptyAudio();
  const texts = quizAudioTexts(question);
  const urls = (segments: AudioSegment[]) => segments.flatMap(segment => {
    const asset = manifest.segments[segment];
    if (!asset || asset.provider !== "ttsforfree" || asset.status !== "ready" || asset.voiceId !== manifest.voiceId || asset.pitch !== 0 || !texts[segment].trim()) return [];
    const hash = ttsForFreeAudioHash(texts[segment], asset.voiceId, asset.pitch, question.characterId, asset.cacheVersion);
    const key = ttsForFreeAudioKey(question.characterId, id, segment, hash);
    if (asset.textHash !== hash || asset.r2Key !== key) return [];
    // Same-origin immutable URL gives offline range playback without R2 CORS setup.
    return [`/audio/quiz/${question.characterId}/${id}/${segment}/${hash}`];
  });
  return { prompt: urls(["question", "optionA", "optionB", "optionC", "optionD"]), correct: urls(["correctFeedback"]), incorrect: urls(["incorrectFeedback"]) };
}

export async function quizAttemptAudio(attempt: QuizAttemptModel): Promise<QuestionAudio> {
  if (!attempt.sourceQuestionId || !/^[a-f0-9]{24}$/.test(attempt.sourceQuestionId) || !attempt.question) return emptyAudio();
  try {
    const q = attempt.question;
    return playableQuestionAudio(attempt.sourceQuestionId, {
      characterId: attempt.characterId, question: q.question, answers: q.options, correctIndex: q.correctIndex,
      correctFeedback: q.correctFeedback || q.explanation, incorrectFeedback: q.incorrectFeedback || q.explanation,
    }, await readQuizAudio(attempt.sourceQuestionId, "ttsforfree"));
  } catch { return emptyAudio(); } // A media metadata outage must not prevent playing/grading.
}

export async function attachQuestionAudio(questions: CharacterQuestionRecord[]): Promise<CharacterQuestionRecord[]> {
  const ids = questions.map(question => question.id).filter(id => /^[a-f0-9]{24}$/.test(id));
  if (!ids.length) return questions;
  try {
    const manifests = new Map((await readQuizAudioBatch(ids)).map(manifest => [manifest.questionId, manifest]));
    return questions.map(question => ({ ...question, audio: playableQuestionAudio(question.id, question, manifests.get(question.id) || null) }));
  } catch { return questions; }
}
