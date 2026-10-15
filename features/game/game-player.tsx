"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "./qr-scanner";
import CharacterChat from "./character-chat";
import NarrationPlayer from "./narration-player";
import { startQuizAction, answerQuizAction } from "@/actions/quiz";
import type { PublicCharacter } from "@/server/domain/character";
import type { PublicQuestion, AnswerResult } from "@/server/domain/quiz";
import { usePwa } from "@/features/pwa/pwa-provider";
import { drawLocalQuestion, gradeLocalQuestion, localPublicQuestion, matchSavedQuestion, readPack, rememberLocalQuestion } from "@/features/pwa/local-game";
import type { CharacterQuestionRecord } from "@/server/domain/character-question";
import type { OpenChatSessionAction } from "@/server/domain/chat";

export default function GamePlayer({ character, openChatSessionAction }: { character?: PublicCharacter; openChatSessionAction?: OpenChatSessionAction }) {
  const [scanning, setScanning] = useState(!character);
  const [motion, setMotion] = useState(true);
  function scanned(id: string) {
    const url = `/play/${id}?round=${crypto.randomUUID()}`;
    // Offline needs the document shell; an RSC navigation cannot reach the server.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(url);
  }
  if (!character) return <QrScanner onScan={scanned} />;
  return <div className={`character-stage ${motion ? "" : "motion-paused"}`}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="scene-background" src={character.backgroundImage} alt="" referrerPolicy="no-referrer" />
    <div className="scene-shade" aria-hidden="true" />
    <div className="scene-toolbar"><span>✦ MỘT THẺ BÀI · MỘT CÂU CHUYỆN</span><div><button className="scene-motion" type="button" aria-pressed={!motion} onClick={() => setMotion(value => !value)}>{motion ? "Tắt chuyển động" : "Bật chuyển động"}</button><button className="game-button" onClick={() => setScanning(value => !value)}>{scanning ? "Về câu hỏi" : "Quét nhân vật tiếp"} <span aria-hidden="true">↗</span></button></div></div>
    {scanning && <QrScanner onScan={scanned} />}
    <div hidden={scanning}><QuestionRound character={character} active={!scanning} openChatSessionAction={openChatSessionAction} /></div>
  </div>;
}

