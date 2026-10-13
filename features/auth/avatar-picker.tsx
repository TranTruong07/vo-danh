"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DEFAULT_AVATAR } from "@/server/domain/auth";
import { IMAGE_CONTENT_TYPES, MAX_IMAGE_BYTES } from "@/server/domain/image";
import Avatar from "./avatar";

export default function AvatarPicker({ initialUrl = DEFAULT_AVATAR }: { initialUrl?: string }) {
  const id = useId(), input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [removed, setRemoved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return <div className="avatar-picker">
    <Avatar src={file ? preview || initialUrl : removed ? DEFAULT_AVATAR : initialUrl} />
    <div className="avatar-picker-fields">
      <label htmlFor={id}>Ảnh đại diện <span>(không bắt buộc)</span></label>
      <input ref={input} id={id} name="avatarFile" type="file" accept={IMAGE_CONTENT_TYPES.join(",")} aria-describedby={`${id}-help`} onChange={event => {
        const chosen = event.target.files?.[0];
        setError("");
        if (chosen && (!IMAGE_CONTENT_TYPES.includes(chosen.type) || !chosen.size || chosen.size > MAX_IMAGE_BYTES)) {
          setError("Chọn ảnh PNG, JPEG hoặc WebP, tối đa 3 MB."); event.target.value = ""; setFile(null); return;
        }
        setFile(chosen ?? null); setPreview(chosen ? URL.createObjectURL(chosen) : ""); setRemoved(false);
      }} />
      <p id={`${id}-help`}>PNG, JPEG, WebP · Tối đa 3 MB. {initialUrl === DEFAULT_AVATAR ? "Bỏ trống để dùng ảnh mặc định." : "Không chọn ảnh mới để giữ ảnh hiện tại."}</p>
      {(file || (!removed && initialUrl !== DEFAULT_AVATAR)) && <button className="auth-text-button" type="button" onClick={() => { if (input.current) input.current.value = ""; setFile(null); setRemoved(true); setError(""); }}>Dùng ảnh mặc định</button>}
      <input type="hidden" name="removeAvatar" value={removed ? "true" : "false"} />
      {error && <p className="auth-field-error" role="alert">{error}</p>}
    </div>
  </div>;
}
