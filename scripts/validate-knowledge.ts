import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { checkedManifest, options, readJson, reviewReport, writeJson } from "./knowledge/common";
import { validateKnowledge } from "@/server/services/knowledge-validation";

try {
  const args = options({ report: { type: "string" } });
  const manifest = checkedManifest(String(args.source), String(args.manifest));
  const result = validateKnowledge(readJson(String(args.file)), manifest);
  const report = String(args.report || "knowledge/review-report.md");
  mkdirSync(dirname(report), { recursive: true });
  writeFileSync(report, reviewReport(result.records, result.errors, result.warnings, manifest), "utf8");
  writeJson(report.replace(/\.md$/, "") + ".json", { validRecords: result.records.length, errors: result.errors, warnings: result.warnings });
  console.log(JSON.stringify({ records: result.records.length, errors: result.errors.length, warnings: result.warnings.length, report, approvedByTool: 0 }));
  if (result.errors.length) process.exitCode = 1;
} catch (error) { console.error(error instanceof Error ? error.message : "Không kiểm tra được kiến thức."); process.exitCode = 1; }
