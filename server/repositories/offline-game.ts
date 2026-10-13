import "server-only";
import { getDatabase } from "@/lib/db/client";
import type { CharacterModel } from "@/server/models/character";
import type { CharacterQuestionModel } from "@/server/models/character-question";
import { publicCharacter } from "./characters";
import { questionRecord } from "./character-questions";

export async function readOfflineGame() {
  const db = await getDatabase();
  const [characters, questions] = await Promise.all([
    db.collection<CharacterModel>("characters").find({}).sort({ _id: 1 }).toArray(),
    db.collection<CharacterQuestionModel>("character_questions").find({}).sort({ _id: 1 }).toArray(),
  ]);
  return { characters: characters.map(publicCharacter), questions: questions.map(questionRecord) };
}
