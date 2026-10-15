"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { logoutAdmin } from "@/actions/admin";
import { AdminIcon } from "./icons";

export default function AdminFrame({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const drawer = useRef<HTMLDialogElement>(null);
  const inCharacters = pathname.startsWith("/admin/characters");
  const inQuestions = pathname.startsWith("/admin/questions");
  const inOrders = pathname.startsWith("/admin/orders");
  const inSettings = pathname.startsWith("/admin/settings");
  const inKnowledge = pathname.startsWith("/admin/knowledge");
  const inOverview = pathname === "/admin";
  const close = () => drawer.current?.close();
  function navigation() {
    return <>
      <Link className="admin-brand" href="/admin" onClick={close}><span className="admin-brand-mark">✦</span><span>Dấu Chân<small>SỬ KÝ · ADMIN</small></span></Link>
      <div className="sidebar-profile"><div className="admin-avatar">{email.slice(0, 1).toUpperCase()}</div><strong>Quản trị viên</strong><span title={email}>{email}</span><small><i /> Đang hoạt động</small></div>
      <p className="nav-caption">KHÔNG GIAN QUẢN TRỊ</p>
      <nav className="admin-navigation" aria-label="Menu quản trị">
        <Link href="/admin" className={inOverview ? "active" : ""} aria-current={inOverview ? "page" : undefined} onClick={close}><AdminIcon name="dashboard" />Tổng quan</Link>
        <Link href="/admin/characters" className={inCharacters ? "active" : ""} aria-current={inCharacters ? "page" : undefined} onClick={close}><AdminIcon name="characters" />Nhân vật & QR</Link>
        <Link href="/admin/questions" className={inQuestions ? "active" : ""} aria-current={inQuestions ? "page" : undefined} onClick={close}><AdminIcon name="questions" />Câu hỏi</Link>
        <Link href="/admin/knowledge" className={inKnowledge ? "active" : ""} aria-current={inKnowledge ? "page" : undefined} onClick={close}><AdminIcon name="questions" />Kiến thức chatbot</Link>
        <p className="nav-caption">CỬA HÀNG</p>
        <Link href="/admin/orders" className={inOrders ? "active" : ""} aria-current={inOrders ? "page" : undefined} onClick={close}><AdminIcon name="orders" />Đơn hàng</Link>
        <button type="button" disabled><AdminIcon name="products" />Sản phẩm <small>Sắp có</small></button>
        <button type="button" disabled><AdminIcon name="users" />Khách hàng <small>Sắp có</small></button>
        <Link href="/admin/settings" className={inSettings ? "active" : ""} aria-current={inSettings ? "page" : undefined} onClick={close}><AdminIcon name="settings" />Thiết lập</Link>
        <p className="nav-caption">TRẢI NGHIỆM</p>
        <Link href="/play" onClick={close}><AdminIcon name="qr" />Quét mã để chơi</Link>
        <Link href="/" onClick={close}><AdminIcon name="arrow" />Về website</Link>
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span>✦</span><strong>Mỗi thẻ bài,<br />một câu chuyện.</strong><p>Quản lý nhân vật và đưa lịch sử đến gần người chơi.</p></div><form action={logoutAdmin}><button className="sidebar-logout"><AdminIcon name="logout" />Đăng xuất</button></form></div>
    </>;
  }
  return <div className="admin-shell">
    <aside className="admin-sidebar">{navigation()}</aside>
    <dialog ref={drawer} className="admin-drawer" aria-label="Điều hướng quản trị" onClick={e => { if (e.target === e.currentTarget) close(); }}><div><button className="drawer-close" aria-label="Đóng menu" onClick={close}><AdminIcon name="close" /></button>{navigation()}</div></dialog>
    <div className="admin-workspace">
      <header className="admin-topbar"><button className="mobile-menu icon-button" aria-label="Mở menu quản trị" onClick={() => drawer.current?.showModal()}><AdminIcon name="menu" /></button>
        <form className="admin-global-search" action={inKnowledge ? "/admin/knowledge" : inOrders ? "/admin/orders" : inQuestions ? "/admin/questions" : "/admin/characters"}><AdminIcon name="search" /><input name="q" type="search" aria-label={inKnowledge ? "Tìm kiến thức chatbot" : inOrders ? "Tìm đơn hàng trong quản trị" : inQuestions ? "Tìm câu hỏi trong quản trị" : "Tìm nhân vật trong quản trị"} placeholder={inKnowledge ? "Tìm kiến thức…" : inOrders ? "Tìm đơn hàng…" : inQuestions ? "Tìm câu hỏi…" : "Tìm nhân vật…"} maxLength={120} /><button type="submit" aria-label="Tìm kiếm"><span>↵</span></button></form>
        <div className="topbar-location"><AdminIcon name={inKnowledge ? "questions" : inSettings ? "settings" : inOrders ? "orders" : inQuestions ? "questions" : inCharacters ? "characters" : "dashboard"} /><span>{inKnowledge ? "Kiến thức chatbot" : inSettings ? "Thiết lập" : inOrders ? "Đơn hàng" : inQuestions ? "Câu hỏi theo nhân vật" : inCharacters ? "Nhân vật & QR" : "Dashboard"}</span></div>
        <Link className="topbar-website" href="/play"><AdminIcon name="qr" /><span>Quét mã</span></Link><div className="topbar-avatar" aria-label="Tài khoản quản trị">{email.slice(0, 1).toUpperCase()}</div>
      </header>
      <main className="admin-content" id="admin-main">{children}</main>
      <footer className="admin-footer"><span>Dấu Chân Sử Ký</span><span>Học mà chơi · Chơi mà học</span></footer>
    </div>
  </div>;
}
