import type { PublicCharacter } from "./character";
import type { CharacterQuestionRecord } from "./character-question";
import type { CatalogProduct } from "./product";

// This public learning pack intentionally includes answers for local grading.
export interface OfflinePack {
  schema: 1;
  version: string;
  characters: PublicCharacter[];
  questions: CharacterQuestionRecord[];
  product?: CatalogProduct;
}
