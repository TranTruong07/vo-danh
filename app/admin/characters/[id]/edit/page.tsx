import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";
import { loadAdminCharacter } from "@/server/services/characters";
import CharacterForm from "@/features/characters/character-form";

export default async function EditCharacterPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await hasAdminSession()) redirect("/?auth=login");
  const character = await loadAdminCharacter((await params).id);
  if (!character) notFound();
  return <>
    <Link className="back-link" href={`/admin/characters/${character.id}`}>← Chi tiết nhân vật</Link>
    <h1>Chỉnh sửa nhân vật</h1>
    <p className="subtitle">Cập nhật hồ sơ của {character.name}. Mã QR hiện tại được giữ nguyên.</p>
    <CharacterForm key={character.id + character.updatedAt} character={character} />
  </>;
}
