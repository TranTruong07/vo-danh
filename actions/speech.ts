"use server";
import { GameError } from "@/server/domain/character";
import { loadSpeechPlan, loadVoiceOptions, prepareSpeechTask, previewVoice } from "@/server/services/speech";
import type { GameResult } from "@/server/domain/quiz";

async function result<T>(run: () => Promise<T>): Promise<GameResult<T>> {
  try { return { ok: true, data: await run() }; }
  catch (error) { return { ok: false, message: error instanceof GameError ? error.message : "Không xử lý được âm thanh. Kiểm tra phiên admin, kết nối và cấu hình Google TTS / R2." }; }
}
export async function voiceOptionsAction() { return result(loadVoiceOptions); }
export async function previewVoiceAction(voice: string) { return result(() => previewVoice(voice)); }
export async function speechPlanAction(characterId: string) { return result(() => loadSpeechPlan(characterId)); }
export async function prepareSpeechAction(characterId: string, questionId: string | null, revision: string) { return result(() => prepareSpeechTask(characterId, questionId, revision)); }
