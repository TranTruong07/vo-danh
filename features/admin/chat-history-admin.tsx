'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { KNOWLEDGE_CHARACTER_LABELS } from '@/server/domain/knowledge-admin';
import { CHAT_REVIEW_STATUSES, type ChatAnalytics, type ChatGroupDetail, type ChatQuestionGroup, type ChatReviewStatus } from '@/server/domain/chat-history';
import './chat-history-admin.css';

const statuses: Record<ChatReviewStatus, string> = { new: 'Mới', reviewing: 'Đang xem xét', linked_existing: 'Đã liên kết kiến thức', needs_knowledge: 'Cần bổ sung kiến thức', dismissed: 'Bỏ qua', resolved: 'Đã xử lý' };
const sources: Record<string, string> = { exact_match: 'Trùng câu hỏi', alias_match: 'Trùng cách hỏi khác', gemini_match: 'Gemini gợi ý', cache_hit: 'Kết quả từ cache', local_fallback: 'Gợi ý nội bộ', clarify: 'Cần làm rõ', out_of_scope: 'Ngoài phạm vi', provider_unavailable: 'Dịch vụ tạm gián đoạn', quota_exceeded: 'Hết hạn mức', starter: 'Gợi ý mở đầu' };
const reviewReasons = { no_candidate: 'Chưa có ứng viên phù hợp', clarify: 'Cần người chơi làm rõ', provider_unavailable: 'Dịch vụ tìm kiếm gián đoạn', out_of_scope: 'Ngoài phạm vi hiện có' };
type Detail = ChatGroupDetail & { published: { questionId: string; question: string }[] };
type List = { items: ChatQuestionGroup[]; total: number; page: number; pageSize: number };
const date = (value: Date) => new Date(value).toLocaleString('vi-VN');
const percent = (a: number, b: number) => b ? `${(100 * a / b).toFixed(1)}% (${a}/${b})` : 'Chưa có dữ liệu';
async function request<T>(url: string, body: unknown, method = 'POST', signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { method, credentials: 'same-origin', cache: 'no-store', signal,
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Chưa tải được dữ liệu. Hãy thử lại.');
  return data as T;
}
export default function ChatHistoryAdmin({ mode }: { mode: 'analytics' | 'questions' }) {
  const [filter, setFilter] = useState({ characterId: '', from: '', to: '', status: '', text: '' });
  const [counts, setCounts] = useState({ min: '', max: '' }), [appliedCounts, setAppliedCounts] = useState(counts);
  const [applied, setApplied] = useState(filter), [page, setPage] = useState(1);
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null), [list, setList] = useState<List | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false), [saving, setSaving] = useState(false), [refresh, setRefresh] = useState(0);
  const [edit, setEdit] = useState({ status: 'new' as ChatReviewStatus, note: '', linkedQuestionId: '', equivalentGroupId: '' });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const detailSequence = useRef(0), detailHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    const body = { ...applied, page, pageSize: 20,
      ...(mode === 'questions' && appliedCounts.min ? { minCount: Number(appliedCounts.min) } : {}),
      ...(mode === 'questions' && appliedCounts.max ? { maxCount: Number(appliedCounts.max) } : {}),
      from: applied.from ? `${applied.from}T00:00:00+07:00` : '',
      to: applied.to ? `${applied.to}T23:59:59.999+07:00` : '',
    };
    void (async () => {
      setBusy(true); setError('');
      try {
        if (mode === 'analytics') setAnalytics(await request('/api/admin/chat-analytics', body, 'POST', controller.signal));
        else setList(await request('/api/admin/chat-questions', body, 'POST', controller.signal));
      } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Lỗi kết nối.'); }
      finally { if (!controller.signal.aborted) setBusy(false); }
    })();
    return () => controller.abort();
  }, [applied, appliedCounts, page, mode, refresh]);
  const openDetail = useCallback(async (id: string, detailPage = 1) => {
    const seq = ++detailSequence.current;
    setError(''); setConfirmDelete(false);
    try {
      const result = await request<Detail>(`/api/admin/chat-questions/${id}`, { page: detailPage, pageSize: 20 });
      if (seq !== detailSequence.current) return;
      setDetail(result);
      const review = result.group.review;
      setEdit({ status: review?.status || 'new', note: review?.note || '', linkedQuestionId: review?.linkedQuestionId || '', equivalentGroupId: review?.equivalentGroupId || '' });
      requestAnimationFrame(() => detailHeading.current?.focus());
    } catch (cause) { if (seq === detailSequence.current) setError(cause instanceof Error ? cause.message : 'Lỗi kết nối.'); }
  }, []);
  async function saveReview() {
    if (!detail || saving) return;
    setSaving(true); setNotice(''); setError('');
    try {
      await request(`/api/admin/chat-questions/${detail.group._id}`, { ...edit, expectedVersion: detail.group.review?.version || 0 }, 'PATCH');
      setNotice('Đã lưu rà soát. Dữ liệu Published không thay đổi.');
      await openDetail(detail.group._id, detail.page); setRefresh(n => n + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa lưu được.'); }
    finally { setSaving(false); }
  }
  async function deleteHistory() {
    if (!detail || saving) return;
    setSaving(true); setError('');
    try {
      await request(`/api/admin/chat-questions/${detail.group._id}`, { confirm: 'DELETE_HISTORY' }, 'DELETE');
      setDetail(null); setConfirmDelete(false); setNotice('Đã xóa lịch sử của nhóm. Audit thao tác vẫn được giữ.'); setRefresh(n => n + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa xóa được.'); }
    finally { setSaving(false); }
  }
  function groups(items: ChatQuestionGroup[]) {
    return <div className="chat-review-list">{items.map(item => <article className="card" key={item._id}>
      <div className="knowledge-meta"><span>{KNOWLEDGE_CHARACTER_LABELS[item.characterId]}</span><span>{item.count} lượt hỏi</span><span>{statuses[item.review?.status || 'new']}</span></div>
      <button className="chat-review-question" onClick={() => void openDetail(item._id)}>{item.question}</button>
      <p className="knowledge-muted">{item.answered} đã trả lời · {item.unresolved} chưa giải đáp sau 10 phút · Gần nhất {date(item.lastAt)}</p>
      <button className="btn btn-outline" onClick={() => void openDetail(item._id)}>Xem chi tiết & rà soát</button>
    </article>)}</div>;
  }
  return <div className="knowledge-page chat-history-page">
    <div className="knowledge-heading"><div><p className="eyebrow">CHATBOT · QUẢN TRỊ</p><h1>{mode === 'analytics' ? 'Thống kê hội thoại' : 'Câu hỏi cần xem xét'}</h1><p className="knowledge-muted">Chỉ quản trị viên được xem. Nội dung nhạy cảm được lọc trước khi lưu.</p></div><Link className="btn btn-outline" href={mode === 'analytics' ? '/admin/chat-questions' : '/admin/chat-analytics'}>{mode === 'analytics' ? 'Rà soát câu hỏi' : 'Xem thống kê'}</Link></div>
    <form className="card chat-history-filters" onSubmit={event => { event.preventDefault(); setApplied({ ...filter }); setAppliedCounts({ ...counts }); setPage(1); }}>
      <label>Nhân vật<select value={filter.characterId} onChange={e => setFilter({ ...filter, characterId: e.target.value })}><option value="">Tất cả nhân vật</option>{Object.entries(KNOWLEDGE_CHARACTER_LABELS).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
      <label>Từ ngày<input type="date" value={filter.from} onChange={e => setFilter({ ...filter, from: e.target.value })} /></label>
      <label>Đến ngày<input type="date" value={filter.to} onChange={e => setFilter({ ...filter, to: e.target.value })} /></label>
      {mode === 'questions' && <><label>Trạng thái<select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}><option value="">Tất cả trạng thái</option>{CHAT_REVIEW_STATUSES.map(status => <option key={status} value={status}>{statuses[status]}</option>)}</select></label><label>Tìm nội dung<input maxLength={120} value={filter.text} onChange={e => setFilter({ ...filter, text: e.target.value })} placeholder="Nhập từ khóa…" /></label></>}
      {mode === 'questions' && <><label>Lượt hỏi tối thiểu<input type="number" min={1} max={1000000} value={counts.min} onChange={e => setCounts({ ...counts, min: e.target.value })} /></label><label>Lượt hỏi tối đa<input type="number" min={1} max={1000000} value={counts.max} onChange={e => setCounts({ ...counts, max: e.target.value })} /></label></>}
      <button className="btn btn-primary" disabled={busy}>Áp dụng bộ lọc</button><small>Mặc định 30 ngày gần nhất; tối đa 90 ngày mỗi lần xem. Giờ Việt Nam. Số lượt tính trong bộ lọc hiện tại.</small>
    </form>
    {busy && <p role="status">Đang tải dữ liệu hội thoại…</p>}
    {error && <p className="knowledge-error" role="alert">{error} <button className="btn btn-outline" onClick={() => setRefresh(n => n + 1)}>Tải lại</button></p>}
    {notice && <p className="knowledge-success" role="status">{notice}</p>}
    {mode === 'analytics' && analytics && <>
      <div className="knowledge-stats">{[['Lượt hỏi', analytics.totals.asks], ['Câu hỏi duy nhất', analytics.totals.unique], ['Lượt có gợi ý', analytics.totals.suggestions], ['Lượt chọn gợi ý', analytics.totals.selections], ['Đã được trả lời', analytics.totals.answered], ['Nhóm cần rà soát', analytics.totals.reviewGroups]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <section className="card"><h2>Từ câu hỏi đến lời đáp</h2><p>Tỷ lệ có gợi ý: <strong>{percent(analytics.totals.suggestions, analytics.totals.asks)}</strong></p><p>Tỷ lệ chọn gợi ý: <strong>{percent(analytics.totals.selections, analytics.totals.suggestions)}</strong></p><p className="knowledge-muted">Gợi ý chưa được chọn không được tính là đã trả lời. Các thẻ gợi ý mở đầu được lưu riêng, không tính vào lượt hỏi này. Số liệu chỉ trong thời gian lịch sử còn được lưu.</p></section>
      <div className="chat-history-columns"><section className="card"><h2>Lượt hỏi theo ngày</h2>{!analytics.days.length && <p>Chưa có lượt hỏi trong khoảng này.</p>}{analytics.days.map(day => <div className="chat-history-bar" key={day.day}><span>{day.day}</span><meter min={0} max={Math.max(...analytics.days.map(d => d.count), 1)} value={day.count} /><strong>{day.count}</strong></div>)}</section><section className="card"><h2>Kết quả matching</h2>{analytics.outcomes.map(item => <p key={item.source}>{sources[item.source] || item.source}: <strong>{item.count}</strong></p>)}</section></div>
      <h2>Câu hỏi phổ biến</h2>{groups(analytics.popular)}
    </>}
    {mode === 'questions' && list && <><p className="knowledge-muted">{list.total} nhóm · Nhóm mới chờ ít nhất 10 phút để người chơi có thời gian chọn gợi ý. Không tự kết luận cần thêm kiến thức.</p>{!list.items.length && <section className="card"><h2>Chưa có câu hỏi cần xem xét</h2><p>Thử thay đổi bộ lọc hoặc quay lại sau khi có hội thoại mới.</p></section>}{groups(list.items)}<nav className="btn-row" aria-label="Trang câu hỏi"><button className="btn btn-outline" disabled={page <= 1 || busy} onClick={() => setPage(p => p - 1)}>Trang trước</button><span>Trang {page} / {Math.max(1, Math.ceil(list.total / list.pageSize))}</span><button className="btn btn-outline" disabled={page * list.pageSize >= list.total || busy} onClick={() => setPage(p => p + 1)}>Trang sau</button></nav></>}
    {detail && <section className="card chat-history-detail" aria-labelledby="chat-review-title">
      <div className="knowledge-heading"><h2 id="chat-review-title" ref={detailHeading} tabIndex={-1}>Chi tiết & rà soát</h2><button className="btn btn-outline" disabled={saving} onClick={() => { ++detailSequence.current; setDetail(null); }}>Đóng chi tiết</button></div>
      <p className="knowledge-text">{detail.group.question}</p><p>{KNOWLEDGE_CHARACTER_LABELS[detail.group.characterId]} · {detail.group.count} lượt · {detail.group.answered} đã trả lời</p>
      <details className="chat-create-knowledge"><summary className="btn btn-primary">Tạo kiến thức từ câu hỏi này</summary><p>Chọn cách soạn kiến thức cho nhóm câu hỏi đang xem. Cả hai cách đều cần đối chiếu nguồn và qua quy trình kiểm duyệt.</p><div className="btn-row"><Link className="btn btn-primary" href={`/admin/knowledge/manual?groupId=${detail.group._id}`}>Nhập thủ công</Link><Link className="btn btn-outline" href={`/admin/knowledge/generate?groupId=${detail.group._id}`}>Gemini tạo từ tài liệu</Link></div></details>
      <p className="knowledge-muted">Nội dung đã được lọc thông tin nhạy cảm. Không có gợi ý phù hợp, cần làm rõ, lỗi dịch vụ, ngoài phạm vi hoặc không chọn gợi ý đều cần người quản trị phân biệt.</p>
      <details><summary>Mã nhóm để liên kết tương đương</summary><code className="knowledge-hash">{detail.group._id}</code></details>
      <form onSubmit={event => { event.preventDefault(); void saveReview(); }} className="chat-review-editor">
        <label>Trạng thái<select value={edit.status} disabled={saving} onChange={e => setEdit({ ...edit, status: e.target.value as ChatReviewStatus })}>{CHAT_REVIEW_STATUSES.map(status => <option key={status} value={status}>{statuses[status]}</option>)}</select></label>
        <label>Liên kết câu hỏi Published<select value={edit.linkedQuestionId} disabled={saving} onChange={e => setEdit({ ...edit, linkedQuestionId: e.target.value })}><option value="">Chưa liên kết</option>{detail.published.map(q => <option key={q.questionId} value={q.questionId}>{q.question}</option>)}</select></label>
        <label>Nhóm trùng / tương đương (quản trị viên xác nhận)<input maxLength={64} value={edit.equivalentGroupId} disabled={saving} onChange={e => setEdit({ ...edit, equivalentGroupId: e.target.value.trim() })} placeholder="Dán mã nhóm; dữ liệu không tự động gộp" /></label>
        <label>Ghi chú nội bộ<textarea maxLength={1000} rows={3} value={edit.note} disabled={saving} onChange={e => setEdit({ ...edit, note: e.target.value })} /></label>
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu rà soát'}</button>
      </form>
      <h3>Các lượt tương tác</h3><div className="chat-history-table"><table><thead><tr><th>Thời gian</th><th>Câu hỏi</th><th>Kết quả</th><th>Gợi ý / lựa chọn</th><th>Đáp án Published</th></tr></thead><tbody>{detail.interactions.map(item => <tr key={item._id}><td>{date(item.createdAt)}</td><td>{item.question}{item.redacted && <small> · Đã ẩn thông tin</small>}</td><td>{sources[item.matchingSource]}<br />{item.outcome === 'answered' ? 'Đã trả lời' : item.outcome === 'suggested' ? 'Gợi ý chưa được chọn' : 'Chưa giải đáp'}{item.reviewReason && <small> · {reviewReasons[item.reviewReason]}</small>}{item.providerFailure && <small> · {item.providerFailure}</small>}<small> · {item.latencyMs} ms</small></td><td>{item.suggestedQuestionIds.join(', ') || '—'}<br />Đã chọn: {item.selectedQuestionId || 'Chưa chọn'}</td><td>{item.publishedVersionId || 'Chưa trả lời'}</td></tr>)}</tbody></table></div>
      <div className="btn-row"><button className="btn btn-outline" disabled={detail.page <= 1 || saving} onClick={() => void openDetail(detail.group._id, detail.page - 1)}>Lượt trước</button><span>Trang {detail.page}</span><button className="btn btn-outline" disabled={detail.page * detail.pageSize >= detail.group.count || saving} onClick={() => void openDetail(detail.group._id, detail.page + 1)}>Lượt sau</button></div>
      <details><summary>Lịch sử rà soát (30 thao tác gần nhất)</summary><ul>{detail.audit.map(item => <li key={item._id}>{date(item.at)} · {item.actorId} · {item.action === 'review' ? `${statuses[item.from || 'new']} → ${statuses[item.to || 'new']}` : 'Xóa lịch sử'}</li>)}</ul></details>
      <div className="chat-history-delete">{!confirmDelete ? <button className="btn btn-outline" disabled={saving} onClick={() => setConfirmDelete(true)}>Xóa lịch sử nhóm này…</button> : <div role="alert"><p>Xóa tất cả lượt tương tác và ghi chú của nhóm này? Thao tác không ảnh hưởng kiến thức Published; audit xóa được giữ lại.</p><div className="btn-row"><button className="btn btn-danger" disabled={saving} onClick={() => void deleteHistory()}>Xác nhận xóa lịch sử</button><button className="btn btn-outline" disabled={saving} onClick={() => setConfirmDelete(false)}>Hủy</button></div></div>}</div>
    </section>}
  </div>;
}
