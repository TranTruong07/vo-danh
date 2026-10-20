import "server-only";
import type { ChatIndexEntry } from "@/server/domain/chat";
import { CHAT_AI_SCHEMA, CHAT_AI_SYSTEM } from "@/server/domain/chat-ai";
import type { ChatAiConfig } from "@/server/services/chat-ai-config";

export const GEMINI_API_VERSION = "v1beta";

export async function generateQuestionMatch(message: string, candidates: ChatIndexEntry[], config: ChatAiConfig): Promise<string> {
  // Lazy SDK/client: disabled and exact-match paths never initialize Gemini.
  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY?.trim(), apiVersion: GEMINI_API_VERSION,
    httpOptions: { timeout: config.timeoutMs, retryOptions: { attempts: 1 } } });
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      client.models.generateContent({ model: config.model,
        contents: JSON.stringify({ question: message, candidates: candidates.map(({ questionId, canonicalQuestion, aliases }) => ({ questionId, canonicalQuestion, aliases })) }),
        config: { systemInstruction: CHAT_AI_SYSTEM, responseMimeType: "application/json", responseJsonSchema: CHAT_AI_SCHEMA,
          temperature: 0, maxOutputTokens: 256, abortSignal: controller.signal },
      }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error("gemini_timeout")); }, config.timeoutMs); }),
    ]);
    return result.text || "";
  } finally { if (timer) clearTimeout(timer); }
}
