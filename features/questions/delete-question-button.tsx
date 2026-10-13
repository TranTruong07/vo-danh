"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteQuestionAction } from "@/actions/character-questions";

export default function DeleteQuestionButton({ id, question }: { id: string; question: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  function remove() {
    startTransition(async () => {
      try {
        const result = await deleteQuestionAction(id);
        if (!result.ok) { setMessage(result.message); return; }
        dialog.current?.close(); router.refresh();
      } catch { setMessage("Không thể xóa câu hỏi. Vui lòng thử lại."); }
    });
  }
  return <><button className="btn danger" onClick={() => { setMessage(""); dialog.current?.showModal(); }}>Xóa</button>
    <dialog ref={dialog} className="question-delete-dialog" aria-labelledby={heading} onCancel={event => { if (pending) event.preventDefault(); }}>
      <h2 id={heading}>Xóa câu hỏi?</h2><p>{question}</p><p>Câu hỏi này sẽ không xuất hiện trong các lượt chơi mới. Không thể hoàn tác thao tác xóa.</p>
      {message && <p className="msg error" role="alert">{message}</p>}
      <div className="btn-row"><button className="btn" disabled={pending} onClick={() => dialog.current?.close()} autoFocus>Hủy</button><button className="btn danger" disabled={pending} onClick={remove}>{pending ? "Đang xóa…" : "Xác nhận xóa"}</button></div>
    </dialog></>;
}
