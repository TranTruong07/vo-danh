import { loadEnvConfig } from "@next/env";
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { GoogleGenAI } from "@google/genai";
import { getDatabase, getMongoClient } from "../lib/db/client";
import { readPublishedChatIndex } from "../server/repositories/chat-knowledge";
import { assistChatMatch } from "../server/services/chat-ai-matching";
import { matchChatQuestion } from "../server/services/chat-matcher";
import { chatAiConfig } from "../server/services/chat-ai-config";
import { describeGeminiFailure } from "../server/infrastructure/gemini-errors";

loadEnvConfig(process.cwd());
const report: Record<string, unknown> = { startedAt: new Date().toISOString(), generationLimit: 3, live: true };
const argument = (name: string) => process.argv.find(arg => arg.startsWith(`${name}=`))?.slice(name.length + 1);
const limit = Number(argument("--limit") || 3);
async function main() {
  if (!process.argv.includes("--live")) throw new Error("Explicit --live required");
  if (!Number.isInteger(limit) || limit < 1 || limit > 3) throw new Error("Limit must be 1..3");
  const modelOverride = argument("--model");
  if (modelOverride) { if (!/^gemini-[a-z0-9.-]+$/.test(modelOverride)) throw new Error("Invalid model"); process.env.GEMINI_MODEL = modelOverride; }
  const timeout = argument("--timeout");
  if (timeout) { if (!["5000", "10000", "15000"].includes(timeout)) throw new Error("Unsupported timeout"); process.env.CHAT_AI_TIMEOUT_MS = timeout; }
  report.generationLimit = limit;
  if (!process.env.GEMINI_API_KEY) throw new Error("No key");
  const db = await getDatabase();
  if (db.databaseName !== "vo_danh") throw new Error("Unexpected database");
  const fingerprint = async () => {
    const hash = createHash("sha256");
    for (const name of ["knowledge_questions", "knowledge_question_revisions", "knowledge_audit"]) {
      hash.update(JSON.stringify(await db.collection(name).find({}).sort({ _id: 1 }).toArray()));
    }
    return hash.digest("hex");
  };
  const before = await fingerprint();
  const index = await readPublishedChatIndex(); report.publishedCount = index.length;
  // Only this controlled process opts in; .env.local and the running website stay untouched.
  process.env.CHAT_AI_MATCHING_ENABLED = "true";
  const config = chatAiConfig(); report.model = config.model; report.timeoutMs = config.timeoutMs;
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout: 10000, retryOptions: { attempts: 1 } } });
  try {
    const model = await client.models.get({ model: config.model });
    report.modelAvailable = true; report.supportedActions = model.supportedActions;
  } catch (error) { report.modelAvailable = false; report.failure = describeGeminiFailure(error); return; }
  const samples = [
    { message: "Hà Nội khởi nghĩa thắng lợi vào hôm nào vậy?", expected: "cmtt45-q017" },
    { message: "Cho mình hỏi hôm nào Huế giành được chính quyền?", expected: "cmtt45-q018" },
    { message: "Nói rõ giúp em việc đọc Tuyên ngôn Độc lập khác cuộc tổng khởi nghĩa tháng Tám ở chỗ nào?", expected: "cmtt45-q037" },
  ];
  const checks = [];
  for (const sample of samples.slice(0, limit)) {
    const start = performance.now();
    const legacy = matchChatQuestion(sample.message, index);
    const result = await assistChatMatch(sample.message, index, legacy, "vo-nguyen-giap");
    const ids = result.match.type === "suggest" ? result.match.suggestions.map(row => row.questionId) : [];
    checks.push({ ...sample, ...result, latencyMs: Math.round(performance.now() - start), ids, correctTop1: ids[0] === sample.expected });
    if (result.outcome.startsWith("provider_") || result.outcome === "error_fallback") break;
  }
  // Repeat only when the first result is already cached. Never spend an extra generation.
  const first = checks[0];
  if (first && (first.outcome === "match" || first.outcome === "no_match" || first.outcome === "cache")) {
    process.env.CHAT_AI_CALLS_PER_MINUTE = "0"; // Repeated probe is cache-only, even if evicted meanwhile.
    const start = performance.now();
    const result = await assistChatMatch(first.message, index, matchChatQuestion(first.message, index), "vo-nguyen-giap");
    checks.push({ message: first.message, expected: first.expected, ...result, latencyMs: Math.round(performance.now() - start),
      ids: result.match.type === "suggest" ? result.match.suggestions.map(row => row.questionId) : [], correctTop1: result.match.type === "suggest" && result.match.suggestions[0]?.questionId === first.expected });
  }
  report.checks = checks;
  report.calls = checks.reduce((sum, row) => sum + row.calls, 0);
  report.knowledgeUnchanged = before === await fingerprint();
}
main().catch(error => { report.failed = true; report.failure = describeGeminiFailure(error); process.exitCode = 1; })
  .finally(async () => {
    mkdirSync(".local/chat-phase-5c", { recursive: true });
    const suffix = String(report.model || "unknown").replace(/[^a-zA-Z0-9.-]/g, "_");
    writeFileSync(`.local/chat-phase-5c/live-${suffix}-${Date.now()}.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    await (await getMongoClient().catch(() => null))?.close();
  });
