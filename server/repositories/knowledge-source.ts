import "server-only";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import type { ExtractionManifest, KnowledgeSource } from "@/server/domain/knowledge";
import { sourceManifest } from "@/server/domain/knowledge-generation";
import { generationSource } from "./knowledge-generation";
import { KnowledgeAdminError } from "@/server/domain/knowledge-admin";
import { SOURCE_SHA256 } from "@/scripts/knowledge/draft-outline";

// Fixed server paths only. These files are never served from public/ or accepted from a request.
export async function readKnowledgeManifest(reference?: KnowledgeSource): Promise<ExtractionManifest> {
  if (reference?.blockIds[0] && /^[a-f0-9-]{36}:\d+$/.test(reference.blockIds[0])) {
    try {
      const { source, chunks } = await generationSource(reference.blockIds[0].split(':')[0]);
      if (source.sourceStatus !== 'confirmed' || !source.confirmedBy || source.checksum !== reference.sourceSha256 || source.originalFilename !== reference.document) throw new Error('source mismatch');
      return sourceManifest(source, chunks);
    } catch { throw new KnowledgeAdminError('SOURCE_UNAVAILABLE', 'Chưa đối chiếu được nguồn đã xác nhận của revision này.', 503); }
  }
  try {
    const isNew = reference?.document === 'Tong-hop-kien-thuc-moi.docx';
    const document = isNew ? 'Tong-hop-kien-thuc-moi.docx' : 'Tong-hop-kien-thuc.docx';
    const hash = isNew ? 'fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e' : SOURCE_SHA256;
    if (reference && (reference.document !== document || reference.sourceSha256 !== hash)) throw new Error('unknown source');
    const [docx, raw] = await Promise.all([readFile(join(process.cwd(), 'docs/source', document)), readFile(join(process.cwd(), isNew ? 'knowledge/new-source-manifest.json' : 'knowledge/extraction-manifest.json'), 'utf8')]);
    const manifest = JSON.parse(raw) as ExtractionManifest;
    if (createHash("sha256").update(docx).digest("hex") !== hash || manifest.sourceSha256 !== hash || manifest.document !== document || manifest.schemaVersion !== 1 || !Array.isArray(manifest.blocks)) throw new Error("source changed");
    return manifest;
  } catch { throw new KnowledgeAdminError("SOURCE_UNAVAILABLE", "Chưa đối chiếu được tài liệu nguồn trên server. Kiểm tra bộ nguồn trước khi duyệt hoặc công bố.", 503); }
}
export async function readKnowledgePreview(): Promise<unknown> {
  try { return JSON.parse(await readFile(join(process.cwd(), "knowledge/new-questions-draft.json"), "utf8")); }
  catch { throw new KnowledgeAdminError("PREVIEW_UNAVAILABLE", "Chưa có bộ kiến thức mới để xem trước.", 503); }
}
