import { receivePaymentWebhook } from "@/server/services/orders";
import { OrderError } from "@/server/domain/order";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length")) > 65536) return new Response("Payload too large", { status: 413 });
  try {
    const body = await request.text();
    if (body.length > 65536) return new Response("Payload too large", { status: 413 });
    await receivePaymentWebhook(JSON.parse(body));
    return Response.json({ success: true });
  } catch (error) { return Response.json({ success: false }, { status: error instanceof OrderError || error instanceof SyntaxError ? 400 : 503 }); }
}