function QuestionRound({ character, active, openChatSessionAction }: { character: PublicCharacter; active: boolean; openChatSessionAction?: OpenChatSessionAction }) {
  const { pack } = usePwa();
  const localQuestion = useRef<CharacterQuestionRecord | null>(null);
  const initiated = useRef(false);
  const request = useRef("");
  const inFlight = useRef(false);
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [answer, setAnswer] = useState<AnswerResult | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    // A server round may arrive before the initial download finishes. Save its
    // grading snapshot and mark it seen before drawing from the offline bank.
    if (!pack || !question || localQuestion.current) return;
    const snapshot = matchSavedQuestion(pack, character.id, question);
    if (snapshot) { localQuestion.current = snapshot; void rememberLocalQuestion(snapshot); }
  }, [pack, question, character.id]);
  async function generate() {
    if (inFlight.current || question) return;
    inFlight.current = true;
    setLoading(true); setError(""); setQuestion(null); setAnswer(null); setSelected(null);
    request.current = crypto.randomUUID();
    localQuestion.current = null;
    try {
      const saved = pack || await readPack().catch(() => null);
      if (saved) {
        localQuestion.current = await drawLocalQuestion(saved, character.id);
        setQuestion(localPublicQuestion(localQuestion.current)); return;
      }
      if (!navigator.onLine) throw new Error("offline");
      const result = await startQuizAction(character.id, request.current);
      if (result.ok) setQuestion(result.data); else setError(result.message);
    } catch (cause) { setError(cause instanceof Error && cause.message.includes("chưa có câu hỏi") ? cause.message : "Chưa có dữ liệu câu hỏi trên máy. Hãy kết nối mạng để tải bộ dữ liệu rồi thử lại."); }
    finally { inFlight.current = false; setLoading(false); }
  }
  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;
    // One automatic request per mounted round, including React Strict Mode.
    void Promise.resolve().then(generate);
    // This component is keyed by character + round at the page boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function submit() {
    if (!question || selected === null || submitting || answer) return;
    setSubmitting(true); setError("");
    try {
      const saved = pack || await readPack().catch(() => null);
      const snapshot = localQuestion.current || (saved && matchSavedQuestion(saved, character.id, question));
      if (snapshot) { const result = gradeLocalQuestion(snapshot, selected); setAnswer(result); setSelected(result.selectedIndex); return; }
      if (!navigator.onLine) { setError("Câu hỏi này chưa được lưu trên máy. Kết nối mạng để chốt đáp án."); return; }
      const result = await answerQuizAction(question.id, selected);
      if (result.ok) { setAnswer(result.data); setSelected(result.data.selectedIndex); } else setError(result.message);
    } catch { setError("Chưa gửi được đáp án. Hãy bấm chốt đáp án để thử lại."); }
    finally { setSubmitting(false); }
  }
  return <><div className={`scene-round ${loading ? "is-loading" : answer?.correct ? "is-celebrating" : "is-asking"}`}>
    <figure className="scene-actor">
      <div className="actor-aura" aria-hidden="true" /><span className="actor-spark spark-one" aria-hidden="true">✦</span><span className="actor-spark spark-two" aria-hidden="true">✧</span>
      <div className="actor-entrance" key={question?.id || "loading"}><div className="actor-sprite">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={character.image} alt={`Nhân vật ${character.name} đang đặt câu hỏi`} referrerPolicy="no-referrer" />
      </div></div>
      <figcaption><span>GẶP GỠ NHÂN VẬT</span><h1>{character.name}</h1><p>{loading ? "Đang chọn một thử thách cho bạn…" : answer?.correct ? "Thật tuyệt! Bạn hiểu lịch sử đấy." : "Bạn có sẵn sàng thử tài?"}</p></figcaption>
    </figure>
    <section className="scene-question" aria-label="Câu hỏi lịch sử" aria-busy={loading || submitting}>
      <div className="question-speech" key={question?.id || "loading"}><p className="speech-speaker"><span aria-hidden="true">❝</span> {character.name} hỏi bạn</p>
        {loading && <div className="question-loading" role="status"><span className="game-spinner" /><h2>Đang mở trang sử…</h2><p>Đang chọn câu hỏi từ thẻ nhân vật.</p></div>}
        {question && <h2 id="scene-question-title">{question.question}</h2>}
        {!loading && !question && <h2>Chưa mở được câu hỏi</h2>}
        {question && <p className="speech-hint">Chọn một trong bốn đáp án bên dưới.</p>}
      </div>
      {question && <><fieldset className="answer-options" aria-labelledby="scene-question-title" disabled={submitting || !!answer}><legend className="sr-only">Chọn một đáp án</legend>{question.options.map((option, index) => <label key={index} className={`answer-option ${selected === index ? "chosen" : ""} ${answer?.correctIndex === index ? "correct" : ""} ${answer && selected === index && !answer.correct ? "incorrect" : ""}`}><input type="radio" name="answer" value={index} checked={selected === index} onChange={() => setSelected(index)} /><span className="answer-letter">{"ABCD"[index]}</span><span>{option}</span>{answer?.correctIndex === index && <strong aria-label="Đáp án đúng">✓</strong>}</label>)}</fieldset>
        {!answer && <button className="game-button primary confirm-answer" disabled={selected === null || submitting} onClick={submit}>{submitting ? "Đang kiểm tra…" : "Chốt đáp án →"}</button>}
      </>}
      {question && <NarrationPlayer urls={answer ? answer.narration : question.narration} feedback={!!answer} active={active} />}
      {error && <div className="game-message error" role="alert"><p>{error}</p>{!loading && !question && <button className="game-button" onClick={generate}>Thử tải lại câu hỏi</button>}</div>}
      {answer && <div className={`answer-feedback ${answer.correct ? "success" : "wrong"}`} role="status"><h3>{answer.correct ? "Chính xác! Bạn đã ghi thêm một dấu chân." : `Chưa đúng rồi! Đáp án đúng là ${"ABCD"[answer.correctIndex]}.`}</h3><p>{answer.explanation}</p>{answer.fact && <details><summary>Xem dữ kiện lịch sử</summary><blockquote>{answer.fact}</blockquote>{answer.sources && <p className="fact-source">Nguồn: {answer.sources}</p>}</details>}<p className="next-hint">Mỗi lượt quét chỉ có một câu hỏi. Để nhận câu hỏi tiếp theo, bấm “Quét nhân vật tiếp” và quét lại mã QR.</p></div>}
    </section>
  </div><CharacterChat key={question?.id || "pending"} character={character} quizSessionId={question?.id} openChatSessionAction={openChatSessionAction} /></>;
}
