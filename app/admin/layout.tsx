import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif } from "next/font/google";
import { currentAccount } from "@/server/services/account-session";
import AdminFrame from "@/features/admin/admin-frame";
import "./admin.css";

const adminSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "vietnamese"], display: "swap" });
const adminMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "vietnamese"], display: "swap" });
const adminSerif = Noto_Serif({ variable: "--font-heritage-serif", subsets: ["latin", "vietnamese"], style: ["normal", "italic"], display: "swap" });

export const metadata: Metadata = { title: "Quản trị | Dấu Chân Sử Ký", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentAccount();
  // Pages/actions enforce authorization; the login redirect must remain outside the admin frame.
  if (user?.role !== "admin") return children;
  return <div className={`admin-typography ${adminSans.variable} ${adminMono.variable} ${adminSerif.variable}`}><AdminFrame email={user.email}>{children}</AdminFrame></div>;
}
