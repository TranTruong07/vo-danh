import { redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";
import { loadDashboard } from "@/server/services/dashboard";
import Dashboard from "@/features/admin/dashboard";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  if (!await hasAdminSession()) redirect("/?auth=login");
  const days = (await searchParams).days === "7" ? 7 : 30;
  return <Dashboard key={days} data={await loadDashboard(days)} />;
}
