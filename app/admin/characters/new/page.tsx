import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";
import CharacterForm from "@/features/characters/character-form";

export default async function NewCharacterPage() {
  if (!await hasAdminSession()) redirect("/?auth=login");
  return <>
    <Link className="back-link" href="/admin/characters">← Danh sách nhân vật</Link>
    <h1>Tạo mới nhân vật</h1>
    <p className="subtitle">Tạo nhân vật với tên, câu nói mở đầu, ảnh nền và ảnh nhân vật.</p>
    <CharacterForm />
  </>;
}
