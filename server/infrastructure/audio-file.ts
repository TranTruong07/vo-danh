import "server-only";
import { QuizAudioError } from "@/server/domain/quiz-audio";

export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

/** Validate two complete consecutive MPEG Layer III frames, after an optional ID3v2 tag. */
export function validateMp3(bytes: Buffer, contentType: string | null): void {
  const mime = contentType?.split(";")[0].trim().toLowerCase();
  if (!["audio/mpeg", "audio/mp3"].includes(mime || "") || bytes.length < 8 || bytes.length > MAX_AUDIO_BYTES) throw new QuizAudioError("File âm thanh không phải MP3 hợp lệ hoặc vượt dung lượng.", 502);
  let offset = 0;
  if (bytes.subarray(0, 3).toString() === "ID3") {
    if (bytes.length < 10 || ![2, 3, 4].includes(bytes[3]) || bytes.subarray(6, 10).some(byte => byte > 127)) throw new QuizAudioError("Header MP3 không hợp lệ.", 502);
    offset = 10 + (bytes[6] * 2097152 + bytes[7] * 16384 + bytes[8] * 128 + bytes[9]) + (bytes[3] === 4 && (bytes[5] & 16) ? 10 : 0);
  }
  for (let frame = 0; frame < 2; frame++) {
    const a = bytes[offset], b = bytes[offset + 1], c = bytes[offset + 2];
    const version = (b >> 3) & 3, layer = (b >> 1) & 3, bitrateIndex = c >> 4, sampleIndex = (c >> 2) & 3;
    if (offset + 4 > bytes.length || a !== 255 || (b & 224) !== 224 || version === 1 || layer !== 1 || bitrateIndex === 0 || bitrateIndex === 15 || sampleIndex === 3) throw new QuizAudioError("Dữ liệu MP3 thiếu frame âm thanh hợp lệ.", 502);
    const rates = version === 3 ? [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320] : [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160];
    const sample = [44100,48000,32000][sampleIndex] / (version === 3 ? 1 : version === 2 ? 2 : 4);
    offset += Math.floor((version === 3 ? 144 : 72) * rates[bitrateIndex] * 1000 / sample) + ((c >> 1) & 1);
    if (offset > bytes.length) throw new QuizAudioError("File MP3 bị cắt ngắn.", 502);
  }
}
