import "server-only";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "./admin-auth";
import { quizAudioConfig } from "./quiz-audio-config";
import { findCharacterQuestion } from "@/server/repositories/character-questions";
import * as media from "@/server/repositories/speech";
import { createTtsForFreeJob, waitForTtsForFreeJob, downloadTtsForFreeAudio } from "@/server/infrastructure/ttsforfree";
import { isR2Configured, R2_PUBLIC_BASE_URL } from "@/server/infrastructure/r2";
import { ttsForFreeAudioHash, ttsForFreeAudioKey } from "@/server/domain/quiz-audio-hash";
import { AUDIO_SEGMENTS, QuizAudioError, isAudioSegment, overallAudioStatus, quizAudioTexts, type AudioSegment, type QuizAudioView, type QuizAudioSegmentView } from "@/server/domain/quiz-audio";
import type { QuizAudioAsset, QuizAudioManifest } from "@/server/models/quiz-audio";
import type { CharacterQuestionModel } from "@/server/models/character-question";

const PROVIDER = "ttsforfree";
async function questionForAudio(id: string) {
  if (!/^[a-f0-9]{24}$/.test(id)) throw new QuizAudioError("Mã câu hỏi không hợp lệ.");
  const question = await findCharacterQuestion(id);
  if (!question) throw new QuizAudioError("Câu hỏi không còn tồn tại.", 404);
  return question;
}
function readiness(config: ReturnType<typeof quizAudioConfig>) {
  if (!config.valid) return "Chưa cấu hình danh sách giọng TTSForFree hợp lệ trên server.";
  if (!config.configured) return "Chưa cấu hình API key TTSForFree.";
  if (!config.enabled) return "Tạo âm thanh TTSForFree đang tắt.";
  if (!isR2Configured()) return "Chưa cấu hình R2 để lưu MP3 lâu dài.";
  return "";
}
function audioView(id: string, question: CharacterQuestionModel, manifest: QuizAudioManifest | null, voice: string): QuizAudioView {
  const config = quizAudioConfig(), texts = quizAudioTexts(question);
  const busy = !!manifest?.owner && !!manifest.leaseUntil && manifest.leaseUntil.getTime() > Date.now();
  const segments: QuizAudioSegmentView[] = AUDIO_SEGMENTS.map(segmentType => {
    const text = texts[segmentType], asset = manifest?.segments[segmentType];
    const view: QuizAudioSegmentView = { segmentType, characters: [...text].length, status: "missing" };
    if (!text.trim()) view.status = "unavailable";
    else if (asset) {
      const matches = asset.provider === PROVIDER && asset.textHash === ttsForFreeAudioHash(text, voice, config.pitch, question.characterId, asset.cacheVersion);
      view.status = !matches ? "stale" : asset.status === "generating" && !busy ? "failed" : asset.status;
      if (view.status === "ready" && asset.r2Key && R2_PUBLIC_BASE_URL) {
        view.url = `${R2_PUBLIC_BASE_URL}/${asset.r2Key.split("/").map(encodeURIComponent).join("/")}`;
        view.generatedAt = asset.generatedAt?.toISOString();
        view.fileSize = asset.fileSize;
      } else if (view.status === "ready") view.status = "missing";
      if (view.status === "failed") view.lastError = asset.lastError || "Lượt xử lý trước bị gián đoạn. Bấm Tiếp tục để kiểm tra job đã lưu.";
    }
    return view;
  });
  const reason = readiness(config);
  return { questionId: id, voiceId: voice, voices: config.voices, pitch: config.pitch, segments, status: overallAudioStatus(segments), maxFiles: config.maxFiles, canGenerate: !reason && config.voices.some(item => item.id === voice), reason, busy };
}
export async function loadQuizAudio(id: string, selectedVoice?: string): Promise<QuizAudioView> {
  await requireAdmin();
  const config = quizAudioConfig();
  if (selectedVoice !== undefined && !config.voices.some(voice => voice.id === selectedVoice)) throw new QuizAudioError("Giọng đọc chưa được cấu hình trên server.");
  const question = await questionForAudio(id), manifest = await media.readQuizAudio(id, PROVIDER);
  const voice = selectedVoice || (config.voices.some(item => item.id === manifest?.voiceId) ? manifest!.voiceId : config.voice);
  return audioView(id, question, manifest, voice);
}
export function validateAudioRequest(input: unknown, maxFiles: number): { segments: AudioSegment[]; voiceId: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new QuizAudioError("Yêu cầu tạo MP3 không hợp lệ.");
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some(key => !["segments", "voiceId", "confirmed"].includes(key)) || value.confirmed !== true || typeof value.voiceId !== "string" || !quizAudioConfig().voices.some(voice => voice.id === value.voiceId) || !Array.isArray(value.segments) || !value.segments.length || value.segments.length > Math.min(maxFiles, 7) || !value.segments.every(isAudioSegment) || new Set(value.segments).size !== value.segments.length) throw new QuizAudioError("Chọn giọng, các đoạn hợp lệ và xác nhận trước khi tạo (tối đa 7 đoạn, không trùng lặp).");
  return { segments: value.segments, voiceId: value.voiceId };
}
export async function generateQuizAudio(id: string, input: unknown): Promise<QuizAudioView> {
  await requireAdmin();
  const config = quizAudioConfig(), reason = readiness(config);
  if (reason) throw new QuizAudioError(reason, 409);
  const { segments, voiceId } = validateAudioRequest(input, config.maxFiles);
  const question = await questionForAudio(id), texts = quizAudioTexts(question);
  const owner = randomUUID(), manifest = await media.claimQuizAudio(id, owner, voiceId, PROVIDER);
  if (!manifest) throw new QuizAudioError("Câu hỏi đang được tạo âm thanh ở một lượt khác. Chờ rồi cập nhật trạng thái.", 409);
  const started = Date.now();
  try {
    if (Object.values(manifest.segments).some(asset => asset?.deletionPending)) throw new QuizAudioError("Lần xóa trước chưa hoàn tất. Hãy xóa audio lại trước khi tạo MP3 mới.", 409);
    for (const segment of segments) {
      if (Date.now() - started > 150000) break; // Leave room for poll + download + R2 within 300s.
      const text = texts[segment];
      if (!text.trim()) continue;
      const old = manifest.segments[segment], cacheVersion = old ? old.cacheVersion : randomUUID();
      const hash = ttsForFreeAudioHash(text, voiceId, config.pitch, question.characterId, cacheVersion);
      if (old?.provider === PROVIDER && old.status === "ready" && old.r2Key && old.textHash === hash) continue;
      const current = await questionForAudio(id);
      if (ttsForFreeAudioHash(quizAudioTexts(current)[segment], voiceId, config.pitch, current.characterId, cacheVersion) !== hash) break;
      const asset: QuizAudioAsset = {
        segmentType: segment, provider: PROVIDER, textHash: hash, voiceId, pitch: config.pitch, cacheVersion,
        status: "generating", ...(old?.provider === PROVIDER && old.textHash === hash ? { jobId: old.jobId, providerUrl: old.providerUrl, failedJobId: old.failedJobId } : {}),
      };
      await media.saveQuizAudioSegment(id, owner, segment, asset, PROVIDER);
      try {
        if (!asset.jobId) {
          asset.jobId = await createTtsForFreeJob(text, voiceId, config.pitch);
          // Persist before polling; interrupted jobs are resumed without another POST.
          await media.saveQuizAudioSegment(id, owner, segment, asset, PROVIDER);
        }
        if (!asset.providerUrl) {
          asset.providerUrl = await waitForTtsForFreeJob(asset.jobId);
          await media.saveQuizAudioSegment(id, owner, segment, asset, PROVIDER);
        }
        const bytes = await downloadTtsForFreeAudio(asset.providerUrl);
        const key = ttsForFreeAudioKey(question.characterId, id, segment, hash);
        await media.uploadQuizAudio(key, bytes);
        const ready: QuizAudioAsset = {
          segmentType: segment, provider: PROVIDER, textHash: hash, voiceId, pitch: config.pitch, cacheVersion, jobId: asset.jobId,
          status: "ready", r2Key: key, url: `${R2_PUBLIC_BASE_URL}/${key}`, fileSize: bytes.length, contentType: "audio/mpeg", generatedAt: new Date(),
        };
        await media.saveQuizAudioSegment(id, owner, segment, ready, PROVIDER);
        manifest.segments[segment] = ready;
      } catch (error) {
        if (error instanceof QuizAudioError && error.code === "TTS_JOB_FAILED") {
          asset.failedJobId = asset.jobId;
          delete asset.jobId;
        }
        const failed: QuizAudioAsset = { ...asset, status: "failed", lastError: error instanceof QuizAudioError ? error.message : "Không lưu được âm thanh. Cập nhật trạng thái và kiểm tra kết nối trước khi tiếp tục." };
        await media.saveQuizAudioSegment(id, owner, segment, failed, PROVIDER);
        manifest.segments[segment] = failed;
        break; // Do not spend credits on more segments after a provider/storage failure.
      }
    }
  } finally { await media.releaseQuizAudio(id, owner, PROVIDER); }
  return loadQuizAudio(id, voiceId);
}

