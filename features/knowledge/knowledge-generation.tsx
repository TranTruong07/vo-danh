'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Duplicate, KnowledgeProposal, ProposalContent, SourceChunk, SourceRecord } from '@/server/domain/knowledge-generation';
import { KNOWLEDGE_CHARACTERS } from '@/server/domain/knowledge';
import ProposalFields from './proposal-fields';
import './knowledge-generation.css';

type Pack = { source: SourceRecord; chunks: SourceChunk[] };
type Detail = { proposal: KnowledgeProposal; sources: Pack[]; duplicates: Duplicate[] };
type Context = { originalQuestion: string | null; relatedChatGroups: { groupId: string; question: string }[]; enabled: boolean; model: string; maxPerRequest: number; quota: { remaining: number; used: number; limit: number; day: string } };
const providerErrors: Record<string, string> = { PROVIDER_QUOTA: 'Gemini đã hết hạn mức (429). Không tự thử lại.', PROVIDER_TIMEOUT: 'Gemini hết thời gian phản hồi (504). Không tự thử lại.', GENERATION_TIMEOUT: 'Gemini phản hồi quá lâu (504). Không tự thử lại.', GENERATION_FAILED: 'Gemini tạm không khả dụng (503). Không tự thử lại.', INSUFFICIENT_EVIDENCE: 'Nguồn chưa đủ để tạo kiến thức. Hãy xem và đối chiếu đề xuất.' };
const emptyContent = (): ProposalContent => ({ canonicalQuestion: '', aliases: ['',''], neutralAnswer: '', characterAnswers: Object.fromEntries(KNOWLEDGE_CHARACTERS.map(k => [k, ''])) as ProposalContent['characterAnswers'], evidence: [], warnings: [], insufficientEvidence: false });
const labels = { queued: 'Đang chờ', generating: 'Đang tạo', ready_for_review: 'Chờ biên tập', insufficient_evidence: 'Chưa đủ bằng chứng', failed: 'Tạo chưa thành công', converted_to_draft: 'Đã lưu bản nháp', discarded: 'Đã bỏ qua' };
async function api<T>(path: string, body?: unknown, method?: string): Promise<T> {
  const response = await fetch(`/api/admin/knowledge/${path}`, { credentials: 'same-origin', cache: 'no-store',
    method: method || (body ? 'POST' : 'GET'), ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Chưa thực hiện được thao tác.'); return data;
}
export default function KnowledgeGeneration({ mode, groupId }: { mode: 'sources' | 'generate' | 'proposals' | 'manual'; groupId?: string }) {
  const [sources, setSources] = useState<SourceRecord[]>([]), [proposals, setProposals] = useState<KnowledgeProposal[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]), [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null), [edit, setEdit] = useState<ProposalContent | null>(null);
  const [notes, setNotes] = useState(''), [targetId, setTargetId] = useState(''), [reviewed, setReviewed] = useState(false), [duplicateReviewed, setDuplicateReviewed] = useState(false);
  const [context, setContext] = useState<Context | null>(null);
  const [manual, setManual] = useState<ProposalContent>(emptyContent), [manualNotes, setManualNotes] = useState('');
  const [manualSaved, setManualSaved] = useState<string | null>(null), [confirmGeneration, setConfirmGeneration] = useState(false);
  const pending = useRef(false), attemptId = useRef<string | null>(null);
  const [count, setCount] = useState(1), [page, setPage] = useState(1), [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        if (mode === 'proposals') { const data = await api<{ items: KnowledgeProposal[] }>(`proposals?page=${page}`); if (active) setProposals(data.items); }
        else { const data = await api<{ items: SourceRecord[] }>(`sources?page=${page}`); if (active) setSources(data.items); }
        if (mode === 'generate' || mode === 'manual') { const data = await api<Context>(`generate${groupId ? `?groupId=${encodeURIComponent(groupId)}` : ''}`); if (active) { setContext(data); if (mode === 'manual') setManual(current => current.canonicalQuestion ? current : { ...current, canonicalQuestion: data.originalQuestion || '' }); } }
        if (active) setError('');
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Lỗi kết nối.'); }
    })();
    return () => { active = false; };
  }, [mode, groupId, page, refresh]);
  async function perform(work: () => Promise<void>) {
    if (pending.current) return; pending.current = true; setBusy(true); setError(''); setMessage('');
    try { await work(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Lỗi kết nối.'); } finally { pending.current = false; setBusy(false); }
  }
  async function openSource(id: string) {
    const data = await api<Pack>(`sources/${id}`);
    setPacks(current => mode === 'sources' || mode === 'manual' ? [data] : [...current.filter(p => p.source._id !== id), data]);
  }
  async function openProposal(id: string) {
    const data = await api<Detail>(`proposals/${id}`);
    setDetail(data); setEdit(data.proposal.content || null); setNotes(data.proposal.notes); setTargetId(''); setReviewed(false); setDuplicateReviewed(false);
  }
  const editable = detail && ['ready_for_review', 'insufficient_evidence'].includes(detail.proposal.generationStatus);
  const dirty = detail && (JSON.stringify(edit) !== JSON.stringify(detail.proposal.content || null) || notes !== detail.proposal.notes);
  return <div className="knowledge-page generation-page">
    <div className="knowledge-heading"><div><p className="dashboard-eyebrow">BIÊN TẬP KIẾN THỨC</p><h1>{mode === 'sources' ? 'Tài liệu nguồn' : mode === 'generate' ? 'Đề xuất kiến thức bằng AI' : mode === 'manual' ? 'Nhập kiến thức thủ công' : 'Đề xuất cần biên tập'}</h1><p className="subtitle">Mọi bản nháp đều cần quản trị viên kiểm duyệt trước khi công bố.</p></div></div>
    <nav className="btn-row" aria-label="Quản lý kiến thức"><Link className="btn" href="/admin/knowledge">Kho kiến thức</Link><Link className="btn" href="/admin/knowledge/sources">Tài liệu nguồn</Link><Link className="btn" href="/admin/knowledge/generate">Tạo đề xuất</Link><Link className="btn" href="/admin/knowledge/proposals">Biên tập đề xuất</Link></nav>
    <Link className="btn" href="/admin/knowledge/manual">Nhập thủ công</Link>
    {error && <p className="knowledge-error" role="alert">{error}</p>}{message && <p className="knowledge-success" role="status">{message}</p>}
    {busy && <p role="status" aria-live="polite">{mode === 'generate' ? 'Đang xử lý yêu cầu… Không cần bấm gửi lại.' : 'Đang xử lý…'}</p>}
    {mode === 'sources' && <section className="card"><h2>Thêm tài liệu riêng tư</h2><p>DOCX hoặc PDF có lớp văn bản. Mặc định tối đa 10 MB, 100 trang PDF; không hỗ trợ file quét ảnh, mã hóa, macro hoặc tệp nhúng.</p><label className="generation-upload">Chọn tài liệu<input type="file" accept=".docx,.pdf" disabled={busy} onChange={event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
      void perform(async () => {
        const response = await fetch('/api/admin/knowledge/sources', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'X-File-Name': encodeURIComponent(file.name) }, body: file });
        const data = await response.json(); if (!response.ok) throw new Error(data.message || 'Chưa trích xuất được tài liệu.');
        setRefresh(n => n + 1); await openSource(data.sourceId); setMessage('Đã trích xuất. Hãy đọc các đoạn bên dưới rồi xác nhận tài liệu.');
      });
    }} /></label></section>}
    {mode === 'generate' && <section className="card"><h2>{groupId ? 'Bổ sung kiến thức từ hội thoại' : 'Chọn nội dung cần soạn'}</h2>
      {context?.originalQuestion && <blockquote>{context.originalQuestion}</blockquote>}
      {context && !context.enabled && <p className="knowledge-notice">Chức năng AI chưa được bật trên server. Bạn vẫn có thể tải tài liệu và chuẩn bị các đoạn nguồn.</p>}
      <p>Chọn tối đa 3 tài liệu, 12 đoạn và 24.000 ký tự. Mỗi đề xuất dựa trên một đoạn nguồn liên tục để có thể đối chiếu chính xác.</p>
      <label>Số câu đề xuất<select value={count} disabled={busy || !!requestId} onChange={e => { setCount(Number(e.target.value)); setConfirmGeneration(false); }}>{Array.from({ length: context?.maxPerRequest || 1 }, (_,i) => i + 1).map(n => <option key={n}>{n}</option>)}</select></label>
      {context && <p>Model: {context.model} · Hạn mức ứng dụng còn {context.quota.remaining}/{context.quota.limit} lượt trong ngày UTC {context.quota.day}. Đây không phải quota Google; mỗi lượt tiêu thụ 1 call.</p>}
      <label className="generation-check"><input type="checkbox" checked={confirmGeneration} disabled={busy || !!requestId} onChange={e => setConfirmGeneration(e.target.checked)} /> Tôi xác nhận gọi Gemini để tạo tối đa {count} câu từ các đoạn đã chọn, sử dụng 1 lượt trong hạn mức.</label>
      <p>{selected.length} đoạn đã chọn · {packs.flatMap(p => p.chunks).filter(c => selected.includes(c._id)).reduce((n,c) => n + c.text.length, 0).toLocaleString('vi-VN')} ký tự</p>
      <button className="btn btn-primary" disabled={busy || !context?.enabled || !selected.length || !confirmGeneration || (!requestId && !context.quota.remaining)} onClick={() => void perform(async () => {
        const token = attemptId.current || crypto.randomUUID(); attemptId.current = token; setRequestId(token);
        const data = await api<{ batchId: string; status?: string; errorCode?: string }>('generate', { requestId: token, confirmed: true, sourceIds: packs.filter(p => p.chunks.some(c => selected.includes(c._id))).map(p => p.source._id), chunkIds: selected, count, ...(groupId ? { groupId } : {}) });
        setContext(await api<Context>(`generate${groupId ? `?groupId=${encodeURIComponent(groupId)}` : ''}`));
        if (data.errorCode || data.status === 'insufficient_evidence' || data.status === 'failed') throw new Error(providerErrors[data.errorCode || 'INSUFFICIENT_EVIDENCE'] || 'Đề xuất chưa hợp lệ. Mở kết quả để kiểm tra; không tự gọi lại Gemini.');
        setMessage(`Đã ghi nhận lượt tạo. Mở Đề xuất cần biên tập để xem kết quả. Mã lượt: ${data.batchId.slice(0,12)}`);
      })}>{requestId ? 'Kiểm tra lại cùng lượt tạo' : 'Bắt đầu tạo đề xuất'}</button>
      {requestId && <button className="btn" disabled={busy} onClick={() => { attemptId.current = null; setRequestId(null); setConfirmGeneration(false); setMessage('Đã mở lượt mới. Chỉ bấm tạo khi bạn muốn gọi AI thêm một lần.'); }}>Chuẩn bị lượt tạo mới</button>}
      <Link className="btn" href="/admin/knowledge/proposals">Xem kết quả →</Link>
    </section>}
    {mode === 'manual' && <section className="card generation-editor"><h2>{groupId ? 'Soạn từ câu hỏi người chơi' : 'Soạn câu hỏi mới'}</h2>
      {context?.originalQuestion && <blockquote>{context.originalQuestion}</blockquote>}
      {context?.relatedChatGroups.map(g => <p key={g.groupId}>Nhóm tương đương do admin liên kết: {g.question}</p>)}
      <p>Chọn một đoạn nguồn đã xác nhận bên dưới. Giữ nguyên phần kiến thức trong đáp án trung tính và bốn lời đáp; có thể thêm lời dẫn. Chỉ lưu đề xuất, chưa tạo Draft hoặc phê duyệt.</p>
      {manual.evidence.map(e => <label key={e.chunkId}>Trích dẫn nguyên văn<textarea value={e.quote} maxLength={6000} rows={4} disabled={busy || !!requestId} onChange={event => setManual({ ...manual, evidence: [{ ...e, quote: event.target.value }] })} /></label>)}
      <ProposalFields value={manual} onChange={setManual} notes={manualNotes} onNotes={setManualNotes} disabled={busy || !!requestId} />
      <button className="btn btn-primary" disabled={busy || !context || !manual.evidence.length || !!manualSaved} onClick={() => void perform(async () => {
        const token = attemptId.current || crypto.randomUUID(); attemptId.current = token; setRequestId(token);
        const evidence = manual.evidence[0];
        const data = await api<{ proposalId: string }>('manual', { requestId: token, sourceId: evidence.sourceId, chunkId: evidence.chunkId, content: manual, notes: manualNotes, ...(groupId ? { groupId } : {}) });
        setManualSaved(data.proposalId); await openProposal(data.proposalId); setMessage('Đã lưu đề xuất thủ công. Đối chiếu bên dưới trước khi chuyển thành Draft.');
      })}>{requestId ? 'Kiểm tra lại cùng đề xuất' : 'Lưu đề xuất thủ công'}</button>
      {requestId && !manualSaved && <button className="btn" disabled={busy} onClick={() => { attemptId.current = null; setRequestId(null); }}>Sửa nội dung / chuẩn bị lượt lưu mới</button>}
    </section>}
    {mode !== 'proposals' && <section className="card"><h2>Danh sách tài liệu</h2>{!sources.length && <p>Chưa có tài liệu ở trang này. Thêm tài liệu tại mục Tài liệu nguồn.</p>}{sources.map(s => <div className="generation-source-row" key={s._id}><div><strong>{s.title}</strong><p>{s.chunkCount} đoạn · {s.sourceStatus === 'confirmed' ? 'Đã xác nhận nguồn' : 'Chưa xác nhận nguồn'}</p></div><button className="btn" disabled={busy || !!requestId} onClick={() => void perform(() => openSource(s._id))}>{mode === 'sources' ? 'Đọc & xác nhận' : 'Chọn đoạn trích'}</button></div>)}</section>}
    {mode !== 'proposals' && packs.map(pack => <section className="card" key={pack.source._id}><h2>{pack.source.title}</h2><p className="knowledge-muted">{pack.source.chunkCount} đoạn · Giữ nguyên thứ tự trong tài liệu.</p>
      <div className="generation-chunks">{pack.chunks.map(chunk => <article key={chunk._id}><div className="generation-source-row"><strong>{chunk.section} · Đoạn {chunk.paragraphIndex + 1}{chunk.page ? ` · Trang ${chunk.page}` : ''}</strong>{mode === 'generate' && <label><input type="checkbox" checked={selected.includes(chunk._id)} disabled={busy || !!requestId || pack.source.sourceStatus !== 'confirmed'} onChange={e => { setConfirmGeneration(false); setSelected(current => e.target.checked ? [...current, chunk._id] : current.filter(v => v !== chunk._id)); }} /> Chọn đoạn</label>}{mode === 'manual' && <button className="btn" disabled={busy || !!requestId || pack.source.sourceStatus !== 'confirmed'} onClick={() => setManual({ ...manual, evidence: [{ sourceId: pack.source._id, chunkId: chunk._id, quote: chunk.text, start: 0, end: chunk.text.length }] })}>Dùng đoạn làm evidence</button>}</div><p className="knowledge-text">{chunk.text}</p></article>)}</div>
      {mode === 'sources' && pack.source.sourceStatus === 'pending' && <button className="btn btn-primary" disabled={busy} onClick={() => void perform(async () => { await api(`sources/${pack.source._id}`, { confirmed: true }, 'PATCH'); await openSource(pack.source._id); setRefresh(n => n + 1); setMessage('Đã ghi nhận bạn xác nhận nguồn hợp lệ. Các câu hỏi vẫn cần duyệt riêng.'); })}>Tôi đã đọc và xác nhận tài liệu hợp lệ</button>}
    </section>)}
    {mode === 'proposals' && <section className="card"><h2>Đề xuất gần đây</h2>{!proposals.length && <p>Chưa có đề xuất ở trang này.</p>}{proposals.map(p => <article className="generation-source-row" key={p._id}><div><strong>{p.content?.canonicalQuestion || p.originalQuestion || 'Lượt tạo từ tài liệu'}</strong><p>{labels[p.generationStatus]} · {p.generationModel}{p.errorCode ? ` · ${p.errorCode}` : ''}</p>{p.generationStatus === 'generating' && <small>Nếu trạng thái kéo dài, kiểm tra server trước khi tạo lượt mới. Hệ thống không tự gọi lại AI.</small>}</div><button className="btn" disabled={busy} onClick={() => void perform(() => openProposal(p._id))}>Xem đề xuất</button></article>)}</section>}
    <nav className="btn-row" aria-label="Phân trang"><button className="btn" disabled={busy || page === 1} onClick={() => setPage(p => p - 1)}>Trang trước</button><span>Trang {page}</span><button className="btn" disabled={busy || (mode === 'proposals' ? proposals : sources).length < 20} onClick={() => setPage(p => p + 1)}>Trang sau</button><button className="btn" disabled={busy} onClick={() => setRefresh(n => n + 1)}>Làm mới</button></nav>
    {detail && <section className="card generation-editor"><div className="knowledge-heading"><h2>Đối chiếu & biên tập</h2><button className="btn" disabled={busy} onClick={() => setDetail(null)}>Đóng</button></div>
      <p>{labels[detail.proposal.generationStatus]} · Lời thoại mô phỏng giáo dục, không phải phát ngôn nguyên văn.</p>
      {detail.proposal.originalChatGroupId && <details><summary>Nguồn câu hỏi từ hội thoại</summary><blockquote>{detail.proposal.originalQuestion}</blockquote><p>Mã nhóm: <code className="knowledge-hash">{detail.proposal.originalChatGroupId}</code></p>{detail.proposal.relatedChatGroups?.map(g => <p key={g.groupId}>{g.question} · {g.groupId}</p>)}<Link href="/admin/chat-questions">Rà soát lịch sử chat</Link><p>Lịch sử chi tiết có thời hạn lưu; đề xuất giữ câu hỏi đã lọc thông tin nhạy cảm.</p></details>}
      {detail.proposal.draftId && <Link className="btn btn-primary" href={`/admin/knowledge/${detail.proposal.draftId}?revision=${detail.proposal.revisionId}`}>Mở bản nháp để kiểm duyệt →</Link>}
      {detail.sources.map(pack => <details key={pack.source._id} open><summary>{pack.source.title} · {pack.source.sourceStatus === 'confirmed' ? 'Nguồn đã xác nhận' : 'Cần xác nhận nguồn'}</summary>{pack.chunks.filter(c => !edit || edit.evidence.some(e => e.chunkId === c._id)).map(c => <blockquote key={c._id}><strong>{c.section} · Đoạn {c.paragraphIndex + 1}</strong><p className="knowledge-text">{c.text}</p></blockquote>)}</details>)}
      {edit && <><ul className="knowledge-notice">{edit.warnings.map((w,i) => <li key={i}>{w}</li>)}</ul>
        {edit.evidence.map((e,i) => <label key={i}>Trích dẫn nguyên văn (vị trí {e.start}–{e.end})<textarea rows={4} value={e.quote} disabled={!editable || busy} onChange={event => setEdit({ ...edit, evidence: edit.evidence.map((v,j) => j === i ? { ...v, quote: event.target.value } : v) })} /></label>)}
        <ProposalFields value={edit} onChange={setEdit} notes={notes} onNotes={setNotes} disabled={!editable || busy} />
        {editable && <button className="btn" disabled={busy} onClick={() => void perform(async () => { await api(`proposals/${detail.proposal._id}`, { action: 'edit', version: detail.proposal.version, content: { ...edit, insufficientEvidence: false }, notes }, 'PATCH'); await openProposal(detail.proposal._id); setMessage('Đã lưu biên tập và kiểm chứng lại trích dẫn.'); })}>Lưu biên tập & kiểm tra lại</button>}
      </>}
      {detail.duplicates.length > 0 && <section className="knowledge-notice"><h3>Câu hỏi cần so sánh</h3>{detail.duplicates.map((d,i) => <p key={i}><strong>{d.kind === 'exact_duplicate' ? 'Trùng chính xác' : 'Có thể trùng'}</strong>: {d.question} · {d.id}{d.revisionId ? <> · <Link href={`/admin/knowledge/${d.id}?revision=${d.revisionId}`}>Xem lời đáp hiện hữu</Link> <button className="btn" disabled={!editable || busy} onClick={() => setTargetId(d.id)}>Tạo revision cho câu này</button></> : <button className="btn" disabled={busy} onClick={() => void perform(() => openProposal(d.id.replace('proposal:', '')))}>Xem đề xuất hiện hữu</button>}</p>)}</section>}
      {editable && <><p>Lưu biên tập trước khi tạo Draft. Thao tác bên dưới dùng bản đã lưu trên server.</p><label>Mã câu hỏi hiện hữu để tạo revision mới (để trống nếu là câu mới)<input value={targetId} maxLength={30} onChange={e => setTargetId(e.target.value)} placeholder="cmtt45-q001" /></label>
        <label className="generation-check"><input type="checkbox" checked={duplicateReviewed} onChange={e => setDuplicateReviewed(e.target.checked)} /> Tôi đã so sánh và quyết định cách xử lý câu hỏi trùng.</label>
        <label className="generation-check"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} /> Tôi đã đối chiếu evidence, các dữ kiện và đủ bốn lời đáp. Đây chỉ là tạo bản nháp, chưa phê duyệt.</label>
        {dirty && <p role="status">Nội dung đang sửa chưa được lưu. Hãy lưu biên tập trước khi tạo Draft.</p>}
        <button className="btn btn-primary" disabled={busy || !!dirty || !reviewed || detail.proposal.generationStatus !== 'ready_for_review'} onClick={() => void perform(async () => { await api(`proposals/${detail.proposal._id}`, { version: detail.proposal.version, targetId: targetId.trim() || undefined, reviewedEvidence: reviewed, reviewedPersonas: reviewed, duplicateDecision: duplicateReviewed ? 'reviewed' : undefined }); await openProposal(detail.proposal._id); setRefresh(n => n + 1); setMessage('Đã tạo Draft. Hãy mở bản nháp để gửi duyệt theo quy trình hiện có.'); })}>Lưu thành Draft</button></>}
      {['ready_for_review','insufficient_evidence','failed','generating'].includes(detail.proposal.generationStatus) && <><button className="btn" disabled={busy} onClick={() => void perform(async () => { await api(`proposals/${detail.proposal._id}`, { action: 'discard', version: detail.proposal.version }, 'PATCH'); await openProposal(detail.proposal._id); setRefresh(n => n + 1); })}>Bỏ qua đề xuất</button>{detail.proposal.generationStatus === 'generating' && <small>Chỉ có thể bỏ qua lượt tạo bị gián đoạn sau 5 phút. Không tự hoàn lại hạn mức hoặc gọi lại AI.</small>}</>}
    </section>}
  </div>;
}
