import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";
import { loadQuestionEditor } from "@/server/services/character-questions";
import QuestionImport from "@/features/questions/question-import";

export default async function ImportQuestionsPage({ searchParams }: { searchParams: Promise<{ characterId?: string }> }) {
  if (!await hasAdminSession()) redirect("/?auth=login");
  const { choices } = await loadQuestionEditor();
  const selected = (await searchParams).characterId;
  const characterId = choices.find(choice => choice.id === selected)?.id || "";
  return <>
    <Link className="back-link" href={`/admin/questions${characterId ? `?characterId=${characterId}` : ""}`}>← Danh sách câu hỏi</Link>
    <div className="question-page-heading"><div><p className="dashboard-eyebrow">NHẬP CÂU HỎI HÀNG LOẠT</p><h1>Thêm câu hỏi từ Excel</h1><p className="subtitle">Chuẩn bị một file, thêm nhiều câu hỏi cho nhân vật trong vài bước.</p></div></div>
    {choices.length ? <QuestionImport choices={choices} characterId={characterId} /> : <div className="card question-empty"><h2>Hãy tạo nhân vật trước</h2><p>Mỗi bộ câu hỏi cần thuộc về một nhân vật.</p><Link className="btn primary" href="/admin/characters/new">Tạo nhân vật</Link></div>}
  </>;
}
