"use client";

import { useEffect, useState } from "react";
import { MAX_IMAGE_LABEL } from "@/server/domain/image";

export default function CharacterImageField({ field, label, current }: { field: "image" | "backgroundImage"; label: string; current?: string }) {
  const [url, setUrl] = useState(current?.startsWith("https:") ? current : "");
  const [preview, setPreview] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const source = preview || (/^https:\/\//.test(url) ? url : current);
  return <div className={`character-image-field ${field}`}>
    <h3>{label}</h3>
    <div className="character-image-preview">{source ?
      // eslint-disable-next-line @next/next/no-img-element
      <img src={source} alt={`Xem trước ${label.toLowerCase()}`} referrerPolicy="no-referrer" /> : <span>Chưa chọn {label.toLowerCase()}</span>}</div>
    <label>{label} — URL HTTPS<input name={field} type="url" value={url} onChange={event => setUrl(event.target.value)} maxLength={2000} placeholder={current ? "Để trống để giữ ảnh hiện tại" : "https://..."} /></label>
    <label>{label} — tải lên R2<input name={`${field}File`} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file = event.target.files?.[0]; setPreview(file ? URL.createObjectURL(file) : ""); }} /><small>PNG, JPEG, WebP · tối đa {MAX_IMAGE_LABEL} mỗi ảnh. Ảnh tải lên được ưu tiên hơn URL.</small></label>
  </div>;
}
