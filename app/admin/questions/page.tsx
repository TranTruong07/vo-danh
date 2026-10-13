import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";
import { isCharacterId } from "@/server/domain/character";
import { loadQuestionList } from "@/server/services/character-questions";
import CharacterPicker from "@/features/questions/character-picker";
import DeleteQuestionButton from "@/features/questions/delete-question-button";

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ q?: string; characterId?: string; page?: string; saved?: string }> }) {
  if (!await hasAdminSession()) redirect("/?auth=login");
  const params = await searchParams;
  const search = (typeof params.q === "string" ? params.q : "").trim().slice(0, 120);
  const characterId = typeof params.characterId === "string" && isCharacterId(params.characterId) ? params.characterId : "";
  const page = Math.min(10000, Math.max(1, Math.floor(Number(params.page) || 1)));
  const { items, total, choices } = await loadQuestionList(page, search, characterId);
  const pages = Math.max(1, Math.ceil(total / 10));
  const href = (pageNumber: number) => `/admin/questions?${new URLSearchParams({ q: search, characterId, page: String(pageNumber) })}`;
  if (page > pages) redirect(href(pages));
  const character = choices.find(choice => choice.id === characterId);
  const createHref = `/admin/questions/new${characterId ? `?characterId=${characterId}` : ""}`;
  const questionTotal = choices.reduce((sum, row) => sum + row.questionCount, 0);
  return <>
    <div className="question-page-heading"><div><p className="dashboard-eyebrow">KHO CÂU HỎI</p><h1>Câu hỏi theo nhân vật</h1><p className="subtitle">Soạn câu hỏi, chọn đáp án đúng và gửi lời giải đến người chơi.</p></div><div className="btn-row"><Link className="btn" href={`/admin/questions/import${characterId ? `?characterId=${characterId}` : ""}`}>Nhập từ Excel</Link><Link className="btn primary" href={createHref}>+ Tạo câu hỏi</Link></div></div>
    <div className="question-overview"><span><strong>{questionTotal}</strong> câu hỏi trong kho</span><span><strong>{choices.filter(choice => choice.questionCount > 0).length} / {choices.length}</strong> nhân vật có câu hỏi</span><span>4 đáp án · 1 lựa chọn đúng</span></div>
    {params.saved === "1" && <p className="question-notice" role="status">Đã lưu câu hỏi. Câu hỏi sẵn sàng cho lượt chơi tiếp theo.</p>}
    <form key={`${search}:${characterId}`} action="/admin/questions" className="card question-filters">
      <label>Tìm theo câu hỏi<input name="q" type="search" defaultValue={search} maxLength={120} placeholder="Nhập từ khóa trong câu hỏi…" /></label>
      <CharacterPicker choices={choices} initialValue={characterId} />
      <div className="btn-row"><button className="btn primary">Áp dụng bộ lọc</button>{(search || characterId) && <Link href="/admin/questions" className="btn">Xóa bộ lọc</Link>}</div>
    </form>
    <div className="question-results-heading"><div><h2>{character ? `Câu hỏi của ${character.name}` : "Danh sách câu hỏi"}</h2><p>{total} câu hỏi{search && ` khớp “${search}”`}</p></div>{character && <Link href={`/admin/characters/${character.id}`} className="back-link">Xem nhân vật ↗</Link>}</div>
    <section className="question-list" aria-label="Danh sách câu hỏi">{items.map((item, index) => <article className="card question-card" key={item.id}>
      <div className="question-card-top"><Link className="question-character-tag" href={`/admin/questions?characterId=${item.characterId}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.characterImage && <img src={item.characterImage} alt="" loading="lazy" referrerPolicy="no-referrer" />}<span>{item.characterName}</span></Link>
        <span className="question-card-date">Cập nhật {new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(item.updatedAt))}</span></div>
      <h3><span>{String((page - 1) * 10 + index + 1).padStart(2, "0")}</span>{item.question}</h3>
      <div className="question-card-bottom"><span className="question-answer-summary">4 đáp án <i>·</i> Đáp án đúng: <strong>{"ABCD"[item.correctIndex]}</strong></span><div className="btn-row"><Link className="btn" href={`/admin/questions/${item.id}/edit`}>Chỉnh sửa</Link><DeleteQuestionButton id={item.id} question={item.question} /></div></div>
      <details className="question-card-detail"><summary>Xem đáp án & phản hồi</summary><div className="question-option-grid">{item.answers.map((answer, answerIndex) => <p key={answerIndex} className={answerIndex === item.correctIndex ? "correct" : ""}><strong>{"ABCD"[answerIndex]}</strong><span>{answer}</span>{answerIndex === item.correctIndex && <b aria-label="Đáp án đúng">✓</b>}</p>)}</div><div className="question-feedback-grid"><div><h4>Khi trả lời đúng</h4><p>{item.correctFeedback}</p></div><div><h4>Khi trả lời sai</h4><p>{item.incorrectFeedback}</p></div></div></details>
    </article>)}</section>
    {!items.length && <div className="card question-empty"><span aria-hidden="true">?</span><h2>{search ? "Không tìm thấy câu hỏi phù hợp" : "Chưa có câu hỏi"}</h2><p>{search ? "Thử từ khóa khác hoặc xóa bộ lọc để xem toàn bộ câu hỏi." : character ? `Thêm câu hỏi đầu tiên cho ${character.name}.` : "Chọn nhân vật và tạo câu hỏi đầu tiên cho bàn chơi."}</p><Link className="btn primary" href={search ? "/admin/questions" : createHref}>{search ? "Xem tất cả câu hỏi" : "Tạo câu hỏi đầu tiên"}</Link></div>}
    <nav className="question-pagination" aria-label="Phân trang câu hỏi"><span>Trang {page} / {pages}</span><div className="btn-row">{page > 1 && <Link className="btn" href={href(page - 1)}>← Trang trước</Link>}{page < pages && <Link className="btn" href={href(page + 1)}>Trang sau →</Link>}</div></nav>
  </>;
}
