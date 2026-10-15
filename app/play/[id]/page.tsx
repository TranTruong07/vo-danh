import { notFound } from "next/navigation";
import { findCharacter, publicCharacter } from "@/server/repositories/characters";
import GamePlayer from "@/features/game/game-player";
import { openCharacterChat } from "@/server/services/chat-game-session";

export const dynamic = "force-dynamic";
export default async function CharacterPlayPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ round?: string }> }) {
  const { id } = await params;
  const character = await findCharacter(id);
  if (!character) notFound();
  async function openChatSessionAction(requestId: string) {
    "use server";
    return openCharacterChat(id, requestId);
  }
  const { round } = await searchParams;
  return <GamePlayer key={`${id}:${typeof round === "string" ? round.slice(0, 64) : "initial"}`} character={publicCharacter(character)} openChatSessionAction={openChatSessionAction} />;
}
