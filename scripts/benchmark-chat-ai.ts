import { loadEnvConfig } from "@next/env";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { getMongoClient } from "../lib/db/client";
import { readPublishedChatIndex } from "../server/repositories/chat-knowledge";
import { matchChatQuestion } from "../server/services/chat-matcher";
import { retrieveAiCandidates } from "../server/services/chat-ai-candidates";
import { normalizeKnowledgePhrase } from "../server/domain/knowledge";
import { CHAT_AI_BENCHMARK } from "../tests/fixtures/chat-ai-benchmark";

loadEnvConfig(process.cwd());
// This benchmark NEVER calls Gemini. Live smoke is a separate, explicitly bounded command.
async function main() {
  const manifest = JSON.parse(readFileSync("knowledge/extraction-manifest.json", "utf8")) as {
    sourceSha256: string; blocks: { id: string; text: string }[];
  };
  const snapshot = JSON.parse(readFileSync("knowledge/draft-questions-phase-2-v4.json", "utf8")) as {
    _id: string; canonicalQuestion: string; source: { document: string; sectionId: string; excerpt: string; blockIds: string[]; sourceSha256: string };
  }[];
  const sourceHash = createHash("sha256").update(readFileSync("docs/source/Tong-hop-kien-thuc.docx")).digest("hex");
  if (sourceHash !== manifest.sourceSha256) throw new Error("Source changed; review labels first");
  const index = await readPublishedChatIndex();
  const clean = (value: string) => value.normalize("NFC").replace(/\s+/g, " ").trim();
  const results = CHAT_AI_BENCHMARK.map(sample => {
    const source = snapshot.find(row => row._id === sample.expectedQuestionId);
    const published = index.find(row => row.questionId === sample.expectedQuestionId);
    if (sample.expectedQuestionId && (!source || !published)) throw new Error("Benchmark ID unavailable");
    if (source && (source.source.sourceSha256 !== sourceHash || clean(source.source.excerpt) !== clean(source.source.blockIds.map(id => manifest.blocks.find(block => block.id === id)?.text || "").join("\n")))) {
      throw new Error(`Source locator mismatch ${source._id}`);
    }
    const start = performance.now();
    const match = matchChatQuestion(sample.message, index);
    const latencyMs = performance.now() - start;
    const ids = match.type === "exact" ? [match.entry.questionId] : match.type === "suggest" ? match.suggestions.map(row => row.questionId) : [];
    const candidates = retrieveAiCandidates(sample.message, index, match, 8).map(row => row.questionId);
    return { ...sample, needsReview: sample.needsReview || !!(source && published && source.canonicalQuestion !== published.canonicalQuestion),
      source: source ? { document: source.source.document, sectionId: source.source.sectionId, blockIds: source.source.blockIds, sourceSha256: sourceHash } : { document: "Tong-hop-kien-thuc.docx", sectionId: "I–X", sourceSha256: sourceHash },
      matchesExistingPhrase: index.some(row => [row.canonicalQuestion, ...row.aliases].some(phrase => normalizeKnowledgePhrase(phrase) === normalizeKnowledgePhrase(sample.message))),
      legacyIds: ids, legacyType: match.type, candidateIds: candidates, latencyMs };
  });
  const scored = results.filter(row => !row.needsReview), positives = scored.filter(row => row.expectedQuestionId), negatives = scored.filter(row => !row.expectedQuestionId);
  const ratio = (count: number, total: number) => total ? count / total : null;
  const noPredicted = scored.filter(row => !row.legacyIds.length);
  const trueNoMatch = noPredicted.filter(row => !row.expectedQuestionId).length;
  const latencies = scored.map(row => row.latencyMs).sort((a, b) => a - b);
  const metrics = {
    n: scored.length, positives: positives.length, negatives: negatives.length,
    top1Accuracy: ratio(scored.filter(row => (row.legacyIds[0] || null) === row.expectedQuestionId).length, scored.length),
    positiveTop1Accuracy: ratio(positives.filter(row => row.legacyIds[0] === row.expectedQuestionId).length, positives.length),
    recallAt3: ratio(positives.filter(row => row.legacyIds.includes(row.expectedQuestionId!)).length, positives.length),
    candidateRecallAt8: ratio(positives.filter(row => row.candidateIds.includes(row.expectedQuestionId!) || row.legacyType === "exact").length, positives.length),
    noMatchPrecision: ratio(trueNoMatch, noPredicted.length), noMatchRecall: ratio(trueNoMatch, negatives.length),
    falseSuggestionRate: ratio(negatives.filter(row => row.legacyIds.length > 0).length, negatives.length),
    p50Ms: latencies[Math.ceil(latencies.length * .50) - 1], p95Ms: latencies[Math.ceil(latencies.length * .95) - 1],
    geminiCallsPerRequest: 0, cacheHitRate: null, errors: 0,
  };
  const report = { generatedAt: new Date().toISOString(), sourceHash, publishedCount: index.length,
    indexSha256: createHash("sha256").update(JSON.stringify(index)).digest("hex"),
    total: results.length, needsReview: results.filter(row => row.needsReview).length,
    overlapsCanonicalOrAlias: results.filter(row => row.matchesExistingPhrase).length,
    legacy: metrics, disabledAssisted: { ...metrics, note: "Identical baseline path; not enabled Gemini quality." },
    enabledGeminiFullBenchmark: null, reason: "Only a small live smoke authorized. No bulk Gemini benchmark performed.", results };
  writeFileSync("docs/chatbot-phase-5c-benchmark-results.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ total: report.total, needsReview: report.needsReview, overlapsCanonicalOrAlias: report.overlapsCanonicalOrAlias, published: index.length, legacy: metrics }, null, 2));
}
main().catch(() => { console.error("Benchmark unavailable: check MongoDB access, source hash and label locators locally."); process.exitCode = 1; })
  .finally(async () => { await (await getMongoClient().catch(() => null))?.close(); });
