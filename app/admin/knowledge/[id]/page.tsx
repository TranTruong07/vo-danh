import { notFound, redirect } from "next/navigation";
import { hasAdminSession } from "@/server/services/admin-auth";
import { adminKnowledgeDetail } from "@/server/services/knowledge-admin";
import { KnowledgeAdminError } from "@/server/domain/knowledge-admin";
import KnowledgeDetail from "@/features/knowledge/knowledge-detail";
import "../knowledge.css";

export default async function KnowledgeDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ preview?: string; revision?: string }> }) {
  if (!await hasAdminSession()) redirect("/?auth=login");
  const { id } = await params, query = await searchParams;
  let data;
  try { data = await adminKnowledgeDetail(id, typeof query.revision === "string" ? query.revision : undefined, query.preview === "1"); }
  catch (error) { if (error instanceof KnowledgeAdminError && [400, 404].includes(error.status)) notFound(); throw error; }
  return <KnowledgeDetail key={`${id}:${query.revision ?? "latest"}`} data={data} />;
}
