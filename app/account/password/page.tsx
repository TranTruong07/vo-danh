import { redirect } from "next/navigation";
import { currentAccount } from "@/server/services/account-session";
import ProfileForm from "@/features/auth/profile-form";

export const metadata = { title: "Đổi mật khẩu | Dấu Chân Sử Ký" };

export default async function PasswordPage() {
  const user = await currentAccount();
  if (!user) redirect("/?auth=login&next=/account/password");
  return <><h2>Đổi mật khẩu</h2><p className="profile-description">Bảo vệ tài khoản bằng mật khẩu chỉ bạn biết.</p><ProfileForm user={user} passwordMode /></>;
}
