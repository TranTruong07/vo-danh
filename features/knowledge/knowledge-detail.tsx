"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { KNOWLEDGE_CHARACTERS } from "@/server/domain/knowledge";
import { KNOWLEDGE_CHARACTER_LABELS, KNOWLEDGE_STATUS_LABELS, type KnowledgeDetail as Detail, type KnowledgeEdit, type KnowledgeOperation } from "@/server/domain/knowledge-admin";

const ACTIONS: Record<KnowledgeOperation, string> = { create_revision: "Lưu thành revision mới", submit: "Gửi duyệt", approve: "Phê duyệt", reject: "Từ chối", publish: "Công bố", unpublish: "Gỡ công bố" };
const date = (value: string) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value));

export default function KnowledgeDetail({ data }: { data: Detail }) {
  const router = useRouter(), dialog = useRef<HTMLDialogElement>(null);
  const row = data.selected.draft, selectedId = data.selected.revisionId;
  const [editing, setEditing] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [action, setAction] = useState<KnowledgeOperation>("submit"), [reason, setReason] = useState(""), [acknowledged, setAcknowledged] = useState(false);
  const [content, setContent] = useState<KnowledgeEdit>({ canonicalQuestion: row.canonicalQuestion, aliases: row.aliases, approvedAnswer: row.approvedAnswer, characterAnswers: { ...row.characterAnswers } });
  const [aliasText, setAliasText] = useState(row.aliases.join("\n"));
  const canReview = ["draft", "pending_review"].includes(row.status), isPublished = data.publishedVersionId === selectedId;
  function open(next: KnowledgeOperation) { setAction(next); setReason(""); setAcknowledged(false); setError(""); dialog.current?.showModal(); }
  async function confirm(e: React.FormEvent) {
    e.preventDefault(); if (busy || data.preview) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/knowledge/${data.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ action, revisionId: selectedId, expectedVersion: data.managementVersion, reason, ...(action === "approve" ? { acknowledged } : {}), ...(action === "create_revision" ? { content: { ...content, aliases: aliasText.split(/\r?\n/).map(s => s.trim()).filter(Boolean) } } : {}) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Chưa thực hiện được thao tác.");
      dialog.current?.close(); setEditing(false); setNotice(`${ACTIONS[action]} thành công.`);
      router.replace(`/admin/knowledge/${data.id}?revision=${encodeURIComponent(result.revisionId)}`); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Mất kết nối. Hãy tải lại để kiểm tra trạng thái trước khi thử lại."); }
    finally { setBusy(false); }
  }
  const field = (key: "canonicalQuestion" | "approvedAnswer", value: string) => setContent(current => ({ ...current, [key]: value }));
  return <div className="knowledge-page">
    <Link className="back-link" href={`/admin/knowledge${data.preview ? "?preview=1" : ""}`}>← Kho kiến thức</Link>
    <div className="knowledge-heading"><div><p className="dashboard-eyebrow">{data.id} · REVISION {row.version}</p><h1>{row.canonicalQuestion}</h1><div className="knowledge-meta"><span className={`knowledge-badge ${row.status}`}>{KNOWLEDGE_STATUS_LABELS[row.status]}</span><span>{isPublished ? "Bản này đang phục vụ chatbot" : data.publishedVersionId ? `Chatbot đang dùng ${data.publishedVersionId}` : "Chưa có bản được công bố"}</span></div></div></div>
    {data.preview && <div className="knowledge-notice"><strong>Bản xem trước, chỉ đọc</strong><p>Chờ chủ dự án xác nhận import revision 3. Không có thao tác duyệt hoặc công bố trên bản xem trước này.</p></div>}
    {notice && <p className="knowledge-success" role="status">{notice}</p>}
    <div className="knowledge-columns"><div>
      <section className="card"><h2>Câu hỏi & cách hỏi tương đương</h2><p>{row.canonicalQuestion}</p><ul>{row.aliases.map((alias, i) => <li key={i}>{alias}</li>)}</ul></section>
      <section className="card"><h2>Nguồn để đối chiếu</h2><p><strong>{row.source.document}</strong> · Mục {row.source.sectionId}</p><blockquote className="knowledge-text">{row.source.excerpt}</blockquote><details><summary>Vị trí trong tài liệu</summary><p>{row.source.blockIds.join(", ")}</p><p className="knowledge-hash">SHA-256: {row.source.sourceSha256}</p></details></section>
      <section className="card"><h2>Đáp án trung tính</h2><p className="knowledge-text">{row.approvedAnswer}</p></section>
      <section className="card"><h2>Bốn lời đáp nhân vật</h2><p className="knowledge-muted">Lời thoại mô phỏng giáo dục, không phải phát ngôn nguyên văn của nhân vật.</p><div className="knowledge-answers">{KNOWLEDGE_CHARACTERS.map(id => <article key={id}><h3>{KNOWLEDGE_CHARACTER_LABELS[id]}</h3><p className="knowledge-text">{row.characterAnswers[id]}</p></article>)}</div></section>
      {editing && <section className="card knowledge-editor"><h2>Tạo revision mới từ v{row.version}</h2><p>Bản hiện tại và bản đang công bố được giữ nguyên. Nguồn được kế thừa; thay đổi nguồn cần đối chiếu qua quy trình nhập tài liệu.</p>
        <label>Câu hỏi chuẩn<input value={content.canonicalQuestion} onChange={e => field("canonicalQuestion", e.target.value)} maxLength={500} required /></label>
        <label>Aliases (2–5 dòng)<textarea rows={5} value={aliasText} onChange={e => setAliasText(e.target.value)} maxLength={2505} /></label>
        <label>Đáp án trung tính<textarea rows={7} value={content.approvedAnswer} onChange={e => field("approvedAnswer", e.target.value)} maxLength={12000} /></label>
        {KNOWLEDGE_CHARACTERS.map(id => <label key={id}>{KNOWLEDGE_CHARACTER_LABELS[id]}<textarea rows={7} maxLength={12000} value={content.characterAnswers[id]} onChange={e => setContent(c => ({ ...c, characterAnswers: { ...c.characterAnswers, [id]: e.target.value } }))} /></label>)}
        <div className="btn-row"><button className="btn primary" disabled={busy} onClick={() => open("create_revision")}>Lưu thành bản nháp mới</button><button className="btn" onClick={() => setEditing(false)}>Hủy chỉnh sửa</button></div>
      </section>}
      <section className="card"><h2>Lịch sử phiên bản</h2><div className="knowledge-history">{data.revisions.map(r => <div key={r.revisionId}><Link href={`/admin/knowledge/${data.id}?revision=${encodeURIComponent(r.revisionId)}${data.preview ? "&preview=1" : ""}`}>v{r.draft.version} · {KNOWLEDGE_STATUS_LABELS[r.draft.status]}</Link><span>{date(r.draft.createdAt)}{r.revisionId === data.publishedVersionId && " · Đang công bố"}</span><small>{r.basedOnRevisionId ? `Tạo từ ${r.basedOnRevisionId} · Người tạo: ${r.createdBy}` : "Bản nhập từ bộ dữ liệu"}</small>{r.draft.reviewedBy && <small>Người duyệt: {data.audit.find(a => a.revisionId === r.revisionId && ["approve", "reject"].includes(a.action))?.actorEmail || r.draft.reviewedBy} · {r.draft.reviewedAt && date(r.draft.reviewedAt)}</small>}{r.draft.rejectionReason && <p>Lý do từ chối: {r.draft.rejectionReason}</p>}</div>)}</div>
        <details><summary>Đối chiếu toàn bộ nội dung các revision</summary>{data.revisions.map(r => <details key={r.revisionId}><summary>v{r.draft.version} — {r.draft.canonicalQuestion}</summary><p>Aliases: {r.draft.aliases.join(" · ")}</p><p className="knowledge-text">{r.draft.approvedAnswer}</p>{KNOWLEDGE_CHARACTERS.map(id => <div key={id}><h4>{KNOWLEDGE_CHARACTER_LABELS[id]}</h4><p className="knowledge-text">{r.draft.characterAnswers[id]}</p></div>)}</details>)}</details>
      </section>
      <section className="card"><h2>Nhật ký thao tác</h2>{!data.audit.length ? <p className="knowledge-muted">Chưa có thao tác quản trị được ghi nhận.</p> : <ol className="knowledge-audit">{data.audit.map(a => <li key={a.id}><strong>{ACTIONS[a.action as KnowledgeOperation] || a.action} · {a.revisionId}</strong><span>{a.actorEmail} · {date(a.at)}</span><p>{a.reason}</p>{a.changedFields.length > 0 && <small>Các trường thay đổi: {a.changedFields.join(", ")}</small>}{["publish", "unpublish"].includes(a.action) && <small>Công bố: {a.from || "Chưa có"} → {a.to || "Không công bố"}</small>}</li>)}</ol>}</section>
    </div><aside className="knowledge-review">
      <section className="card"><h2>Kiểm duyệt</h2><p>Đọc cả nguồn, aliases và năm lời đáp trước khi duyệt. Phê duyệt và công bố là hai thao tác riêng.</p>
        {!data.preview && <div className="knowledge-controls"><button className="btn" disabled={busy} onClick={() => setEditing(v => !v)}>Chỉnh sửa bằng revision mới</button>{row.status === "draft" && <button className="btn" disabled={busy || !!data.validationErrors.length} onClick={() => open("submit")}>Gửi duyệt</button>}{canReview && <><button className="btn primary" disabled={busy || !!data.validationErrors.length} onClick={() => open("approve")}>Phê duyệt revision {row.version}</button><button className="btn danger" disabled={busy} onClick={() => open("reject")}>Từ chối</button></>}{row.status === "approved" && !isPublished && <button className="btn primary" disabled={busy || !!data.validationErrors.length} onClick={() => open("publish")}>Công bố revision {row.version}</button>}{isPublished && <button className="btn danger" disabled={busy} onClick={() => open("unpublish")}>Gỡ công bố</button>}</div>}
      </section>
      <section className="card"><h2>Điểm cần rà soát ({data.warnings.length})</h2>{data.warnings.length ? <ul className="knowledge-warnings">{data.warnings.map((w, i) => <li key={i}>{w.message}</li>)}</ul> : <p>Không có cảnh báo tự động. Quản trị viên vẫn phải đối chiếu tính đúng đắn của nội dung.</p>}{data.validationErrors.length > 0 && <div role="alert" className="knowledge-error">{data.validationErrors.map((e, i) => <p key={i}>{e.message}</p>)}</div>}</section>
      <details className="card"><summary>Ghi chú biên tập</summary><ul>{row.reviewNotes.map((note, i) => <li key={i}>{note}</li>)}</ul></details>
    </aside></div>
    <dialog className="knowledge-dialog" ref={dialog} onCancel={e => { if (busy) e.preventDefault(); }}><form onSubmit={confirm}>
      <h2>{ACTIONS[action]} revision {row.version}?</h2><p>{action === "publish" ? "Chatbot sẽ sử dụng nguyên văn bốn lời đáp của revision đã chọn. Bản được công bố trước đó vẫn được lưu trong lịch sử." : action === "unpublish" ? "Chatbot sẽ ngừng dùng câu hỏi này ngay từ lần đọc tiếp theo. Các revision vẫn được giữ nguyên." : action === "create_revision" ? "Lưu nội dung thành một bản nháp mới, chưa được duyệt và chưa công bố." : "Thao tác này được ghi lại cùng tài khoản quản trị đang đăng nhập."}</p>
      {action === "approve" && <label className="knowledge-check"><input type="checkbox" required checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />Tôi đã đối chiếu nguồn, aliases, đáp án trung tính, bốn lời đáp và tất cả cảnh báo của revision này.</label>}
      <label>{action === "reject" ? "Lý do từ chối" : "Ghi chú thao tác"}<textarea autoFocus required minLength={1} maxLength={2000} rows={4} value={reason} onChange={e => setReason(e.target.value)} disabled={busy} /></label>
      {error && <p role="alert" className="knowledge-error">{error}</p>}
      <div className="btn-row"><button type="button" className="btn" disabled={busy} onClick={() => dialog.current?.close()}>Quay lại</button><button className="btn primary" disabled={busy || !reason.trim() || (action === "approve" && !acknowledged)}>{busy ? "Đang lưu…" : `Xác nhận ${ACTIONS[action].toLowerCase()}`}</button></div>
    </form></dialog>
  </div>;
}
