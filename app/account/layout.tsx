import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/heritage/site";
import "@/features/auth/profile.css";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <div className="heritage"><SiteHeader /><main id="main-content" className="profile-wrap">
    <div className="profile-heading"><p className="eyebrow">GÓC CỦA BẠN</p><h1>Tài khoản cá nhân</h1><p>Quản lý thông tin và bảo vệ tài khoản của bạn.</p></div>
    <div className="profile-layout"><nav className="profile-nav" aria-label="Cài đặt tài khoản">
      <Link href="/account">Thông tin cá nhân <span aria-hidden="true">→</span></Link>
      <Link href="/account/password">Đổi mật khẩu <span aria-hidden="true">→</span></Link>
      <Link href="/orders">Lịch sử mua hàng <span aria-hidden="true">→</span></Link>
    </nav><section className="profile-card">{children}</section></div>
  </main><SiteFooter /></div>;
}
