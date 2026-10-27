import { readSpeechFile } from "@/server/repositories/speech";
import { audioResponse } from "@/server/infrastructure/audio-http";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{64}$/.test(id)) return new Response(null, { status: 404 });
  return audioResponse(request, range => readSpeechFile(id, range));
}
