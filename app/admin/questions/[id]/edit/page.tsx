import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";
import { loadQuestionEditor } from "@/server/services/character-questions";
import QuestionForm from "@/features/questions/question-form";

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  if (!await hasAdminSession()) redirect("/?auth=login");
  const { question, choices } = await loadQuestionEditor((await params).id);
  if (!question) notFound();
  return <><Link className="back-link" href={`/admin/questions?characterId=${question.characterId}`}>← Danh sách câu hỏi</Link><h1>Chỉnh sửa câu hỏi</h1><p className="subtitle">Thay đổi được áp dụng cho các lượt chơi mới.</p><QuestionForm key={question.id + question.updatedAt} question={question} choices={choices} /></>;
}
