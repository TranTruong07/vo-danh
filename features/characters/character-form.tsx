"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCharacterAction } from "@/actions/characters";
import type { CharacterRecord } from "@/server/domain/character";
import { IMAGE_CONTENT_TYPES, MAX_IMAGE_BYTES, MAX_IMAGE_LABEL } from "@/server/domain/image";
import CharacterImageField from "./character-image-field";
import VoicePicker from "./voice-picker";

export default function CharacterForm({ character: editing = null }: { character?: CharacterRecord | null }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const cancelHref = editing ? `/admin/characters/${editing.id}` : "/admin/characters";
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    for (const field of ["image", "backgroundImage"] as const) {
      const imageFile = form.get(`${field}File`);
      if (imageFile instanceof File && imageFile.size && (imageFile.size > MAX_IMAGE_BYTES || !IMAGE_CONTENT_TYPES.includes(imageFile.type))) {
        setMessage(`Chọn ảnh PNG, JPEG hoặc WebP không quá ${MAX_IMAGE_LABEL} cho mỗi ảnh.`); return;
      }
      if (!form.get(field) && editing?.[field]) form.set(field, "__keep__");
    }
    setMessage("");
    startTransition(async () => {
      try {
        const result = await saveCharacterAction(editing?.id ?? null, form);
        if (!result.ok) { setMessage(result.message); return; }
        router.push(`/admin/characters/${result.data.id}?saved=1`);
      } catch { setMessage("Không thể kết nối. Vui lòng thử lại."); }
    });
  }
  return (
    <section className="card character-editor" aria-label="Thông tin nhân vật">
      <h2>Thông tin nhân vật</h2>
      <p className="subtitle">Thiết lập lời chào và hình ảnh hiển thị khi người chơi quét mã QR của nhân vật.</p>
      <form onSubmit={save}>
        <fieldset disabled={pending}>
          <label>Tên nhân vật<input name="name" required minLength={2} maxLength={120} defaultValue={editing?.name} /></label>
          <label><span id="character-opening-label">Câu nói mở đầu</span><textarea name="openingLine" aria-labelledby="character-opening-label" required maxLength={1000} rows={3} defaultValue={editing?.openingLine} placeholder="Lời chào nhân vật dành cho người chơi khi quét QR…" /></label>
          <div className="character-fields">
            <CharacterImageField field="backgroundImage" label="Ảnh nền" current={editing?.backgroundImage} />
            <CharacterImageField field="image" label="Ảnh nhân vật" current={editing?.image} />
          </div>
          <VoicePicker initialValue={editing?.voiceName} />
          <div className="btn-row"><button className="btn primary" type="submit">{pending ? "Đang lưu…" : "Lưu nhân vật"}</button><button type="button" className="btn" onClick={() => router.push(cancelHref)}>Hủy</button></div>
        </fieldset>
      </form>
      {message && <p className="msg error" role="alert">{message}</p>}
    </section>
  );
}
