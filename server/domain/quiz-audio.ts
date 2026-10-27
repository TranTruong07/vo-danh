import type { CharacterQuestionInput } from "./character-question";

export const AUDIO_SEGMENTS = ["question", "optionA", "optionB", "optionC", "optionD", "correctFeedback", "incorrectFeedback"] as const;
export type AudioSegment = typeof AUDIO_SEGMENTS[number];
export const FPT_VOICES = [
  { id: "leminh", label: "Lê Minh · Nam miền Bắc" },
  { id: "banmai", label: "Ban Mai · Nữ miền Bắc" },
  { id: "thuminh", label: "Thu Minh · Nữ miền Bắc" },
  { id: "lannhi", label: "Lan Nhi · Nữ miền Nam" },
  { id: "linhsan", label: "Linh San · Nữ miền Nam" },
  { id: "myan", label: "Mỹ An · Nữ miền Trung" },
  { id: "giahuy", label: "Gia Huy · Nam miền Trung" },
] as const;
export const SEGMENT_LABELS: Record<AudioSegment, string> = {
  question: "Câu hỏi", optionA: "Đáp án A", optionB: "Đáp án B", optionC: "Đáp án C", optionD: "Đáp án D",
  correctFeedback: "Phản hồi đúng", incorrectFeedback: "Phản hồi sai",
};
export type AudioStatus = "missing" | "generating" | "ready" | "failed" | "stale" | "unavailable";
export type AudioOverallStatus = "no_audio" | "partial" | "ready" | "outdated" | "failed";
export interface QuizAudioSegmentView {
  segmentType: AudioSegment; status: AudioStatus; characters: number; url?: string;
  lastError?: string; generatedAt?: string; fileSize?: number;
}
export interface QuizAudioView {
  questionId: string; voiceId: string; pitch: number; status: AudioOverallStatus;
  voices: { id: string; label: string }[];
  segments: QuizAudioSegmentView[]; maxFiles: number; canGenerate: boolean;
  reason: string; busy: boolean;
}
export class QuizAudioError extends Error {
  constructor(message: string, public status = 400, public code?: string) { super(message); this.name = "QuizAudioError"; }
}
export const isAudioSegment = (value: unknown): value is AudioSegment => typeof value === "string" && AUDIO_SEGMENTS.includes(value as AudioSegment);
export const isFptVoice = (value: unknown): value is string => typeof value === "string" && FPT_VOICES.some(voice => voice.id === value);

/** Read the stored strings exactly. Empty options must not become a spoken prefix. */
export function quizAudioTexts(question: CharacterQuestionInput): Record<AudioSegment, string> {
  const option = (index: number) => question.answers[index]?.trim() ? `Đáp án ${"ABCD"[index]}. ${question.answers[index]}` : "";
  return { question: question.question, optionA: option(0), optionB: option(1), optionC: option(2), optionD: option(3), correctFeedback: question.correctFeedback, incorrectFeedback: question.incorrectFeedback };
}
export function overallAudioStatus(segments: QuizAudioSegmentView[]): AudioOverallStatus {
  const usable = segments.filter(segment => segment.status !== "unavailable");
  if (usable.some(segment => segment.status === "stale")) return "outdated";
  if (usable.length && usable.every(segment => segment.status === "ready")) return "ready";
  if (usable.some(segment => segment.status === "ready" || segment.status === "generating")) return "partial";
  if (usable.some(segment => segment.status === "failed")) return "failed";
  return "no_audio";
}
