import { hasAdminSession } from "@/server/services/admin-auth";
import { exportOrders } from "@/server/services/order-export";
export const runtime = "nodejs";
export async function GET(request: Request) {
  if (!await hasAdminSession()) return new Response("Unauthorized", { status: 401 });
  const query = new URL(request.url).searchParams;
  const file = await exportOrders(query.get("status") || undefined, (query.get("q") || "").slice(0, 120));
  return new Response(file, { headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="don-hang-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
  } });
}
