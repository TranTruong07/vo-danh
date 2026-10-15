import "server-only";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import type { ExtractionManifest } from "@/server/domain/knowledge";
import { KnowledgeAdminError } from "@/server/domain/knowledge-admin";
import { SOURCE_SHA256 } from "@/scripts/knowledge/draft-outline";

// Fixed server paths only. These files are never served from public/ or accepted from a request.
export async function readKnowledgeManifest(): Promise<ExtractionManifest> {
  try {
    const [docx, raw] = await Promise.all([readFile(join(process.cwd(), "docs/source/Tong-hop-kien-thuc.docx")), readFile(join(process.cwd(), "knowledge/extraction-manifest.json"), "utf8")]);
    const manifest = JSON.parse(raw) as ExtractionManifest;
    if (createHash("sha256").update(docx).digest("hex") !== SOURCE_SHA256 || manifest.sourceSha256 !== SOURCE_SHA256 || manifest.schemaVersion !== 1 || !Array.isArray(manifest.blocks)) throw new Error("source changed");
    return manifest;
  } catch { throw new KnowledgeAdminError("SOURCE_UNAVAILABLE", "Chưa đối chiếu được tài liệu nguồn trên server. Kiểm tra bộ nguồn trước khi duyệt hoặc công bố.", 503); }
}
export async function readKnowledgePreview(): Promise<unknown> {
  try { return JSON.parse(await readFile(join(process.cwd(), "knowledge/draft-questions-phase-2-v3.json"), "utf8")); }
  catch { throw new KnowledgeAdminError("PREVIEW_UNAVAILABLE", "Không tìm thấy bộ nháp revision 3 để xem trước.", 503); }
}
