import "server-only";
import type { CharacterQuestionRecord } from "@/server/domain/character-question";
import { readQuizAudioBatch } from "@/server/repositories/speech";
import { playableQuestionAudio } from "./quiz-audio-playback";

/** Read stored metadata once per list page; never generates or downloads audio. */
export async function questionAudioSummaries(questions: CharacterQuestionRecord[]): Promise<Record<string, number | null>> {
  if (!questions.length) return {};
  try {
    const manifests = new Map((await readQuizAudioBatch(questions.map(question => question.id)))
      .map(manifest => [manifest.questionId, manifest]));
    return Object.fromEntries(questions.map(question => {
      const audio = playableQuestionAudio(question.id, question, manifests.get(question.id) || null);
      return [question.id, audio.prompt.length + audio.correct.length + audio.incorrect.length];
    }));
  } catch {
    // Do not report missing files when the metadata lookup itself failed.
    return Object.fromEntries(questions.map(question => [question.id, null]));
  }
}
