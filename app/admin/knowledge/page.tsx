import { redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";
import { adminKnowledgeList } from "@/server/services/knowledge-admin";
import KnowledgeList from "@/features/knowledge/knowledge-list";
import "./knowledge.css";

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ preview?: string; q?: string }> }) {
  if (!await hasAdminSession()) redirect("/?auth=login");
  const query = await searchParams;
  return <KnowledgeList data={await adminKnowledgeList(query.preview === "1")} initialQuery={typeof query.q === "string" ? query.q.slice(0, 120) : ""} />;
}
