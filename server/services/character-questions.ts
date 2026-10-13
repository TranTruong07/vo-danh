import "server-only";
import { requireAdmin } from "./admin-auth";
import { GameError, isCharacterId } from "@/server/domain/character";
import { normalizeQuestion, validateCharacterQuestion } from "@/server/domain/character-question";
import { findCharacter } from "@/server/repositories/characters";
import * as repository from "@/server/repositories/character-questions";

export async function loadQuestionList(page: number, search: string, characterId: string) {
  await requireAdmin();
  if (characterId && !isCharacterId(characterId)) throw new GameError("Mã nhân vật không hợp lệ.");
  const [result, choices] = await Promise.all([repository.listCharacterQuestions(page, search, characterId), repository.questionCharacterChoices()]);
  return { ...result, items: repository.withCharacterNames(result.items, choices), choices };
}
export async function loadQuestionEditor(id?: string) {
  await requireAdmin();
  const [row, choices] = await Promise.all([id ? repository.findCharacterQuestion(id) : null, repository.questionCharacterChoices()]);
  return { question: row ? repository.questionRecord(row) : null, choices };
}
export async function saveQuestionForm(id: string | null, form: FormData) {
  await requireAdmin();
  if (id !== null && !isCharacterId(id)) throw new GameError("Mã câu hỏi không hợp lệ.");
  const value = (key: string) => typeof form.get(key) === "string" ? String(form.get(key)) : "";
  const correct = value("correctIndex");
  const data = validateCharacterQuestion({ characterId: value("characterId"), question: value("question"), answers: [0, 1, 2, 3].map(index => value(`answer${index}`)), correctIndex: /^[0-3]$/.test(correct) ? Number(correct) : -1, correctFeedback: value("correctFeedback"), incorrectFeedback: value("incorrectFeedback") });
  if (!await findCharacter(data.characterId)) throw new GameError("Nhân vật không còn tồn tại. Vui lòng chọn nhân vật khác.");
  const existing = await repository.existingQuestionTexts(data.characterId, id);
  if (existing.some(row => normalizeQuestion(row.question) === normalizeQuestion(data.question))) throw new GameError("Câu hỏi này đã có trong danh sách của nhân vật.");
  const row = await repository.saveCharacterQuestion(id, data);
  if (!row) throw new GameError("Câu hỏi không còn tồn tại.");
  return repository.questionRecord(row);
}
export async function removeQuestion(id: string) {
  await requireAdmin();
  if (!isCharacterId(id)) throw new GameError("Mã câu hỏi không hợp lệ.");
  await repository.deleteCharacterQuestion(id);
}
