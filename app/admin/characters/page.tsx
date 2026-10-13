import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";
import { loadAdminCharacters } from "@/server/services/characters";
import DeleteCharacterButton from "@/features/characters/delete-character-button";
import CharacterAppearance from "@/features/characters/character-appearance";

export default async function CharactersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; deleted?: string }> }) {
  if (!await hasAdminSession()) redirect("/?auth=login");
  const params = await searchParams;
  const page = Math.min(10000, Math.max(1, Math.floor(Number(params.page) || 1)));
  const search = (typeof params.q === "string" ? params.q : "").trim().slice(0, 120);
  const { items, total } = await loadAdminCharacters(page, search);
  const totalPages = Math.max(1, Math.ceil(total / 12));
  const href = (p: number) => `/admin/characters?${new URLSearchParams({ page: String(p), q: search })}`;
  if (page > totalPages) redirect(href(totalPages));
  return <>
    <div className="character-page-heading"><div><p className="dashboard-eyebrow">NHÂN VẬT & QR</p><h1>Nhân vật lịch sử</h1><p className="subtitle">Quản lý hồ sơ nhân vật và thẻ QR cho bàn chơi.</p></div><Link className="btn primary" href="/admin/characters/new">+ Tạo mới nhân vật</Link></div>
    {params.deleted === "1" && <p className="character-notice" role="status">Đã xóa nhân vật.</p>}
    <section className="card character-list" aria-label="Danh sách nhân vật">
      <div className="character-list-toolbar"><div><h2>Danh sách nhân vật <span className="badge">{total}</span></h2><p>{search ? `Kết quả tìm kiếm: “${search}”` : "Tất cả hồ sơ đã tạo"}</p></div>
        <form key={search} className="character-search" action="/admin/characters"><label className="character-search-label"><span>Tìm nhân vật</span><input name="q" type="search" defaultValue={search} placeholder="Nhập tên nhân vật…" maxLength={120} /></label><button className="btn">Tìm kiếm</button>{search && <Link className="btn" href="/admin/characters">Xóa lọc</Link>}</form>
      </div>
      {items.length ? <div className="character-table-wrap"><table className="character-table"><thead><tr><th scope="col">Nhân vật & hình ảnh</th><th scope="col">Câu nói mở đầu</th><th scope="col">Cập nhật</th><th scope="col">Thao tác</th></tr></thead><tbody>
        {items.map(item => <tr key={item.id}>
          <td><Link className="character-table-profile" href={`/admin/characters/${item.id}`}>
            <CharacterAppearance character={item} /><span><strong>{item.name}</strong></span>
          </Link></td>
          <td data-label="Câu nói mở đầu"><p className="character-list-opening">{item.openingLine || "Chưa bổ sung"}</p></td>
          <td data-label="Cập nhật">{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Bangkok" }).format(new Date(item.updatedAt))}</td>
          <td><div className="character-row-actions"><Link className="btn" href={`/admin/characters/${item.id}`}>Xem chi tiết</Link><Link className="btn" href={`/admin/characters/${item.id}/edit`}>Chỉnh sửa</Link><Link className="btn" href={`/admin/questions?characterId=${item.id}`}>Câu hỏi</Link><DeleteCharacterButton id={item.id} name={item.name} /></div></td>
        </tr>)}
      </tbody></table></div> : <div className="character-list-empty"><span aria-hidden="true">♙</span><h2>{search ? "Không tìm thấy nhân vật" : "Chưa có nhân vật nào"}</h2><p>{search ? "Thử tìm theo tên khác hoặc xóa bộ lọc để xem tất cả nhân vật." : "Tạo hồ sơ đầu tiên để bắt đầu xây dựng bộ thẻ lịch sử của bạn."}</p><Link className="btn primary" href={search ? "/admin/characters" : "/admin/characters/new"}>{search ? "Xem tất cả nhân vật" : "Tạo mới nhân vật"}</Link></div>}
      <div className="character-list-footer"><span>{total ? `${(page - 1) * 12 + 1}–${Math.min(page * 12, total)} trong ${total} nhân vật` : "0 nhân vật"}</span><nav className="btn-row" aria-label="Phân trang">{page > 1 && <Link className="btn" href={href(page - 1)}>← Trang trước</Link>}<span>Trang {page} / {totalPages}</span>{page < totalPages && <Link className="btn" href={href(page + 1)}>Trang sau →</Link>}</nav></div>
    </section>
  </>;
}
