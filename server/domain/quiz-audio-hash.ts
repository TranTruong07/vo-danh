import { createHash } from "node:crypto";
import { QuizAudioError, isAudioSegment, isFptVoice, type AudioSegment } from "./quiz-audio";

/** Includes synthesis settings and character ownership, without normalizing stored text. */
export function quizAudioHash(text: string, speed: number, characterId: string): string {
  return createHash("sha256").update(JSON.stringify(["fpt-v5-mp3-v1", characterId, speed, text])).digest("hex");
}
export function ttsForFreeAudioHash(text: string, voice: string, pitch: number, characterId: string, cacheVersion?: string): string {
  return createHash("sha256").update(JSON.stringify(["ttsforfree-v1", characterId, voice, pitch, text, ...(cacheVersion ? [cacheVersion] : [])])).digest("hex");
}
export function ttsForFreeAudioKey(characterId: string, questionId: string, segment: AudioSegment, hash: string) {
  if (![characterId, questionId].every(id => /^[a-f0-9]{24}$/.test(id)) || !isAudioSegment(segment) || !/^[a-f0-9]{64}$/.test(hash)) throw new QuizAudioError("Thông tin đường dẫn âm thanh không hợp lệ.");
  return `quiz-audio/ttsforfree/${characterId}/${questionId}/${segment}/${hash}.mp3`;
}
export function quizAudioKey(characterId: string, questionId: string, segment: AudioSegment, hash: string, voice: string) {
  if (![characterId, questionId].every(id => /^[a-f0-9]{24}$/.test(id)) || !isAudioSegment(segment) || !/^[a-f0-9]{64}$/.test(hash) || !isFptVoice(voice)) throw new QuizAudioError("Thông tin đường dẫn âm thanh không hợp lệ.");
  return `quiz-audio/${characterId}/${questionId}/${segment}/${hash}-${voice}.mp3`;
}
