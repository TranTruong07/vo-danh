"use server";

import { GameError } from "@/server/domain/character";
import type { GameResult, PublicQuestion, AnswerResult } from "@/server/domain/quiz";
import { startQuiz, answerQuiz } from "@/server/services/quizzes";

export async function startQuizAction(characterId: string, requestId: string): Promise<GameResult<PublicQuestion>> {
  try { return { ok: true, data: await startQuiz(characterId, requestId) }; }
  catch (error) { return { ok: false, message: error instanceof GameError ? error.message : "Không thể kết nối lượt chơi. Vui lòng thử lại." }; }
}
export async function answerQuizAction(id: string, index: number): Promise<GameResult<AnswerResult>> {
  try { return { ok: true, data: await answerQuiz(id, index) }; }
  catch (error) { return { ok: false, message: error instanceof GameError ? error.message : "Chưa gửi được đáp án. Vui lòng thử lại." }; }
}
