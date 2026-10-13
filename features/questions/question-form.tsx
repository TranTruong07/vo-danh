"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CharacterQuestionRecord, QuestionCharacterChoice } from "@/server/domain/character-question";
import { saveQuestionAction } from "@/actions/character-questions";
import CharacterPicker from "./character-picker";


export default function QuestionForm({ question, choices, characterId = "" }: { question?: CharacterQuestionRecord | null; choices: QuestionCharacterChoice[]; characterId?: string }) {
  const router = useRouter();
  const [correct, setCorrect] = useState(question?.correctIndex ?? -1);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [selectedCharacter, setSelectedCharacter] = useState(question?.characterId || characterId);
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    startTransition(async () => {
      try {
        const result = await saveQuestionAction(question?.id || null, form);
        if (!result.ok) { setMessage(result.message); return; }
        router.push(`/admin/questions?characterId=${result.data.characterId}&saved=1`);
      } catch { setMessage("Không thể kết nối. Nội dung đã nhập vẫn được giữ lại, hãy thử lưu lại."); }
    });
  }
  return <form className="question-editor" onSubmit={save}>
    <fieldset disabled={pending}>
      <section className="card"><div className="question-step"><span>1</span><div><h2>Nhân vật & câu hỏi</h2><p>Chọn nhân vật và nhập câu hỏi ngắn gọn, rõ ràng.</p></div></div>
        <CharacterPicker choices={choices} value={selectedCharacter} onChange={setSelectedCharacter} required />
        <label><span id="question-text-label">Nội dung câu hỏi</span><textarea name="question" aria-labelledby="question-text-label" defaultValue={question?.question} required minLength={10} maxLength={500} rows={3} placeholder="Ví dụ: Ngô Quyền đánh thắng quân Nam Hán trên con sông nào?" /></label>
      </section>
      <section className="card"><div className="question-step"><span>2</span><div><h2>Bốn đáp án</h2><p>Nhập đủ 4 đáp án khác nhau và đánh dấu một đáp án đúng.</p></div></div>
        <div className="question-answer-editor">{[0, 1, 2, 3].map(index => <div key={index} className={`question-answer-input ${correct === index ? "is-correct" : ""}`}>
          <label className="question-correct-choice"><input type="radio" name="correctIndex" value={index} checked={correct === index} onChange={() => setCorrect(index)} required aria-label={`Chọn ${"ABCD"[index]} là đáp án đúng`} /><span>{"ABCD"[index]}</span></label>
          <label className="question-answer-text">Đáp án {"ABCD"[index]}<input name={`answer${index}`} aria-label={`Đáp án ${"ABCD"[index]}`} defaultValue={question?.answers[index]} required maxLength={250} placeholder={`Nhập đáp án ${"ABCD"[index]}…`} /></label>
          {correct === index && <span className="question-correct-badge">✓ Đáp án đúng</span>}
        </div>)}</div>
      </section>
      <section className="card"><div className="question-step"><span>3</span><div><h2>Phản hồi cho người chơi</h2><p>Nội dung này xuất hiện sau khi người chơi chốt đáp án.</p></div></div>
        <div className="question-feedback-grid"><label className="question-feedback-correct"><span id="correct-feedback-label">Khi trả lời đúng</span><textarea name="correctFeedback" aria-labelledby="correct-feedback-label" defaultValue={question?.correctFeedback} required maxLength={1200} rows={4} placeholder="Chính xác! Hãy bổ sung lời giải để người chơi ghi nhớ…" /></label>
          <label className="question-feedback-incorrect"><span id="incorrect-feedback-label">Khi trả lời sai</span><textarea name="incorrectFeedback" aria-labelledby="incorrect-feedback-label" defaultValue={question?.incorrectFeedback} required maxLength={1200} rows={4} placeholder="Chưa đúng rồi. Hãy giải thích đáp án để người chơi hiểu hơn…" /></label></div>
      </section>
      <div className="question-editor-actions"><button className="btn" type="button" onClick={() => router.push(`/admin/questions${selectedCharacter ? `?characterId=${selectedCharacter}` : ""}`)}>Hủy</button><button className="btn primary" type="submit">{pending ? "Đang lưu…" : "Lưu câu hỏi"}</button></div>
    </fieldset>
    {message && <p className="msg error" role="alert">{message}</p>}
  </form>;
}
