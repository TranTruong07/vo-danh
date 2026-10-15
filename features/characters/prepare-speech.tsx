"use client";
import { useEffect, useRef, useState } from "react";
import { prepareSpeechAction, speechPlanAction } from "@/actions/speech";
export default function PrepareSpeech({ characterId, voiceName }: { characterId: string; voiceName: string }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const cancel = useRef(false), running = useRef(false);
  useEffect(() => () => { cancel.current = true; }, []);
  async function prepare() {
    if (running.current) return;
    running.current = true; cancel.current = false; setBusy(true); setMessage(""); setProgress({ completed: 0, total: 0 });
    try {
      const result = await speechPlanAction(characterId);
      if (!result.ok) throw new Error(result.message);
      if (!result.data.configured) throw new Error("Chưa cấu hình Google Cloud TTS hoặc R2. Bổ sung cấu hình theo .env.tts.example rồi khởi động lại máy chủ.");
      const tasks = result.data.tasks;
      for (let index = 0; index < tasks.length; index++) {
        if (cancel.current) { setMessage("Đã dừng. Các đoạn đã tạo được giữ lại để tiếp tục lần sau."); return; }
        setProgress({ completed: index, total: tasks.length });
        setMessage(index === 0 ? "Đang chuẩn bị câu nói mở đầu…" : `Đang chuẩn bị câu hỏi ${index}/${tasks.length - 1}, các đáp án và phản hồi…`);
        const task = tasks[index];
        const saved = await prepareSpeechAction(characterId, task.questionId, task.revision);
        if (!saved.ok) throw new Error(saved.message);
        setProgress({ completed: index + 1, total: tasks.length });
      }
      setMessage("Đã chuẩn bị xong âm thanh. Mở trang chơi khi có mạng để tải âm thanh cho chế độ offline.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không tạo được âm thanh. Hãy thử lại."); }
    finally { running.current = false; setBusy(false); }
  }
  return <section className="card character-speech">
    <h2>Âm thanh nhân vật</h2><p>Giọng đọc: <strong>{voiceName}</strong></p>
    <p>Chuẩn bị lời mở đầu, câu hỏi, bốn đáp án và phản hồi đúng/sai. Sau khi sửa nội dung hoặc đổi giọng, bấm cập nhật; các đoạn đã có sẽ được tái sử dụng.</p>
    <div className="btn-row"><button className="btn primary" onClick={prepare} disabled={busy}>{busy ? "Đang tạo âm thanh…" : "Tạo / cập nhật âm thanh"}</button>{busy && <button className="btn" onClick={() => { cancel.current = true; }}>Dừng sau đoạn hiện tại</button>}</div>
    {!!progress.total && <progress aria-label="Tiến độ tạo âm thanh" max={progress.total} value={progress.completed} />}
    <p role="status">{message}</p>
  </section>;
}
