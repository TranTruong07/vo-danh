"use client";
import Link from "next/link";
import { useState } from "react";
import { KNOWLEDGE_STATUS_LABELS, type KnowledgeList as ListData } from "@/server/domain/knowledge-admin";

export default function KnowledgeList({ data, initialQuery }: { data: ListData; initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery), [status, setStatus] = useState("");
  const normalize = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").toLowerCase();
  const rows = data.items.filter(r => (!status || (status === "published" ? !!r.publishedVersionId : r.status === status)) && normalize([r.id, r.question, ...r.aliases].join(" ")).includes(normalize(query.trim())));
  return <div className="knowledge-page">
    <nav className="btn-row" aria-label="Biên tập kiến thức"><Link className="btn" href="/admin/knowledge/sources">Tài liệu nguồn</Link><Link className="btn" href="/admin/knowledge/generate">Tạo đề xuất AI</Link><Link className="btn" href="/admin/knowledge/proposals">Biên tập đề xuất</Link></nav>
    <div className="knowledge-heading"><div><p className="dashboard-eyebrow">CHATBOT · KIẾN THỨC LỊCH SỬ</p><h1>Kho kiến thức</h1><p className="subtitle">Đối chiếu nguồn, duyệt lời đáp và công bố từng phiên bản.</p></div><Link className="btn" href={data.preview ? "/admin/knowledge" : "/admin/knowledge?preview=1"}>{data.preview ? "Kiểm tra dữ liệu đã import" : "Xem bộ nháp revision 3"}</Link></div>
    {data.preview && <div className="knowledge-notice" role="status"><strong>Đang xem trước {data.items.length} bản nháp revision 3</strong><p>Bộ này chưa được import từ màn hình này. Bạn có thể đọc và rà soát; thao tác chỉnh sửa, duyệt và công bố chỉ mở cho dữ liệu đã import vào MongoDB sau khi chủ dự án xác nhận.</p></div>}
    <div className="knowledge-stats"><div><strong>{data.items.length}</strong><span>Câu hỏi</span></div><div><strong>{data.items.filter(r => r.status === "pending_review").length}</strong><span>Chờ duyệt</span></div><div><strong>{data.items.filter(r => r.status === "approved").length}</strong><span>Revision mới nhất đã duyệt</span></div><div><strong>{data.items.filter(r => r.publishedVersionId).length}</strong><span>Đang công bố</span></div></div>
    <div className="card knowledge-filters"><label>Tìm câu hỏi hoặc alias<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nhập từ khóa hoặc mã câu hỏi…" maxLength={120} /></label><label>Trạng thái<select value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả</option><option value="published">Đang công bố</option>{Object.entries(KNOWLEDGE_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label} (bản mới nhất)</option>)}</select></label></div>
    <p className="knowledge-muted">{rows.length} câu hỏi · Bốn lời đáp mô phỏng giáo dục cho mỗi câu.</p>
    <section className="knowledge-list" aria-label="Danh sách kiến thức">{rows.map(r => <article className="card" key={r.id}><div className="knowledge-meta"><span>{r.id} · Mục {r.section} · v{r.version}</span><span className={`knowledge-badge ${r.status}`}>{KNOWLEDGE_STATUS_LABELS[r.status]}</span>{r.publishedVersionId && <span className="knowledge-badge published">Đang công bố {r.publishedVersionId.split(":")[1]}</span>}</div><h2><Link href={`/admin/knowledge/${r.id}${data.preview ? "?preview=1" : ""}`}>{r.question}</Link></h2><p className="knowledge-muted">{r.aliases.length} cách hỏi tương đương</p><Link className="btn" href={`/admin/knowledge/${r.id}${data.preview ? "?preview=1" : ""}`}>{data.preview ? "Đọc và đối chiếu nguồn →" : "Xem chi tiết & kiểm duyệt →"}</Link></article>)}</section>
    {!rows.length && <div className="card"><h2>Không có câu hỏi phù hợp</h2><button className="btn" onClick={() => { setQuery(""); setStatus(""); }}>Xóa bộ lọc</button></div>}
  </div>;
}
