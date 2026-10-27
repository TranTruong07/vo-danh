/** Provider-independent MP3 playlists for question and feedback playback. */
export interface QuestionAudio { prompt: string[]; correct: string[]; incorrect: string[] }

export function questionSpeech(question: string, answers: string[]) {
  return `${question}\n${answers.map((answer, index) => `Đáp án ${"ABCD"[index]}. ${answer}`).join("\n")}`;
}
