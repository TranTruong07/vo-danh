"use server";

import { revalidatePath } from "next/cache";
import { GameError } from "@/server/domain/character";
import type { CharacterQuestionRecord } from "@/server/domain/character-question";
import type { GameResult } from "@/server/domain/quiz";
import { removeQuestion, saveQuestionForm } from "@/server/services/character-questions";

export async function saveQuestionAction(id: string | null, form: FormData): Promise<GameResult<CharacterQuestionRecord>> {
  try {
    const data = await saveQuestionForm(id, form);
    revalidatePath("/admin/questions", "layout");
    return { ok: true, data };
  } catch (error) { return { ok: false, message: error instanceof GameError ? error.message : "Không thể lưu câu hỏi. Kiểm tra phiên admin và kết nối rồi thử lại." }; }
}
export async function deleteQuestionAction(id: string): Promise<GameResult<null>> {
  try {
    await removeQuestion(id);
    revalidatePath("/admin/questions", "layout");
    return { ok: true, data: null };
  } catch (error) { return { ok: false, message: error instanceof GameError ? error.message : "Không thể xóa câu hỏi. Vui lòng thử lại." }; }
}
