import { readQuizAudioFile } from "@/server/repositories/speech";
import { isAudioSegment } from "@/server/domain/quiz-audio";
import { ttsForFreeAudioKey } from "@/server/domain/quiz-audio-hash";
import { audioResponse } from "@/server/infrastructure/audio-http";

export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ asset: string[] }> }) {
  const { asset } = await params;
  if (asset.length !== 4 || !isAudioSegment(asset[2])) return new Response(null, { status: 404 });
  let key: string;
  try { key = ttsForFreeAudioKey(asset[0], asset[1], asset[2], asset[3]); }
  catch { return new Response(null, { status: 404 }); }
  // Public immutable educational media, just like the existing /audio/:hash route.
  return audioResponse(request, range => readQuizAudioFile(key, range));
}
