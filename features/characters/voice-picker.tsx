"use client";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_VOICE, VIETNAMESE_VOICES } from "@/server/domain/speech";
import { previewVoiceAction, voiceOptionsAction } from "@/actions/speech";

export default function VoicePicker({ initialValue = DEFAULT_VOICE }: { initialValue?: string }) {
  const [voice, setVoice] = useState(initialValue);
  const [voices, setVoices] = useState(VIETNAMESE_VOICES);
  const [configured, setConfigured] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const audio = useRef<HTMLAudioElement>(null);
  const groups = [
    { prefix: "vi-VN-Chirp3-HD-", label: "Chirp 3 HD" },
    { prefix: "vi-VN-Neural2-", label: "Neural2" },
    { prefix: "vi-VN-Standard-", label: "Standard" },
    { prefix: "vi-VN-Wavenet-", label: "WaveNet" },
  ];
  const otherVoices = voices.filter(item => !groups.some(group => item.name.startsWith(group.prefix)));
  useEffect(() => {
    let cancelled = false;
    void voiceOptionsAction().then(result => {
      if (cancelled) return;
      if (result.ok) { setVoices(result.data.voices); setConfigured(result.data.configured); }
      else setMessage(result.message);
    }).catch(() => { if (!cancelled) setMessage("Không tải được danh sách giọng. Bạn vẫn có thể chọn các giọng mẫu bên dưới."); });
    return () => { cancelled = true; };
  }, []);
  async function preview() {
    setBusy(true); setMessage(""); audio.current?.pause();
    try {
      const result = await previewVoiceAction(voice);
      if (!result.ok) { setMessage(result.message); return; }
      setUrl(result.data[0] || "");
    } catch { setMessage("Không tải được giọng nghe thử. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }
  return <div className="character-voice-field">
    <input type="hidden" name="voiceName" value={voice} />
    <label>Giọng đọc tiếng Việt<select aria-label="Giọng đọc tiếng Việt" value={voice} disabled={busy} onChange={event => { audio.current?.pause(); setVoice(event.target.value); setUrl(""); setMessage(""); }}>
      {!voices.some(item => item.name === voice) && <option value={voice}>{voice} · Giọng đã lưu</option>}
      {groups.map(group => {
        const items = voices.filter(item => item.name.startsWith(group.prefix));
        return items.length ? <optgroup key={group.prefix} label={`${group.label} (${items.length} giọng)`}>{items.map(item => <option key={item.name} value={item.name}>{item.gender} · {item.name}</option>)}</optgroup> : null;
      })}
      {!!otherVoices.length && <optgroup label="Giọng Việt khác">{otherVoices.map(item => <option key={item.name} value={item.name}>{item.gender} · {item.name}</option>)}</optgroup>}
    </select></label>
    <p className="subtitle">Mỗi nhân vật có thể dùng một giọng khác nhau. Sau khi lưu, tạo/cập nhật âm thanh tại trang chi tiết nhân vật.</p>
    <button className="btn" type="button" disabled={busy || !configured} onClick={preview}>{busy ? "Đang tạo mẫu…" : "Nghe thử giọng"}</button>
    {url && <audio ref={audio} controls src={url} aria-label="Giọng đọc mẫu" preload="metadata" />}
    {message && <p className="msg error" role="alert">{message}</p>}
  </div>;
}
