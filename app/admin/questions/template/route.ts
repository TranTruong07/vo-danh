import { hasAdminSession } from "@/server/services/admin-auth";
import { downloadQuestionTemplate } from "@/server/services/question-import";

export const runtime = "nodejs";
export async function GET() {
  if (!await hasAdminSession()) return new Response("Unauthorized", { status: 401 });
  const file = await downloadQuestionTemplate();
  return new Response(file, { headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": 'attachment; filename="mau-cau-hoi-nhan-vat.xlsx"',
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
  } });
}
