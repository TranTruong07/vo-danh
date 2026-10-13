import { redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";

export default async function LoginPage() {
  if (await hasAdminSession()) redirect("/admin");
  redirect("/?auth=login");
}