export async function deleteQuizAudio(id: string, input: unknown): Promise<QuizAudioView> {
  await requireAdmin();
  if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length !== 1 || (input as { confirmed?: unknown }).confirmed !== true) throw new QuizAudioError("Vui lòng xác nhận xóa toàn bộ audio của câu hỏi.");
  const question = await questionForAudio(id);
  const existing = await media.readQuizAudio(id, PROVIDER);
  if (!existing) return loadQuizAudio(id);
  const owner = randomUUID(), manifest = await media.claimQuizAudio(id, owner, existing.voiceId, PROVIDER);
  if (!manifest) throw new QuizAudioError("Âm thanh đang được xử lý ở lượt khác. Chờ rồi cập nhật trạng thái.", 409);
  try {
    // Validate every stored key before deleting anything; never accept keys from the client.
    for (const segment of AUDIO_SEGMENTS) {
      const asset = manifest.segments[segment];
      if (asset?.r2Key && (asset.provider !== PROVIDER || asset.r2Key !== ttsForFreeAudioKey(question.characterId, id, segment, asset.textHash))) throw new QuizAudioError("Đường dẫn audio không thuộc câu hỏi này. Chưa xóa file.", 409);
    }
    if (Object.values(manifest.segments).some(asset => asset?.r2Key) && !isR2Configured()) throw new QuizAudioError("Chưa cấu hình R2 để xóa file âm thanh.", 409);
    for (const segment of AUDIO_SEGMENTS) {
      const asset = manifest.segments[segment];
      if (!asset) continue;
      // Retain the key until R2 confirms deletion, and prevent playback/re-generation on partial failure.
      await media.saveQuizAudioSegment(id, owner, segment, { ...asset, status: "failed", deletionPending: true, lastError: "Đang xóa hoặc xóa chưa hoàn tất. Hãy xóa audio lại để tiếp tục." }, PROVIDER);
      if (asset.r2Key) await media.deleteQuizAudioFile(asset.r2Key);
      await media.clearQuizAudioSegment(id, owner, segment);
    }
  } catch (error) {
    if (error instanceof QuizAudioError) throw error;
    throw new QuizAudioError("Chưa xóa hết audio. Cập nhật trạng thái rồi xóa lại để tiếp tục; các file đã xóa sẽ không bị xử lý lại.", 503);
  } finally { await media.releaseQuizAudio(id, owner, PROVIDER); }
  return loadQuizAudio(id);
}
