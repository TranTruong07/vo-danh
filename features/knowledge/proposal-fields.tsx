'use client';
import type { ProposalContent } from '@/server/domain/knowledge-generation';
import { PERSONA_FRAMES } from '@/server/domain/knowledge-generation';
import { KNOWLEDGE_CHARACTERS } from '@/server/domain/knowledge';
import { KNOWLEDGE_CHARACTER_LABELS } from '@/server/domain/knowledge-admin';

export default function ProposalFields({ value, onChange, notes, onNotes, disabled }: {
  value: ProposalContent; onChange: (value: ProposalContent) => void;
  notes: string; onNotes: (value: string) => void; disabled: boolean;
}) {
  return <>
    <label>Câu hỏi chính<textarea maxLength={500} value={value.canonicalQuestion} disabled={disabled} onChange={e => onChange({ ...value, canonicalQuestion: e.target.value })} /></label>
    <fieldset disabled={disabled}><legend>Cách hỏi tương đương (2–5 câu)</legend>
      {value.aliases.map((alias, index) => <div className="generation-alias" key={index}><label>Cách hỏi {index + 1}<input maxLength={500} value={alias} onChange={e => onChange({ ...value, aliases: value.aliases.map((v,i) => i === index ? e.target.value : v) })} /></label><button type="button" className="btn" disabled={value.aliases.length <= 2} onClick={() => onChange({ ...value, aliases: value.aliases.filter((_,i) => i !== index) })} aria-label={`Xóa cách hỏi ${index + 1}`}>Xóa</button></div>)}
      <button type="button" className="btn" disabled={value.aliases.length >= 5} onClick={() => onChange({ ...value, aliases: [...value.aliases, ''] })}>Thêm cách hỏi</button>
    </fieldset>
    <label>Đáp án trung tính — trích nguyên văn phần kiến thức từ nguồn<textarea rows={5} maxLength={12000} value={value.neutralAnswer} disabled={disabled} onChange={e => onChange({ ...value, neutralAnswer: e.target.value })} /></label>
    {KNOWLEDGE_CHARACTERS.map(k => <label key={k}>{KNOWLEDGE_CHARACTER_LABELS[k]}<textarea rows={4} maxLength={12000} value={value.characterAnswers[k]} disabled={disabled} onChange={e => onChange({ ...value, characterAnswers: { ...value.characterAnswers, [k]: e.target.value } })} />
      <select aria-label={`Chọn lời dẫn ${KNOWLEDGE_CHARACTER_LABELS[k]}`} value="" disabled={disabled} onChange={e => { if (e.target.value) onChange({ ...value, characterAnswers: { ...value.characterAnswers, [k]: e.target.value + value.neutralAnswer } }); }}><option value="">Chọn lời dẫn + giữ nguyên phần kiến thức…</option>{PERSONA_FRAMES[k].map(frame => <option key={frame} value={frame}>{frame}</option>)}</select>
    </label>)}
    <label>Ghi chú biên tập<textarea maxLength={2000} value={notes} disabled={disabled} onChange={e => onNotes(e.target.value)} /></label>
  </>;
}
