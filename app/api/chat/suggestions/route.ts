import { handleChatRequest } from "@/server/infrastructure/chat-http";
import { suggestChatQuestions } from "@/server/services/chat";

export const runtime = "nodejs";
// Read-only knowledge operation; POST carries the existing session contract.
export async function POST(request: Request) { return handleChatRequest(request, suggestChatQuestions); }
