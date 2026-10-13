"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { accountAction, logoutAccount } from "@/actions/account";
import { validateAuthInput, type AuthMode, type AuthResult, type PublicUser } from "@/server/domain/auth";
import Avatar from "./avatar";
import AvatarPicker from "./avatar-picker";

const titles: Record<AuthMode, string> = { login: "Chào mừng trở lại", register: "Bắt đầu hành trình", forgot: "Quên mật khẩu?", reset: "Đặt mật khẩu mới" };
const descriptions: Record<AuthMode, string> = {
  login: "Đăng nhập để tiếp tục khám phá cùng Dấu Chân Sử Ký.",
  register: "Tạo tài khoản bằng email và mật khẩu của bạn.",
  forgot: "Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.",
  reset: "Chọn mật khẩu mới có độ dài từ 6 đến 32 ký tự.",
};

export default function AuthControls({ user, initialMode, resetToken = "" }: { user: PublicUser | null; initialMode?: AuthMode; resetToken?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode ?? "login");
  const [result, setResult] = useState<AuthResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [formRevision, setFormRevision] = useState(0);

  useEffect(() => {
    if (initialMode) dialog.current?.showModal();
  }, [initialMode]);

  useEffect(() => {
    const dismiss = (event: PointerEvent) => { if (menu.current && !menu.current.contains(event.target as Node)) menu.current.open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && menu.current?.open) { menu.current.open = false; menu.current.querySelector("summary")?.focus(); } };
    document.addEventListener("pointerdown", dismiss); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, []);

  function clearAuthQuery() {
    const url = new URL(window.location.href);
    if (url.searchParams.has("auth")) {
      url.searchParams.delete("auth"); url.searchParams.delete("token");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }
  function close() { dialog.current?.close(); clearAuthQuery(); }
  function open(next: AuthMode) {
    setMode(next); setResult(null); setVisiblePassword(false); form.current?.reset();
    setFormRevision(value => value + 1);
    dialog.current?.showModal();
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    data.set("token", resetToken);
    data.set("returnTo", new URL(window.location.href).searchParams.get("next") || "");
    const value = (name: string) => String(data.get(name) ?? "");
    const errors = validateAuthInput(mode, { email: value("email"), password: value("password"), confirmPassword: value("confirmPassword"), token: resetToken });
    if (errors) { setResult({ ok: false, message: "Vui lòng kiểm tra thông tin đã nhập.", errors }); return; }
    setResult(null);
    startTransition(async () => {
      try {
        const response = await accountAction(mode, data);
        setResult(response);
        if (response.ok && response.user) {
          close();
          if (response.redirectTo) router.push(response.redirectTo);
        } else if (response.ok && mode === "reset") { clearAuthQuery(); }
      } catch { setResult({ ok: false, message: "Không thể kết nối. Vui lòng thử lại." }); }
    });
  }
  function logout() {
    startTransition(async () => {
      try {
        const response = await logoutAccount();
        setResult(response);
      } catch { setResult({ ok: false, message: "Không thể đăng xuất. Vui lòng thử lại." }); }
    });
  }
  const hasPassword = mode !== "forgot";
  const hasConfirm = mode === "register" || mode === "reset";
  const completed = result?.ok && (mode === "forgot" || mode === "reset");

  return <div className="account-controls">
    {user ? <>
      <details className="account-menu" ref={menu}>
        <summary aria-label="Mở menu tài khoản"><Avatar src={user.avatarUrl} alt="Ảnh đại diện tài khoản" /><span aria-hidden="true">⌄</span></summary>
        <div className="account-menu-panel" onClick={event => { if ((event.target as HTMLElement).closest("a") && menu.current) menu.current.open = false; }}>
          <strong>{user.fullName || "Tài khoản của bạn"}</strong>
          <Link href="/account">Thông tin cá nhân</Link>
          <Link href="/orders">Đơn mua</Link>
          <Link href="/account/password">Đổi mật khẩu</Link>
          {user.role === "admin" && <Link href="/admin">Dashboard quản trị</Link>}
          <button type="button" onClick={logout} disabled={pending}>{pending ? "Đang đăng xuất…" : "Đăng xuất"}</button>
        </div>
      </details>
      {result && !result.ok && <span className="account-status" role="alert">{result.message}</span>}
    </> : <button type="button" className="account-button" onClick={() => open("login")}>Đăng nhập</button>}
    <dialog ref={dialog} className="auth-dialog" aria-labelledby="auth-title" aria-describedby="auth-description"
      onClose={clearAuthQuery}
      onCancel={event => { if (pending) event.preventDefault(); }}
      onClick={event => { if (event.target === event.currentTarget && !pending) close(); }}>
      <button type="button" className="auth-close" aria-label="Đóng đăng nhập" onClick={close} disabled={pending}>×</button>
      <p className="eyebrow">DẤU CHÂN SỬ KÝ</p>
      <h2 id="auth-title">{titles[mode]}</h2>
      <p id="auth-description" className="auth-description">{descriptions[mode]}</p>
      {(mode === "login" || mode === "register") && <div className="auth-tabs" aria-label="Tài khoản">
        <button type="button" aria-pressed={mode === "login"} onClick={() => open("login")} disabled={pending}>Đăng nhập</button>
        <button type="button" aria-pressed={mode === "register"} onClick={() => open("register")} disabled={pending}>Đăng ký</button>
      </div>}
      <form key={`${mode}-${formRevision}`} ref={form} onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={pending || !!completed}>
          {mode === "register" && <AvatarPicker />}
          {mode !== "reset" && <div className="auth-field"><label htmlFor="auth-email">Email</label><input id="auth-email" name="email" type="email" autoComplete="email" placeholder="ban@example.com" required maxLength={254} aria-invalid={!!result?.errors?.email} aria-describedby={result?.errors?.email ? "auth-email-error" : undefined} />{result?.errors?.email && <span id="auth-email-error" className="auth-field-error">{result.errors.email}</span>}</div>}
          {hasPassword && <div className="auth-field"><label htmlFor="auth-password">{mode === "reset" ? "Mật khẩu mới" : "Mật khẩu"}</label><span className="auth-password-input"><input id="auth-password" name="password" type={visiblePassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} maxLength={32} placeholder="Từ 6 đến 32 ký tự" aria-invalid={!!result?.errors?.password} aria-describedby="auth-password-help" /><button type="button" aria-label={visiblePassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setVisiblePassword(!visiblePassword)}>{visiblePassword ? "Ẩn" : "Hiện"}</button></span><span id="auth-password-help" className={result?.errors?.password ? "auth-field-error" : "auth-field-help"}>{result?.errors?.password || "Mật khẩu dài từ 6 đến 32 ký tự."}</span></div>}
          {hasConfirm && <div className="auth-field"><label htmlFor="auth-confirm">Xác nhận mật khẩu</label><input id="auth-confirm" name="confirmPassword" type={visiblePassword ? "text" : "password"} autoComplete="new-password" required minLength={6} maxLength={32} placeholder="Nhập lại mật khẩu" aria-invalid={!!result?.errors?.confirmPassword} aria-describedby={result?.errors?.confirmPassword ? "auth-confirm-error" : undefined} />{result?.errors?.confirmPassword && <span id="auth-confirm-error" className="auth-field-error">{result.errors.confirmPassword}</span>}</div>}
          {mode === "login" && <button type="button" className="auth-text-button auth-forgot" onClick={() => open("forgot")}>Quên mật khẩu?</button>}
          <button className="heritage-button primary auth-submit" type="submit">{pending ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : mode === "register" ? "Tạo tài khoản" : mode === "forgot" ? "Gửi liên kết đặt lại" : "Lưu mật khẩu mới"}<span aria-hidden="true">→</span></button>
        </fieldset>
        {result && <p className={`auth-message ${result.ok ? "success" : "error"}`} role={result.ok ? "status" : "alert"}>{result.message}</p>}
      </form>
      {(mode === "forgot" || mode === "reset") && <button type="button" className="auth-text-button auth-back" onClick={() => open("login")} disabled={pending}>← Quay lại đăng nhập</button>}
      {mode === "login" && <p className="auth-switch">Chưa có tài khoản? <button type="button" className="auth-text-button" onClick={() => open("register")} disabled={pending}>Đăng ký ngay</button></p>}
      {mode === "register" && <p className="auth-switch">Đã có tài khoản? <button type="button" className="auth-text-button" onClick={() => open("login")} disabled={pending}>Đăng nhập</button></p>}
    </dialog>
  </div>;
}
