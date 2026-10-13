"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction, updateProfileAction } from "@/actions/profile";
import type { AuthResult, PublicUser } from "@/server/domain/auth";
import AvatarPicker from "./avatar-picker";

export default function ProfileForm({ user, passwordMode = false }: { user: PublicUser; passwordMode?: boolean }) {
  const [result, setResult] = useState<AuthResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [visible, setVisible] = useState(false);
  const [avatarRevision, setAvatarRevision] = useState(0);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  if (passwordMode && user.role === "admin") return <p className="profile-note">Tài khoản quản trị viên sử dụng mật khẩu được cấu hình bằng ADMIN_PASSWORD trong .env.local.</p>;
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setResult(null);
    startTransition(async () => {
      try {
        const response = await (passwordMode ? changePasswordAction(data) : updateProfileAction(data));
        setResult(response);
        if (response.ok) {
          if (passwordMode) form.current?.reset();
          else setAvatarRevision(value => value + 1);
          if (response.redirectTo) router.push(response.redirectTo);
        }
      } catch { setResult({ ok: false, message: "Không thể kết nối. Vui lòng thử lại." }); }
    });
  }
  return <form ref={form} className="profile-form" onSubmit={submit} aria-busy={pending}>
    <fieldset disabled={pending}>
      {passwordMode ? <>
        <p className="profile-note">Mật khẩu dài từ 6 đến 32 ký tự. Sau khi thay đổi, các phiên đăng nhập cũ sẽ được thu hồi.</p>
        <label htmlFor="current-password">Mật khẩu hiện tại</label><input id="current-password" name="currentPassword" type={visible ? "text" : "password"} required minLength={6} maxLength={32} autoComplete="current-password" />
        <label htmlFor="new-password">Mật khẩu mới</label><input id="new-password" name="password" type={visible ? "text" : "password"} required minLength={6} maxLength={32} autoComplete="new-password" />
        <label htmlFor="confirm-password">Xác nhận mật khẩu mới</label><input id="confirm-password" name="confirmPassword" type={visible ? "text" : "password"} required minLength={6} maxLength={32} autoComplete="new-password" />
        <label className="profile-show-password"><input type="checkbox" checked={visible} onChange={event => setVisible(event.target.checked)} />Hiển thị mật khẩu</label>
      </> : <>
        <AvatarPicker key={avatarRevision} initialUrl={result?.user?.avatarUrl ?? user.avatarUrl} />
        <label htmlFor="profile-email">Email đăng nhập</label><input id="profile-email" type="email" value={user.email} readOnly aria-describedby="profile-email-help" />
        <p id="profile-email-help" className="profile-note">Email được dùng để đăng nhập và khôi phục mật khẩu.</p>
        <label htmlFor="profile-name">Họ và tên</label><input id="profile-name" name="fullName" autoComplete="name" defaultValue={user.fullName} maxLength={100} placeholder="Nhập họ và tên" />
        <label htmlFor="profile-phone">Số điện thoại</label><input id="profile-phone" name="phone" type="tel" autoComplete="tel" defaultValue={user.phone} maxLength={20} placeholder="Nhập số điện thoại" />
        <label htmlFor="profile-address">Địa chỉ</label><textarea id="profile-address" name="address" autoComplete="street-address" defaultValue={user.address} maxLength={500} rows={3} placeholder="Nhập địa chỉ của bạn" />
      </>}
      <button className="heritage-button primary" type="submit">{pending ? "Đang lưu…" : passwordMode ? "Lưu mật khẩu mới" : "Lưu thay đổi"}<span aria-hidden="true">→</span></button>
    </fieldset>
    {result && <p className={`auth-message ${result.ok ? "success" : "error"}`} role={result.ok ? "status" : "alert"}>{result.message}</p>}
  </form>;
}
