"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCharacterAction } from "@/actions/characters";

export default function DeleteCharacterButton({ id, name, returnToList = false }: { id: string; name: string; returnToList?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  function remove() {
    setMessage("");
    startTransition(async () => {
      try {
        const result = await deleteCharacterAction(id);
        if (!result.ok) { setMessage(result.message); return; }
        dialog.current?.close();
        if (returnToList) router.replace("/admin/characters?deleted=1");
        else router.refresh();
      } catch { setMessage("Không thể xóa. Vui lòng thử lại."); }
    });
  }
  return <>
    <button type="button" className="btn danger" onClick={() => { setMessage(""); dialog.current?.showModal(); }}>Xóa</button>
    <dialog className="character-delete-dialog" ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => { if (pending) event.preventDefault(); }}>
      <h2 id={titleId}>Xóa nhân vật?</h2>
      <p id={descriptionId}>Bạn muốn xóa <strong>{name}</strong>? Thao tác này không thể hoàn tác. Mã QR của nhân vật sẽ ngừng hoạt động.</p>
      {message && <p className="msg error" role="alert">{message}</p>}
      <div className="btn-row"><button className="btn" disabled={pending} onClick={() => dialog.current?.close()} autoFocus>Hủy</button><button className="btn danger" disabled={pending} onClick={remove}>{pending ? "Đang xóa…" : "Xác nhận xóa"}</button></div>
    </dialog>
  </>;
}
