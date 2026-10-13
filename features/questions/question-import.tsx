"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { QuestionCharacterChoice } from "@/server/domain/character-question";
import { QUESTION_IMPORT_MAX_BYTES, type QuestionImportReport, type QuestionImportRow } from "@/server/domain/question-import";
import { importQuestionFileAction } from "@/actions/question-import";
import CharacterPicker from "./character-picker";

const statusLabels = { ready: "Hợp lệ", duplicate: "Trùng lặp", invalid: "Cần sửa", imported: "Đã nhập" };

export default function QuestionImport({ choices, characterId }: { choices: QuestionCharacterChoice[]; characterId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState(characterId);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<QuestionImportReport | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [committing, setCommitting] = useState(false);
  const [filter, setFilter] = useState("all");
  const busy = useRef(false);
  const count = (status: QuestionImportRow["status"]) => report?.rows.filter(row => row.status === status).length || 0;
  function reset() { setReport(null); setMessage(""); setFilter("all"); }
  function processFile(commit: boolean) {
    if (busy.current || !file || !selected) return;
    const form = new FormData(); form.set("characterId", selected); form.set("file", file);
    busy.current = true; setCommitting(commit); setMessage("");
    startTransition(async () => {
      try {
        const result = await importQuestionFileAction(form, commit);
        if (!result.ok) { setMessage(result.message); setReport(null); return; }
        setReport(result.data); setFilter("all");
        if (commit) router.refresh();
      } catch {
        setReport(null);
        setMessage("Kết nối bị gián đoạn. Hãy kiểm tra lại file trước khi nhập tiếp; các câu đã lưu sẽ được nhận diện là trùng.");
      } finally { busy.current = false; }
    });
  }
  const visibleRows = report?.rows.filter(row => filter === "all" || row.status === filter) || [];
  return <div className="question-import">
    <section className="card question-import-template"><div className="question-step"><span>1</span><div><h2>Tải file mẫu & điền câu hỏi</h2><p>Mỗi dòng gồm câu hỏi, 4 đáp án A–D, đáp án đúng và phản hồi khi trả lời đúng / sai.</p></div></div>
      <a className="btn" href="/admin/questions/template" download>Tải Excel mẫu ↓</a>
      <p className="question-import-help">File có dòng minh họa và hướng dẫn. Thay hoặc xóa dòng [MẪU], giữ nguyên tên trang “Câu hỏi” và tiêu đề các cột.</p>
    </section>
    <form className="card question-import-upload" onSubmit={event => { event.preventDefault(); processFile(false); }}>
      <fieldset disabled={pending}>
        <div className="question-step"><span>2</span><div><h2>Chọn nhân vật & tải file</h2><p>Tất cả câu hỏi trong file sẽ thuộc về nhân vật bạn chọn.</p></div></div>
        <CharacterPicker choices={choices} value={selected} onChange={value => { setSelected(value); reset(); }} required />
        <label className="question-import-file">File câu hỏi (.xlsx)<input type="file" name="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required onChange={event => {
          reset(); const next = event.target.files?.[0] || null;
          if (next && (!/\.xlsx$/i.test(next.name) || next.size > QUESTION_IMPORT_MAX_BYTES || !next.size)) { setFile(null); setMessage("Chọn file .xlsx không rỗng, dung lượng tối đa 2 MB."); event.target.value = ""; return; }
          setFile(next);
        }} /><span>Tối đa 2 MB · 500 câu hỏi / file</span></label>
        <button className="btn primary" type="submit" disabled={!file || !selected}>{pending && !committing ? "Đang kiểm tra…" : "Kiểm tra file"}</button>
      </fieldset>
    </form>
    {message && <p className="msg error" role="alert">{message}</p>}
    {report && <section className="card question-import-review" aria-label="Kết quả kiểm tra file">
      <div className="question-step"><span>3</span><div><h2>{report.committed ? "Kết quả nhập câu hỏi" : "Kiểm tra trước khi nhập"}</h2><p>Nhân vật: <strong>{report.characterName}</strong> · {report.rows.length} dòng dữ liệu</p></div></div>
      <div className="question-import-summary" role="status"><span><strong>{count(report.committed ? "imported" : "ready")}</strong> {report.committed ? "đã nhập" : "hợp lệ"}</span><span><strong>{count("duplicate")}</strong> trùng lặp</span><span><strong>{count("invalid")}</strong> cần sửa</span></div>
      <p className="question-import-help">{report.committed ? "Các dòng trùng hoặc lỗi đã được bỏ qua. Bạn có thể sửa file và kiểm tra lại để nhập các câu còn thiếu." : "Chỉ nhập các dòng hợp lệ. Câu trùng trong file hoặc trong kho của nhân vật sẽ được bỏ qua; câu hỏi đã có không bị ghi đè."}</p>
      <div className="question-import-toolbar"><label>Hiển thị<select aria-label="Hiển thị" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">Tất cả dòng</option><option value={report.committed ? "imported" : "ready"}>{report.committed ? "Đã nhập" : "Hợp lệ"}</option><option value="duplicate">Trùng lặp</option><option value="invalid">Cần sửa</option></select></label>
        {report.committed ? <Link className="btn primary" href={`/admin/questions?characterId=${report.characterId}`}>Xem danh sách câu hỏi →</Link> : <button className="btn primary" disabled={pending || !count("ready")} onClick={() => processFile(true)}>{pending ? "Đang nhập…" : `Nhập ${count("ready")} câu hỏi hợp lệ`}</button>}
      </div>
      <div className="question-import-table-wrap"><table className="question-import-table"><caption className="sr-only">Chi tiết từng dòng trong file Excel</caption><thead><tr><th scope="col">Dòng Excel</th><th scope="col">Câu hỏi & đáp án</th><th scope="col">Kết quả</th></tr></thead><tbody>{visibleRows.map(row => <tr key={row.row}><td>{row.row}</td><td><p>{row.question || "Không đọc được nội dung"}</p>{row.data && <details><summary>Xem đáp án & phản hồi</summary><ol type="A">{row.data.answers.map((answer, index) => <li key={index}>{answer}{row.data?.correctIndex === index && <strong> ✓ Đáp án đúng</strong>}</li>)}</ol><p><strong>Đúng:</strong> {row.data.correctFeedback}</p><p><strong>Sai:</strong> {row.data.incorrectFeedback}</p></details>}</td><td><span className={`question-import-badge ${row.status}`}>{statusLabels[row.status]}</span><p>{row.message}</p></td></tr>)}</tbody></table>{!visibleRows.length && <p className="question-import-help">Không có dòng nào trong nhóm này.</p>}</div>
    </section>}
  </div>;
}
