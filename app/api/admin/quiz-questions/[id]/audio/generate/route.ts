import { quizAudioHttp, readQuizAudioBody } from "@/server/infrastructure/quiz-audio-http";
import { generateQuizAudio } from "@/server/services/quiz-audio";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return quizAudioHttp(request, async () => generateQuizAudio((await params).id, await readQuizAudioBody(request)));
}
