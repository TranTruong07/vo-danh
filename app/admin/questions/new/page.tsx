import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";
import { loadQuestionEditor } from "@/server/services/character-questions";
import QuestionForm from "@/features/questions/question-form";

export default async function NewQuestionPage({ searchParams }: { searchParams: Promise<{ characterId?: string }> }) {
  if (!await hasAdminSession()) redirect("/?auth=login");
  const { choices } = await loadQuestionEditor();
  const selected = (await searchParams).characterId;
  const characterId = choices.some(choice => choice.id === selected) ? selected : "";
  return <><Link className="back-link" href={`/admin/questions${characterId ? `?characterId=${characterId}` : ""}`}>← Danh sách câu hỏi</Link><h1>Tạo câu hỏi</h1><p className="subtitle">Tạo một thử thách mới cho nhân vật lịch sử của bạn.</p>
    {choices.length ? <QuestionForm choices={choices} characterId={characterId} /> : <div className="card question-empty"><h2>Hãy tạo nhân vật trước</h2><p>Mỗi câu hỏi cần thuộc về một nhân vật.</p><Link className="btn primary" href="/admin/characters/new">Tạo nhân vật</Link></div>}
  </>;
}
