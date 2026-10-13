"use server";

import { revalidatePath } from "next/cache";
import { GameError } from "@/server/domain/character";
import type { GameResult } from "@/server/domain/quiz";
import type { QuestionImportReport } from "@/server/domain/question-import";
import { importQuestionFile } from "@/server/services/question-import";

export async function importQuestionFileAction(form: FormData, commit: boolean): Promise<GameResult<QuestionImportReport>> {
  try {
    // Parse and check the original file again on commit; never trust the client preview.
    const report = await importQuestionFile(form, commit === true);
    if (report.committed) revalidatePath("/admin/questions", "layout");
    return { ok: true, data: report };
  } catch (error) {
    return { ok: false, message: error instanceof GameError ? error.message : "Không thể xử lý file. Kiểm tra phiên admin và kết nối rồi thử lại. Nếu kết nối bị ngắt khi lưu, hãy kiểm tra lại file; câu đã nhập sẽ được bỏ qua." };
  }
}
