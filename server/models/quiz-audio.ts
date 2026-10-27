import type { AudioSegment } from "@/server/domain/quiz-audio";

export interface QuizAudioAsset {
  segmentType: AudioSegment; status: "generating" | "ready" | "failed";
  textHash: string; voiceId: string; speed?: number; pitch?: number;
  provider?: "ttsforfree";
  url?: string;
  // Saved before polling so a timeout never requires another synthesis.
  jobId?: string;
  failedJobId?: string;
  providerUrl?: string;
  r2Key?: string; fileSize?: number; contentType?: "audio/mpeg"; generatedAt?: Date; lastError?: string;
  // Private, server-only retry state. Never returned as a playback URL or logged.
  pending?: { url: string; textHash: string; voiceId: string };
}
/** Namespaced records in the existing speech_assets collection; legacy rows remain untouched. */
export interface QuizAudioManifest {
  _id: string; kind: "quiz-audio"; questionId: string; voiceId: string;
  segments: Partial<Record<AudioSegment, QuizAudioAsset>>;
  owner?: string; leaseUntil?: Date; updatedAt: Date;
}
