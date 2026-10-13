"use server";

import { revalidatePath } from "next/cache";
import { GameError, type CharacterRecord } from "@/server/domain/character";
import type { GameResult } from "@/server/domain/quiz";
import { saveCharacterForm, removeCharacter } from "@/server/services/characters";

export async function saveCharacterAction(id: string | null, form: FormData): Promise<GameResult<CharacterRecord>> {
  try {
    const data = await saveCharacterForm(id, form);
    revalidatePath("/admin");
    revalidatePath("/admin/questions", "layout");
    revalidatePath("/admin/characters", "layout"); revalidatePath(`/play/${data.id}`);
    return { ok: true, data };
  } catch (error) { return { ok: false, message: error instanceof GameError ? error.message : "Không thể lưu nhân vật. Kiểm tra phiên admin và kết nối rồi thử lại." }; }
}
export async function deleteCharacterAction(id: string): Promise<GameResult<null>> {
  try {
    await removeCharacter(id);
    revalidatePath("/admin");
    revalidatePath("/admin/questions", "layout");
    revalidatePath("/admin/characters", "layout"); revalidatePath(`/play/${id}`);
    return { ok: true, data: null };
  } catch (error) { return { ok: false, message: error instanceof GameError ? error.message : "Không thể xóa nhân vật. Kiểm tra phiên admin rồi thử lại." }; }
}
