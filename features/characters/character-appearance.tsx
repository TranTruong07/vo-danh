import type { PublicCharacter } from "@/server/domain/character";

export default function CharacterAppearance({ character }: { character: Pick<PublicCharacter, "name" | "image" | "backgroundImage"> }) {
  return <div className="character-appearance">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="character-background" src={character.backgroundImage} alt={`Ảnh nền của ${character.name}`} referrerPolicy="no-referrer" />
    <span className="character-background-shade" />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="character-portrait" src={character.image} alt={`Ảnh nhân vật ${character.name}`} referrerPolicy="no-referrer" />
  </div>;
}
