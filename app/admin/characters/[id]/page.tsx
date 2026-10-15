import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";
import { loadAdminCharacter } from "@/server/services/characters";
import CharacterQr from "@/features/characters/character-qr";
import DeleteCharacterButton from "@/features/characters/delete-character-button";
import CharacterAppearance from "@/features/characters/character-appearance";
import PrepareSpeech from "@/features/characters/prepare-speech";
import { DEFAULT_VOICE } from "@/server/domain/speech";

export default async function CharacterDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  if (!await hasAdminSession()) redirect("/?auth=login");
  const character = await loadAdminCharacter((await params).id);
  if (!character) notFound();
  const saved = (await searchParams).saved === "1";
  return <>
    <Link className="back-link" href="/admin/characters">← Danh sách nhân vật</Link>
    <div className="character-page-heading"><div><p className="dashboard-eyebrow">CHI TIẾT NHÂN VẬT</p><h1>{character.name}</h1><p className="subtitle">Thông tin lịch sử và mã QR dùng cho bàn chơi.</p></div>
      <div className="btn-row"><Link className="btn" href={`/admin/questions?characterId=${character.id}`}>Danh sách câu hỏi</Link><Link className="btn primary" href={`/admin/characters/${character.id}/edit`}>Chỉnh sửa</Link><DeleteCharacterButton id={character.id} name={character.name} returnToList /></div>
    </div>
    {saved && <p className="character-notice" role="status">Đã lưu nhân vật. Mã QR đã sẵn sàng cho người chơi.</p>}
    <CharacterQr character={character} />
    <PrepareSpeech characterId={character.id} voiceName={character.voiceName || DEFAULT_VOICE} />
    <section className="card character-detail" aria-label="Hồ sơ nhân vật">
      <CharacterAppearance character={character} />
      <div>
        <dl><dt>Tên nhân vật</dt><dd>{character.name}</dd><dt>Câu nói mở đầu</dt><dd className="character-opening-line">{character.openingLine || "Chưa có câu nói mở đầu. Hãy bổ sung khi chỉnh sửa."}</dd><dt>Cập nhật lần cuối</dt><dd>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(character.updatedAt))}</dd></dl>
      </div>
    </section>
  </>;
}
