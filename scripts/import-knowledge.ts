import { loadEnvConfig } from "@next/env";
import { getMongoClient } from "@/lib/db/client";
import { validateKnowledge } from "@/server/services/knowledge-validation";
import { draftRevision, knowledgeBatchId, planKnowledgeImport } from "@/server/services/knowledge-import";
import { ensureKnowledgeImportIndexes, ensureKnowledgeLogicalQuestion, insertKnowledgeDraft, readKnowledgeImportState } from "@/server/repositories/knowledge-import";
import { checkedManifest, options, readJson, writeJson } from "./knowledge/common";

async function main() {
  const args = options({ "dry-run": { type: "boolean" }, apply: { type: "boolean" }, report: { type: "string" }, "required-version": { type: "string" } });
  if (args.apply && args["dry-run"]) throw new Error("Chọn --dry-run hoặc --apply, không đồng thời.");
  const manifest = checkedManifest(String(args.source), String(args.manifest));
  const validation = validateKnowledge(readJson(String(args.file)), manifest);
  if (validation.errors.length) { console.error(validation.errors); process.exitCode = 1; return; }
  const drafts = validation.records;
  if (args["required-version"] !== undefined && (!/^[1-9]\d*$/.test(String(args["required-version"])) || drafts.some(row => row.version !== Number(args["required-version"])))) throw new Error("File không đúng revision bắt buộc; chưa đọc hoặc ghi DB.");
  if (drafts.some(row => row.status !== "draft" || row.reviewedAt !== undefined || row.reviewedBy !== undefined || row.rejectionReason !== undefined)) throw new Error("Import chỉ nhận draft không kèm thông tin duyệt.");
  loadEnvConfig(process.cwd());
  // DB connection errors must not leak connection strings, credentials or stack traces.
  try {
    const state = await readKnowledgeImportState();
    const actions = planKnowledgeImport(drafts, state.questions, state.revisions);
    const existing = state.revisions.map(row => ({ ...row, _id: row.questionId }));
    const collisions = new Map<string, Set<string>>();
    for (const row of [...existing, ...drafts]) for (const phrase of row.normalizedPhrases) {
      const ids = collisions.get(phrase) ?? new Set<string>(); ids.add(row._id); collisions.set(phrase, ids);
    }
    const duplicateAliases = [...collisions.values()].filter(ids => ids.size > 1).map(ids => [...ids]);
    const report = { mode: args.apply ? "apply" : "dry-run", batchId: knowledgeBatchId(drafts), actions,
      duplicateAliases, warnings: validation.warnings, writes: 0, published: 0, approved: 0 };
    const reportPath = String(args.report || "knowledge/import-report.json");
    writeJson(reportPath, report);
    if (actions.some(action => action.action === "conflict")) { console.error(`Import có xung đột; không ghi DB. Xem ${reportPath}`); process.exitCode = 1; return; }
    if (args.apply) {
      await ensureKnowledgeImportIndexes();
      const now = new Date();
      for (const [index, draft] of drafts.entries()) {
        const question = { _id: draft._id, topicId: draft.topicId, createdAt: now, updatedAt: now };
        if (actions[index].action === "skip") { await ensureKnowledgeLogicalQuestion(question); continue; }
        // A concurrent insert/approval cannot be overwritten: insertOne fails on the unique key.
        await insertKnowledgeDraft(question, draftRevision(draft, report.batchId, now));
        report.writes++;
        writeJson(reportPath, report);
      }
    }
    console.log(JSON.stringify({ mode: report.mode, insertsPlanned: actions.filter(action => action.action === "insert_draft").length, skips: actions.filter(action => action.action === "skip").length, writes: report.writes, approved: 0, published: 0, report: reportPath }));
  } catch { console.error("Không hoàn tất import MongoDB. Không ghi đè revision; nếu --apply bị gián đoạn, kiểm tra báo cáo rồi chạy dry-run lại. Không có thao tác publish."); process.exitCode = 1; }
  finally { await (await getMongoClient().catch(() => null))?.close(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Không chuẩn bị được import."); process.exitCode = 1; });
