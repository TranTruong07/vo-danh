import "server-only";
import { createHash } from "node:crypto";
import { readOfflineGame } from "@/server/repositories/offline-game";
import type { OfflinePack } from "@/server/domain/offline-game";
import { attachQuestionAudio } from "./quiz-audio-playback";

export async function offlineGamePack(): Promise<OfflinePack> {
  const data = await readOfflineGame();
  const ids = new Set(data.characters.map(character => character.id));
  data.questions = data.questions.filter(question => ids.has(question.characterId));
  data.questions = await attachQuestionAudio(data.questions);
  return { schema: 1, version: createHash("sha256").update(JSON.stringify(data)).digest("hex"), ...data };
}
