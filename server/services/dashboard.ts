import "server-only";
import { orderMetrics } from "@/server/repositories/orders";
import { requireAdmin } from "./admin-auth";
import { readDashboard } from "@/server/repositories/dashboard";

export async function loadDashboard(days: 7 | 30) {
  await requireAdmin();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const midnight = new Date(`${today}T00:00:00+07:00`).getTime();
  const since = new Date(midnight - (days - 1) * 86400000);
  const [data, sales] = await Promise.all([readDashboard(since), orderMetrics()]);
  const counts = new Map(data.registrations.map(row => [row._id, row.count]));
  const registrations = Array.from({ length: days }, (_, index) => {
    const date = new Date(since.getTime() + index * 86400000 + 7 * 3600000).toISOString().slice(0, 10);
    return { date, count: counts.get(date) ?? 0 };
  });
  return { ...data, sales, registrations, days, newUsers: registrations.reduce((sum, row) => sum + row.count, 0) };
}
export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
