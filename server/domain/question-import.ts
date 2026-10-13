import type { CharacterQuestionInput } from "./character-question";

export const QUESTION_IMPORT_MAX_ROWS = 500;
export const QUESTION_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const QUESTION_IMPORT_HEADERS = ["Câu hỏi", "Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D", "Đáp án đúng", "Phản hồi đúng", "Phản hồi sai"] as const;

export interface QuestionImportRow {
  row: number;
  question: string;
  status: "ready" | "duplicate" | "invalid" | "imported";
  message: string;
  data?: CharacterQuestionInput;
}
export interface QuestionImportReport {
  characterId: string;
  characterName: string;
  rows: QuestionImportRow[];
  committed: boolean;
}
