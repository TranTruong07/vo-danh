import type { ObjectId } from "mongodb";
import type { CharacterInput } from "@/server/domain/character";
import type { QuizQuestion } from "@/server/domain/quiz";

// Older documents acquire the new presentation fields on their next admin save.
export interface CharacterModel extends Omit<CharacterInput, "openingLine" | "backgroundImage"> {
  _id: ObjectId; createdAt: Date; updatedAt: Date;
  openingLine?: string;
  backgroundImage?: string;
}
export interface QuizAttemptModel {
  _id: string;
  ownerHash: string;
  characterId: string;
  state: "generating" | "ready" | "failed";
  question?: QuizQuestion;
  sourceQuestionId?: string;
  fact?: string;
  sources?: string;
  selectedIndex?: number;
  createdAt: Date;
  expiresAt: Date;
}
