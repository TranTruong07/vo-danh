import { offlineGamePack } from "@/server/services/offline-game";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(await offlineGamePack(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ message: "Chưa tải được dữ liệu chơi offline. Hãy thử lại khi có mạng." }, { status: 503 });
  }
}
