import { quizAudioHttp } from "@/server/infrastructure/quiz-audio-http";
import { loadQuizAudio } from "@/server/services/quiz-audio";
export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return quizAudioHttp(request, async () => loadQuizAudio((await params).id, new URL(request.url).searchParams.get("voiceId") ?? undefined));
}
