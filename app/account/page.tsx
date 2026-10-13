import { redirect } from "next/navigation";
import { currentAccount } from "@/server/services/account-session";
import ProfileForm from "@/features/auth/profile-form";

export const metadata = { title: "Thông tin cá nhân | Dấu Chân Sử Ký" };

export default async function AccountPage() {
  const user = await currentAccount();
  if (!user) redirect("/?auth=login&next=/account");
  return <><h2>Thông tin cá nhân</h2><p className="profile-description">Thêm một chút về bạn để hành trình thêm gần gũi.</p><ProfileForm user={user} /></>;
}
