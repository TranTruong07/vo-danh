export interface VietnameseVoice { name: string; gender: string }
// Available before credentials are configured. Refresh from voices.list when connected.
export const VIETNAMESE_VOICES: VietnameseVoice[] = [
  ...[
    ["Achernar", "Nữ"], ["Achird", "Nam"], ["Algenib", "Nam"], ["Algieba", "Nam"], ["Alnilam", "Nam"],
    ["Aoede", "Nữ"], ["Autonoe", "Nữ"], ["Callirrhoe", "Nữ"], ["Charon", "Nam"], ["Despina", "Nữ"],
    ["Enceladus", "Nam"], ["Erinome", "Nữ"], ["Fenrir", "Nam"], ["Gacrux", "Nữ"], ["Iapetus", "Nam"],
    ["Kore", "Nữ"], ["Laomedeia", "Nữ"], ["Leda", "Nữ"], ["Orus", "Nam"], ["Puck", "Nam"],
    ["Pulcherrima", "Nữ"], ["Rasalgethi", "Nam"], ["Sadachbia", "Nam"], ["Sadaltager", "Nam"], ["Schedar", "Nam"],
    ["Sulafat", "Nữ"], ["Umbriel", "Nam"], ["Vindemiatrix", "Nữ"], ["Zephyr", "Nữ"], ["Zubenelgenubi", "Nam"],
  ].map(([name, gender]) => ({ name: `vi-VN-Chirp3-HD-${name}`, gender })),
  ...["Standard", "Wavenet"].flatMap(type => ["A", "B", "C", "D"].map(letter => ({ name: `vi-VN-${type}-${letter}`, gender: ["A", "C"].includes(letter) ? "Nữ" : "Nam" }))),
  { name: "vi-VN-Neural2-A", gender: "Nữ" }, { name: "vi-VN-Neural2-D", gender: "Nam" },
];
export const DEFAULT_VOICE = "vi-VN-Standard-A";
export const isVietnameseVoice = (voice: unknown): voice is string => typeof voice === "string" && /^vi-VN-[A-Za-z0-9-]{1,80}$/.test(voice);
export interface QuestionAudio { prompt: string[]; correct: string[]; incorrect: string[] }

/** Google accepts at most 5,000 UTF-8 bytes; keep each plain-text request below it. */
export function speechChunks(text: string): string[] {
  const chunks: string[] = []; let current = "";
  const encoder = new TextEncoder();
  for (const word of text.normalize("NFC").trim().split(/\s+/u)) {
    if (!word) continue;
    if (encoder.encode(`${current} ${word}`).length <= 4500) { current = current ? `${current} ${word}` : word; continue; }
    if (current) { chunks.push(current); current = ""; }
    for (const letter of word) {
      if (encoder.encode(current + letter).length > 4500) { chunks.push(current); current = ""; }
      current += letter;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
export function questionSpeech(question: string, answers: string[]) {
  return `${question}\n${answers.map((answer, index) => `Đáp án ${"ABCD"[index]}. ${answer}`).join("\n")}`;
}
