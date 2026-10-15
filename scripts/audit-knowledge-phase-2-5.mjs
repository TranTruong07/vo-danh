import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { facetEvidence } from "./knowledge/phase-2-5-evidence.ts";
import { normalizeKnowledgePhrase } from "../server/domain/knowledge.ts";
import { matchChatQuestion } from "../server/services/chat-matcher.ts";
import { auditCoverage, evaluateMatching, coverageMarkdown } from "./knowledge/phase-2-5-audit.mjs";
import { holdout } from "../tests/fixtures/knowledge-phase-2-5-holdout.mjs";

const read = path => JSON.parse(readFileSync(path, "utf8"));
const hash = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const { values } = parseArgs({ options: { json: { type: "string", default: "knowledge/coverage-audit-v4.json" }, report: { type: "string", default: "docs/knowledge-coverage-audit-v4.md" } }, strict: true });
const jsonPath = values.json, mdPath = values.report;
for (const path of [jsonPath, mdPath]) if (existsSync(path)) throw new Error(`Refusing to overwrite ${path}`);
const baseline = read("knowledge/coverage-audit.json"), old = read("knowledge/draft-questions-phase-2-v3.json"), next = read("knowledge/draft-questions-phase-2-v4.json");
const changes = read("knowledge/phase-2-5-changes.json");
const result = auditCoverage(baseline, old, next, facetEvidence);
const evaluate = (probes, questions) => evaluateMatching(probes, questions, matchChatQuestion, normalizeKnowledgePhrase);
const newExpected = { K057: "cmtt45-q053", K021: "cmtt45-q047", K041: "cmtt45-q050", K053: "cmtt45-q052" };
const development = baseline.expressionAudit.probes.map((probe, i) => ({
  id: `D${String(i + 1).padStart(2, "0")}`, category: "prior_audit_development", query: probe.query,
  expectedQuestionIds: probe.expectedQuestionIds.length ? probe.expectedQuestionIds : [newExpected[probe.unitId]],
  constraint: "supported_intent", mustNotAutoAnswer: false,
}));
const expressionAudit = {
  threshold: 0.25, fuzzyCanAnswer: false, productionCoveragePercent: null,
  holdout: { fixtureSha256: hash("tests/fixtures/knowledge-phase-2-5-holdout.mjs"), before: evaluate(holdout, old), after: evaluate(holdout, next) },
  development: { independent: false, before: evaluate(development, old), after: evaluate(development, next) },
};
const oldIds = new Set(old.map(q => q._id));
expressionAudit.holdout.candidateAvailability = Object.fromEntries([true, false].map(existed => {
  const selected = expressionAudit.holdout.after.results.filter(r => r.constraint === "supported_intent" && r.expectedQuestionIds.some(id => oldIds.has(id)) === existed);
  const ids = new Set(selected.map(r => r.id));
  return [existed ? "existingCandidates" : "newCandidates", {
    total: selected.length,
    beforeHits: expressionAudit.holdout.before.results.filter(r => ids.has(r.id) && r.expectedCandidateFound).length,
    afterHits: selected.filter(r => r.expectedCandidateFound).length,
  }];
}));
if (expressionAudit.holdout.after.declaredOverlap || expressionAudit.holdout.before.declaredOverlap) throw new Error("Holdout contaminated by declared phrases.");
if (expressionAudit.holdout.after.unsafeAutoAnswers) throw new Error("Unsafe automatic holdout answers.");
const inputPaths = ["docs/source/Tong-hop-kien-thuc.docx", "knowledge/extraction-manifest.json", "knowledge/draft-questions-phase-2-v3.json", "knowledge/draft-questions-phase-2-v4.json", "knowledge/coverage-audit.json", "docs/knowledge-coverage-audit.md", "knowledge/review-report-phase-2.md", "docs/knowledge-pipeline.md", "scripts/knowledge/phase-2-5-evidence.ts", "scripts/knowledge/phase-2-5.ts", "scripts/knowledge/phase-2-5-audit.mjs", "scripts/audit-knowledge-phase-2-5.mjs", "server/services/chat-matcher.ts", "server/domain/knowledge.ts", "tests/fixtures/knowledge-phase-2-5-holdout.mjs"];
const audit = {
  schemaVersion: 2, artifactType: "knowledge_coverage_audit", auditDate: "2026-10-14",
  reviewStatus: "analytical_proposal_not_historical_approval", humanReviewRequired: true, doNotImportAsKnowledge: true,
  inputFingerprints: inputPaths.map(path => ({ path, sha256: hash(path) })),
  methodology: { ...baseline.methodology, personaVerification: "Evaluate all four separately using unchanged-answer or retained-full-neutral evidence, plus manually annotated facet anchors. Full snapshots provided; not a historical approval.", fixedBaselineUnits: true, independentHistoricalVerification: false },
  before: baseline.summary, ...result,
  questionEvidence: next.map(q => ({ ...q, referencedUnitIds: result.units.filter(u => u.facets.some(f => Object.values(f.channelEvidence).some(e => e.some(item => item.questionId === q._id)))).map(u => u.id) })),
  sourceBlocks: baseline.sourceBlocks, sourceBlockDisposition: baseline.sourceBlockDisposition,
  changes, expressionAudit, warningReview: { inheritedCount: 18, resolvedByAudit: false, warnings: changes.warnings, inherited: changes.inheritedWarnings, sourceReconciliation: changes.sourceReconciliation },
};
writeFileSync(jsonPath, JSON.stringify(audit, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
writeFileSync(mdPath, coverageMarkdown(audit), { encoding: "utf8", flag: "wx" });
console.log(JSON.stringify({ coverage: result.summary, holdout: { before: expressionAudit.holdout.before.supportedTop3Hits, after: expressionAudit.holdout.after.supportedTop3Hits, of: expressionAudit.holdout.after.supportedIntentCount, exact: expressionAudit.holdout.after.exact, suggest: expressionAudit.holdout.after.suggest, none: expressionAudit.holdout.after.none }, developmentExact: expressionAudit.development.after.exact }));
