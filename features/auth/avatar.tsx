"use client";

import { DEFAULT_AVATAR } from "@/server/domain/auth";

export default function Avatar({ src, className = "", alt = "Ảnh đại diện" }: { src?: string; className?: string; alt?: string }) {
  // User images live on R2; a local fallback also covers old accounts and broken URLs.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`user-avatar ${className}`} src={src || DEFAULT_AVATAR} alt={alt} width={80} height={80} onError={event => {
    if (event.currentTarget.getAttribute("src") !== DEFAULT_AVATAR) event.currentTarget.src = DEFAULT_AVATAR;
  }} />;
}
