import "server-only";
import { requireAdmin } from "./admin-auth";
import { GameError, isCharacterId } from "@/server/domain/character";
import { normalizeQuestion } from "@/server/domain/character-question";
import { QUESTION_IMPORT_MAX_BYTES, type QuestionImportReport } from "@/server/domain/question-import";
import { findCharacter } from "@/server/repositories/characters";
import { existingQuestionTexts, importCharacterQuestions } from "@/server/repositories/character-questions";
import { createQuestionTemplate, readQuestionWorkbook } from "@/server/infrastructure/question-workbook";

export async function downloadQuestionTemplate() {
  await requireAdmin();
  return createQuestionTemplate();
}

export async function importQuestionFile(form: FormData, commit: boolean): Promise<QuestionImportReport> {
  await requireAdmin();
  const characterId = form.get("characterId");
  if (typeof characterId !== "string" || !isCharacterId(characterId)) throw new GameError("Vui lòng chọn nhân vật nhận câu hỏi.");
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || !/\.xlsx$/i.test(file.name)) throw new GameError("Vui lòng chọn file Excel .xlsx theo mẫu.");
  if (file.size > QUESTION_IMPORT_MAX_BYTES) throw new GameError("File Excel không được vượt quá 2 MB.");
  const character = await findCharacter(characterId);
  if (!character) throw new GameError("Nhân vật không còn tồn tại. Vui lòng chọn lại.");
  const rows = await readQuestionWorkbook(Buffer.from(await file.arrayBuffer()), characterId);
  const existing = new Set((await existingQuestionTexts(characterId)).map(row => normalizeQuestion(row.question)));
  const seen = new Map<string, number>();
  for (const row of rows) {
    if (row.status !== "ready") continue;
    const key = normalizeQuestion(row.question);
    if (existing.has(key)) { row.status = "duplicate"; row.message = "Đã có câu hỏi này trong kho của nhân vật."; }
    else if (seen.has(key)) { row.status = "duplicate"; row.message = `Trùng với dòng ${seen.get(key)} trong file.`; }
    else seen.set(key, row.row);
  }
  if (commit) {
    const ready = rows.filter(row => row.status === "ready" && row.data);
    const inserted = await importCharacterQuestions(ready.map(row => row.data!));
    ready.forEach((row, index) => {
      row.status = inserted.has(index) ? "imported" : "duplicate";
      row.message = inserted.has(index) ? "Đã nhập thành công" : "Câu hỏi vừa được nhập trước đó. Đã bỏ qua bản trùng.";
    });
  }
  return { characterId, characterName: character.name, rows, committed: commit };
}
