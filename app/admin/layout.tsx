import type { Metadata } from "next";
import { currentAccount } from "@/server/services/account-session";
import AdminFrame from "@/features/admin/admin-frame";
import "./admin.css";

export const metadata: Metadata = { title: "Quản trị | Dấu Chân Sử Ký", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentAccount();
  // Pages/actions enforce authorization; the login redirect must remain outside the admin frame.
  if (user?.role !== "admin") return children;
  return <AdminFrame email={user.email}>{children}</AdminFrame>;
}
