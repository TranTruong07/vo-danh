"use client";

import { useState } from "react";
import type { QuestionCharacterChoice } from "@/server/domain/character-question";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLocaleLowerCase("vi");
export default function CharacterPicker({ choices, initialValue = "", required = false, value, onChange }: { choices: QuestionCharacterChoice[]; initialValue?: string; required?: boolean; value?: string; onChange?: (value: string) => void }) {
  const [search, setSearch] = useState("");
  const [localSelected, setSelected] = useState(initialValue);
  const selected = value ?? localSelected;
  const filtered = choices.filter(choice => choice.id === selected || normalize(choice.name).includes(normalize(search.trim())));
  return <div className="question-character-picker">
    <label>Tìm nhanh tên nhân vật<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Gõ tên, có hoặc không dấu…" maxLength={120} /></label>
    <label>Nhân vật<select name="characterId" aria-label="Nhân vật" value={selected} onChange={event => { setSelected(event.target.value); onChange?.(event.target.value); }} required={required}>
      <option value="">{required ? "Chọn nhân vật…" : "Tất cả nhân vật"}</option>
      {selected && !choices.some(choice => choice.id === selected) && <option value={selected}>Nhân vật không còn tồn tại</option>}
      {filtered.map(choice => <option key={choice.id} value={choice.id}>{choice.name} · {choice.questionCount} câu hỏi</option>)}
    </select></label>
    {search && <small className="question-picker-result">{filtered.filter(choice => normalize(choice.name).includes(normalize(search.trim()))).length} nhân vật khớp tên</small>}
  </div>;
}
