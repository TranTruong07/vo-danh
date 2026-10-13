import { redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";
import { adminSettings } from "@/server/services/settings";
import SettingsPanel from "@/features/admin/settings-panel";
import "./settings.css";

export default async function SettingsPage() {
  if (!await hasAdminSession()) redirect("/?auth=login");
  const settings = await adminSettings();
  return <SettingsPanel {...settings} />;
}
