import "server-only";

export function quizAudioConfig() {
  const voices: { id: string; label: string }[] = [];
  let valid = true;
  for (let index = 1; index <= 4; index++) {
    const id = process.env[`TTSFORFREE_VOICE_${index}_ID`]?.trim() || "";
    if (!id) continue;
    if (id.length > 1024 || /\s/.test(id) || voices.some(voice => voice.id === id)) valid = false;
    voices.push({ id, label: (process.env[`TTSFORFREE_VOICE_${index}_LABEL`]?.trim() || `Giọng ${index}`).slice(0, 120) });
  }
  return {
    enabled: process.env.TTSFORFREE_ENABLED === "true", configured: !!process.env.TTSFORFREE_API_KEY?.trim(),
    voices, voice: voices[0]?.id || "", pitch: 0, maxFiles: 7,
    valid: valid && voices.length > 0,
  };
}
