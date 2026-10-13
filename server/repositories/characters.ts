import "server-only";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/client";
import type { CharacterModel } from "@/server/models/character";
import { DEFAULT_CHARACTER_BACKGROUND, isCharacterId, type CharacterInput, type CharacterRecord, type PublicCharacter } from "@/server/domain/character";

const state = globalThis as typeof globalThis & { characterIndexes?: Promise<unknown> };
async function collection() {
  const rows = (await getDatabase()).collection<CharacterModel>("characters");
  state.characterIndexes ??= rows.createIndex({ createdAt: -1 }).catch(error => { state.characterIndexes = undefined; throw error; });
  await state.characterIndexes;
  return rows;
}
export function characterRecord(row: CharacterModel): CharacterRecord {
  return { ...publicCharacter(row), updatedAt: row.updatedAt.toISOString() };
}
export function publicCharacter(row: CharacterModel): PublicCharacter {
  return { id: row._id.toHexString(), name: row.name, image: row.image, openingLine: row.openingLine || "", backgroundImage: row.backgroundImage || DEFAULT_CHARACTER_BACKGROUND };
}
export async function listCharacters(page: number, search: string) {
  const rows = await collection();
  const filter = search ? { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } } : {};
  const [items, total] = await Promise.all([rows.find(filter).sort({ createdAt: -1 }).skip((page - 1) * 12).limit(12).toArray(), rows.countDocuments(filter)]);
  return { items: items.map(characterRecord), total };
}
export async function findCharacter(id: string) {
  if (!isCharacterId(id)) return null;
  return (await collection()).findOne({ _id: new ObjectId(id) });
}
export async function saveCharacter(id: string | null, data: CharacterInput) {
  const rows = await collection();
  const now = new Date();
  if (id) return rows.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { ...data, updatedAt: now } }, { returnDocument: "after" });
  const row: CharacterModel = { ...data, _id: new ObjectId(), createdAt: now, updatedAt: now };
  await rows.insertOne(row);
  return row;
}
export async function deleteCharacter(id: string) { return (await collection()).deleteOne({ _id: new ObjectId(id) }); }
export async function isCharacterImageReferenced(image: string) { return !!await (await collection()).findOne({ $or: [{ image }, { backgroundImage: image }] }, { projection: { _id: 1 } }); }
