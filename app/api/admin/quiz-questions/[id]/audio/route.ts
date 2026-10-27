import { quizAudioHttp, readQuizAudioBody } from "@/server/infrastructure/quiz-audio-http";
import { deleteQuizAudio, loadQuizAudio } from "@/server/services/quiz-audio";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return quizAudioHttp(request, async () => loadQuizAudio((await params).id, new URL(request.url).searchParams.get("voiceId") ?? undefined));
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return quizAudioHttp(request, async () => deleteQuizAudio((await params).id, await readQuizAudioBody(request)));
}
