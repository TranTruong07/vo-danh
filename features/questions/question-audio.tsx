"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SEGMENT_LABELS, type AudioSegment, type AudioStatus, type AudioOverallStatus, type QuizAudioView } from "@/server/domain/quiz-audio";

const labels: Record<AudioStatus | AudioOverallStatus, string> = {
  missing: "Chưa tạo", generating: "Đang xử lý", ready: "Sẵn sàng", failed: "Tạo lỗi", stale: "Cần cập nhật", unavailable: "Nội dung trống",
  no_audio: "Chưa có âm thanh", partial: "Đã có một phần", outdated: "Âm thanh cần cập nhật",
};
export default function QuestionAudio({ questionId, dirty = false }: { questionId?: string; dirty?: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<QuizAudioView | null>(null), [voice, setVoice] = useState("");
  const [loading, setLoading] = useState(false), [working, setWorking] = useState(false), [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<AudioSegment[] | null>(null), [refresh, setRefresh] = useState(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false), [deleting, setDeleting] = useState(false), [notice, setNotice] = useState("");
  const sending = useRef(false), selection = useRef(0);
  useEffect(() => {
    if (!questionId) return;
    const abort = new AbortController(), version = ++selection.current;
    void (async () => {
      setLoading(true); setError(""); setConfirmation(null); setDeleteConfirmation(false);
      try {
        const response = await fetch(`/api/admin/quiz-questions/${questionId}/audio${voice ? `?voiceId=${encodeURIComponent(voice)}` : ""}`, { cache: "no-store", signal: abort.signal });
        const value = await response.json();
        if (!response.ok) throw new Error(value.message || "Không tải được trạng thái âm thanh.");
        if (selection.current === version) setData(value);
      } catch (cause) { if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : "Không kết nối được. Hãy thử cập nhật trạng thái."); }
      finally { if (!abort.signal.aborted) setLoading(false); }
    })();
    return () => { abort.abort(); selection.current = version + 1; };
  }, [questionId, voice, refresh]);
  const disabled = dirty || loading || working || deleting || !!error || !data?.canGenerate || data.busy;
  const deleteDisabled = dirty || loading || working || deleting || !data || data.busy;
  const missing = data?.segments.filter(segment => segment.status !== "ready" && segment.status !== "unavailable" && segment.status !== "generating").slice(0, data.maxFiles).map(segment => segment.segmentType) || [];
  const cost = confirmation?.reduce((count, segment) => count + (data?.segments.find(item => item.segmentType === segment)?.characters || 0), 0) || 0;
  async function generate() {
    if (sending.current || disabled || !confirmation?.length || !data) return;
    sending.current = true; setWorking(true); setError(""); setNotice(""); setDeleteConfirmation(false);
    const version = selection.current;
    try {
      // One segment per request avoids a 7×60s route timeout. Never submit the next
      // segment after navigation, a failure, or a previous request still in flight.
      for (const segment of confirmation) {
        if (selection.current !== version) break;
        const response = await fetch(`/api/admin/quiz-questions/${questionId}/audio/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ segments: [segment], voiceId: voice || data.voiceId, confirmed: true }) });
        const value: QuizAudioView & { message?: string } = await response.json();
        if (!response.ok) throw new Error(value.message || "Không tạo được MP3.");
        if (selection.current === version) setData(value);
        if (value.segments.find(item => item.segmentType === segment)?.status !== "ready") break;
      }
    } catch (cause) {
      if (selection.current === version) setError(cause instanceof Error ? cause.message : "Kết nối bị gián đoạn. Cập nhật trạng thái trước khi thử lại; máy chủ có thể vẫn đang xử lý.");
    } finally { sending.current = false; setWorking(false); setConfirmation(null); }
  }
  async function removeAudio() {
    if (sending.current || deleteDisabled || !deleteConfirmation) return;
    sending.current = true; setDeleting(true); setError(""); setNotice(""); setConfirmation(null);
    const version = selection.current;
    try {
      const response = await fetch(`/api/admin/quiz-questions/${questionId}/audio`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true }) });
      const value: QuizAudioView & { message?: string } = await response.json();
      if (!response.ok) throw new Error(value.message || "Không xóa được audio.");
      if (selection.current === version) { setData(value); setNotice("Đã xóa audio. Bạn có thể chọn giọng và tạo các MP3 mới."); router.refresh(); }
    } catch (cause) {
      if (selection.current === version) setError(cause instanceof Error ? cause.message : "Kết nối bị gián đoạn. Cập nhật trạng thái trước khi thử xóa lại.");
    } finally { sending.current = false; setDeleting(false); setDeleteConfirmation(false); }
  }
  return <section className="card question-audio" data-question-audio aria-busy={loading || working || deleting}>
    <div className="question-step"><span>4</span><div><h2>Âm thanh câu hỏi</h2><p>Tạo và nghe thử MP3 từ nội dung câu hỏi đã lưu.</p></div></div>
    {!questionId ? <p>Lưu câu hỏi trước để thiết lập âm thanh.</p> : <>
      {dirty && <p className="msg">Có thay đổi chưa lưu. Hãy lưu và mở lại câu hỏi trước khi tạo MP3.</p>}
      <div className="question-audio-toolbar"><label>Giọng đọc TTSForFree<select value={voice || data?.voiceId || ""} disabled={working || deleting || loading || !data?.voices.length} onChange={event => setVoice(event.target.value)}>{!data?.voices.length && <option value="">Chưa cấu hình giọng đọc</option>}{data?.voices.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <button className="btn" type="button" disabled={loading || working || deleting} onClick={() => setRefresh(value => value + 1)}>Cập nhật trạng thái</button>
      </div>
      {loading && <p role="status">Đang tải trạng thái âm thanh…</p>}
      {working && <p role="status">Đang tạo và lưu MP3. Vui lòng giữ trang này mở; không bấm gửi lại.</p>}
      {deleting && <p role="status">Đang xóa audio. Vui lòng chờ…</p>}
      {notice && <p role="status">{notice}</p>}
      {error && <p className="msg error" role="alert">{error}</p>}
      {data && <>
        <p className="question-audio-summary" role="status">{labels[data.status]}{data.voiceId && ` · ${data.voices.find(item => item.id === (voice || data.voiceId))?.label || "Giọng đã lưu"}`}</p>
        {data.reason && <p className="msg">{data.reason}</p>}
        {data.busy && <p className="msg">Một lượt tạo âm thanh đang chạy. Chờ rồi cập nhật trạng thái.</p>}
        <ul className="question-audio-list">{data.segments.map(segment => <li key={segment.segmentType} data-segment={segment.segmentType}>
          <div><strong>{SEGMENT_LABELS[segment.segmentType]}</strong><span className={`audio-state audio-state-${segment.status}`}>{labels[segment.status]}</span><small>{segment.characters} ký tự</small></div>
          {segment.lastError && <p className="msg error">{segment.lastError}</p>}
          {!deleting && segment.status === "ready" && segment.url && <AudioPreview url={segment.url} label={SEGMENT_LABELS[segment.segmentType]} />}
          {segment.status !== "ready" && <button type="button" className="btn" disabled={disabled || segment.status === "unavailable" || segment.status === "generating"} onClick={() => setConfirmation([segment.segmentType])}>{segment.status === "stale" ? "Cập nhật MP3" : segment.status === "failed" ? "Tạo lại / tiếp tục" : "Tạo MP3"}</button>}
        </li>)}</ul>
        <div className="btn-row"><button type="button" className="btn primary" disabled={disabled || !missing.length} onClick={() => { setDeleteConfirmation(false); setConfirmation(missing); }}>Tạo các MP3 còn thiếu</button>
          <button type="button" className="btn danger" disabled={deleteDisabled || !data.segments.some(segment => !["missing", "unavailable"].includes(segment.status))} onClick={() => { setConfirmation(null); setDeleteConfirmation(true); }}>Xóa toàn bộ audio</button></div>
        {deleteConfirmation && !dirty && <div className="question-audio-confirm" role="group" aria-label="Xác nhận xóa audio">
          <p>Xóa các file audio hiện tại của câu hỏi này khỏi R2 và đặt lại trạng thái để tạo mới? Nội dung câu hỏi và đáp án được giữ nguyên. Bản offline trên thiết bị sẽ cập nhật khi đồng bộ lại. Tạo MP3 mới có thể dùng credits của dịch vụ.</p>
          <div className="btn-row"><button type="button" className="btn danger" disabled={deleteDisabled} onClick={removeAudio}>Xác nhận xóa audio</button><button type="button" className="btn" disabled={deleting} onClick={() => setDeleteConfirmation(false)}>Hủy</button></div>
        </div>}
        {confirmation && !dirty && <div className="question-audio-confirm" role="group" aria-label="Xác nhận tạo MP3">
          <p>Tạo {confirmation.length} MP3 với giọng {data.voices.find(item => item.id === (voice || data.voiceId))?.label}? Tối đa khoảng <strong>{cost} ký tự</strong> gửi TTSForFree từ nội dung đã lưu, sau đó lưu file vào R2. Dịch vụ có thể trừ credits. Đoạn đã sẵn sàng và job đang chờ sẽ không tạo lại; job đã kết thúc với lỗi sẽ được tạo mới khi bạn xác nhận.</p>
          <div><button className="btn primary" type="button" disabled={disabled} onClick={generate}>Xác nhận tạo MP3</button><button className="btn" type="button" disabled={working} onClick={() => setConfirmation(null)}>Hủy tạo</button></div>
        </div>}
      </>}
    </>}
  </section>;
}

function AudioPreview({ url, label }: { url: string; label: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return <>
    <audio controls preload="none" src={url} aria-label={`Nghe ${label}`} onError={() => setFailedUrl(url)} onCanPlay={() => setFailedUrl(null)} />
    {failedUrl === url && <p className="msg error" role="alert">Không phát được file. Kiểm tra kết nối hoặc thời hạn URL; hệ thống không tự gọi lại API tạo âm thanh.</p>}
  </>;
}
