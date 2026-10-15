import { GameError, isCharacterId } from "./character";

export interface CharacterQuestionInput {
  characterId: string;
  question: string;
  answers: string[];
  correctIndex: number;
  correctFeedback: string;
  incorrectFeedback: string;
}
export interface CharacterQuestionRecord extends CharacterQuestionInput { id: string; updatedAt: string; audio?: import("./speech").QuestionAudio }
export interface QuestionCharacterChoice { id: string; name: string; image: string; questionCount: number }
export interface CharacterQuestionListItem extends CharacterQuestionRecord { characterName: string; characterImage: string }

/** Preserve Vietnamese accents and punctuation; ignore case, Unicode form and spacing. */
export function normalizeQuestion(value: string): string {
  return value.normalize("NFC").toLocaleLowerCase("vi").replace(/\s+/gu, " ").trim();
}

export function validateCharacterQuestion(data: CharacterQuestionInput): CharacterQuestionInput {
  if (!isCharacterId(data.characterId)) throw new GameError("Vui lòng chọn nhân vật cho câu hỏi.");
  const question = data.question.trim();
  const answers = data.answers.map(answer => answer.trim());
  const correctFeedback = data.correctFeedback.trim();
  const incorrectFeedback = data.incorrectFeedback.trim();
  if (question.length < 10 || question.length > 500) throw new GameError("Câu hỏi cần từ 10 đến 500 ký tự.");
  if (answers.length !== 4 || answers.some(answer => !answer || answer.length > 250)) throw new GameError("Nhập đủ 4 đáp án, mỗi đáp án từ 1 đến 250 ký tự.");
  if (new Set(answers.map(answer => answer.normalize("NFC").toLocaleLowerCase("vi"))).size !== 4) throw new GameError("Các đáp án không được trùng nhau.");
  if (!Number.isInteger(data.correctIndex) || data.correctIndex < 0 || data.correctIndex > 3) throw new GameError("Vui lòng chọn một đáp án đúng.");
  if (!correctFeedback || correctFeedback.length > 1200 || !incorrectFeedback || incorrectFeedback.length > 1200) throw new GameError("Nhập phản hồi đúng và sai, mỗi phản hồi từ 1 đến 1.200 ký tự.");
  return { characterId: data.characterId, question, answers, correctIndex: data.correctIndex, correctFeedback, incorrectFeedback };
}
