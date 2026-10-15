import { handleChatRequest } from "@/server/infrastructure/chat-http";
import { sendChatMessage } from "@/server/services/chat";

export const runtime = "nodejs";
export async function POST(request: Request) { return handleChatRequest(request, sendChatMessage); }
