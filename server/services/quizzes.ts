import "server-only";
import { playerSession } from "./player-session";
import { findCharacter } from "@/server/repositories/characters";
import * as repository from "@/server/repositories/quizzes";
import { GameError, isCharacterId } from "@/server/domain/character";
import type { AnswerResult, PublicQuestion } from "@/server/domain/quiz";
import type { QuizAttemptModel } from "@/server/models/character";
import { drawCharacterQuestion } from "@/server/repositories/question-cycles";
import { quizAttemptAudio } from "./quiz-audio-playback";

const validRequest = (id: unknown): id is string => typeof id === "string" && /^[a-f0-9-]{36}$/.test(id);
export function publicQuestion(attempt: QuizAttemptModel): PublicQuestion {
  if (attempt.state !== "ready" || !attempt.question) throw new GameError(attempt.state === "generating" ? "Câu hỏi đang được tạo. Vui lòng thử lại sau ít giây." : "Chưa tạo được câu hỏi. Vui lòng thử lại.");
  return { id: attempt._id, question: attempt.question.question, options: attempt.question.options, expiresAt: attempt.expiresAt.toISOString() };
}
async function questionWithAudio(attempt: QuizAttemptModel): Promise<PublicQuestion> {
  const question = publicQuestion(attempt);
  return { ...question, narration: (await quizAttemptAudio(attempt)).prompt };
}
export async function startQuiz(characterId: string, requestId: string): Promise<PublicQuestion> {
  if (!isCharacterId(characterId) || !validRequest(requestId)) throw new GameError("Mã nhân vật hoặc lượt chơi không hợp lệ.");
  const character = await findCharacter(characterId);
  if (!character) throw new GameError("Nhân vật không tồn tại. Hãy quét mã khác.");
  const ownerHash = await playerSession(true);
  const existing = await repository.getQuiz(requestId, ownerHash);
  if (existing) {
    if (existing.characterId !== characterId) throw new GameError("Lượt chơi không khớp nhân vật.");
    return questionWithAudio(existing);
  }
  await repository.limitQuizGeneration(ownerHash);
  const now = new Date();
  if (!await repository.reserveQuiz({ _id: requestId, ownerHash, characterId, state: "generating", createdAt: now, expiresAt: new Date(now.getTime() + 20 * 60000) })) throw new GameError("Lượt chơi đã được sử dụng. Hãy tạo câu hỏi mới.");
  try {
    const savedQuestion = await drawCharacterQuestion(characterId, ownerHash);
    if (!savedQuestion) throw new GameError("Nhân vật này chưa có câu hỏi. Hãy quét nhân vật khác hoặc quay lại sau khi quản trị viên thêm câu hỏi.");
    const question = { question: savedQuestion.question, options: savedQuestion.answers, correctIndex: savedQuestion.correctIndex, explanation: savedQuestion.correctFeedback, correctFeedback: savedQuestion.correctFeedback, incorrectFeedback: savedQuestion.incorrectFeedback };
    const saved = await repository.finishQuiz(requestId, question, "", "", savedQuestion._id.toHexString());
    if (!saved) throw new GameError("Không thể lưu câu hỏi. Hãy thử lại.");
    return questionWithAudio(saved);
  } catch (error) { await repository.failQuiz(requestId); throw error; }
}
export async function answerQuiz(id: string, selectedIndex: number): Promise<AnswerResult> {
  if (!validRequest(id) || !Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex > 3) throw new GameError("Đáp án không hợp lệ.");
  const ownerHash = await playerSession(false);
  const original = await repository.getQuiz(id, ownerHash);
  if (!original || original.state !== "ready") throw new GameError("Câu hỏi đã hết hạn hoặc không thuộc phiên chơi này. Hãy quét lại.");
  const character = await findCharacter(original.characterId);
  if (!character) throw new GameError("Nhân vật đã bị xóa. Hãy quét mã khác.");
  const attempt = await repository.chooseAnswer(id, ownerHash, selectedIndex);
  if (!attempt?.question || attempt.selectedIndex === undefined) throw new GameError("Lượt chơi đã hết hạn. Hãy quét lại mã.");
  const correct = attempt.selectedIndex === attempt.question.correctIndex;
  const feedback = correct ? attempt.question.correctFeedback : attempt.question.incorrectFeedback;
  const explanation = feedback || attempt.question.explanation;
  const audio = await quizAttemptAudio(attempt);
  return { selectedIndex: attempt.selectedIndex, correctIndex: attempt.question.correctIndex, correct, explanation, fact: attempt.fact || "", sources: attempt.sources || "", narration: correct ? audio.correct : audio.incorrect };
}
