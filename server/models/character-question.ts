import type { ObjectId } from "mongodb";
import type { CharacterQuestionInput } from "@/server/domain/character-question";

export interface CharacterQuestionModel extends CharacterQuestionInput {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  questionKey?: string;
}
