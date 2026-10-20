import { loadEnvConfig } from "@next/env";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";
import { getDatabase, getMongoClient } from "../lib/db/client";
import { readPublishedChatIndex, readPublishedChatAnswer } from "../server/repositories/chat-knowledge";
import { generateQuestionMatch } from "../server/infrastructure/gemini-question-matcher";
import { parseAiDecision } from "../server/domain/chat-ai";
import { chatAiConfig } from "../server/services/chat-ai-config";
import { describeGeminiFailure } from "../server/infrastructure/gemini-errors";

loadEnvConfig(process.cwd());
const directory = ".local/chat-phase-5c1";
mkdirSync(directory, { recursive: true });
const ledgerFile = `${directory}/generation-ledger.json`;
const ledger: { calls: number; stages: string[] } = existsSync(ledgerFile) ? JSON.parse(readFileSync(ledgerFile, "utf8")) : { calls: 0, stages: [] };
const mode = process.argv.find(arg => arg.startsWith("--stage="))?.slice(8) || "models";
const model = process.argv.find(arg => arg.startsWith("--model="))?.slice(8) || "gemini-3.5-flash-lite";
const report: Record<string, unknown> = { stage: mode, startedAt: new Date().toISOString(), keyPresent: !!process.env.GEMINI_API_KEY?.trim(), sdk: "2.30.0", apiVersion: "v1beta", model, generationCallsBefore: ledger.calls };
const transport: Record<string, unknown>[] = [];
const nativeFetch = globalThis.fetch;
const observedFetch: typeof fetch = async (input, init) => {
  const started = performance.now();
  try {
    const response = await nativeFetch(input, init);
    transport.push({ httpStatus: response.status, contentType: response.headers.get("content-type"), latencyToHeadersMs: Math.round(performance.now() - started) });
    return response;
  } catch (error) { transport.push({ failure: describeGeminiFailure(error), latencyMs: Math.round(performance.now() - started) }); throw error; }
};
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: "v1beta",
  httpOptions: { timeout: 15000, retryOptions: { attempts: 1 }, fetch: observedFetch } });
function reserveGeneration(stage: string) {
  if (ledger.calls >= 5) throw new Error("Generation budget exhausted");
  ledger.calls++; ledger.stages.push(stage);
  writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2)); // Reserve before any network request; never auto-retry.
}
async function generation(stage: string, request: GenerateContentParameters) {
  reserveGeneration(stage);
  const start = performance.now();
  const response = await client.models.generateContent(request);
  report.latencyMs = Math.round(performance.now() - start);
  report.finishReasons = response.candidates?.map(candidate => candidate.finishReason);
  report.usage = response.usageMetadata;
  return response;
}
async function main() {
  if (!report.keyPresent) { report.blocked = "missing_key"; return; }
  if (mode === "models") {
    const list = await client.models.list({ config: { pageSize: 100 } });
    const models = [];
    for await (const row of list) if (row.supportedActions?.includes("generateContent")) models.push({ name: row.name, supportedActions: row.supportedActions });
    report.models = models; report.status = "passed";
  } else if (mode === "basic") {
    const previous = JSON.parse(readFileSync(`${directory}/models.json`, "utf8"));
    if (!previous.models?.some((row: { name: string }) => row.name === `models/${model}`)) throw new Error("Model not in verified list");
    // Model must ALSO have a verified Free Tier in official pricing before this command is invoked.
    const result = await generation("basic", { model, contents: "Reply only OK.", config: { maxOutputTokens: 128 } });
    report.nonempty = !!result.text?.trim(); report.expectedOk = result.text?.trim() === "OK";
    report.status = report.nonempty ? "passed" : "unexpected_output";
  } else if (mode === "structured") {
    const previous = JSON.parse(readFileSync(`${directory}/basic.json`, "utf8"));
    if (!previous.nonempty || previous.model !== model || !previous.transport?.some((row: { httpStatus: number }) => row.httpStatus === 200)) throw new Error("Basic generation not verified");
    const result = await generation("structured", { model, contents: "Return JSON with ok set to true.", config: { maxOutputTokens: 128,
      responseMimeType: "application/json", responseJsonSchema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"], additionalProperties: false } } });
    const json: unknown = JSON.parse(result.text || "");
    report.schemaValid = !!json && typeof json === "object" && !Array.isArray(json) && Object.keys(json).length === 1 && "ok" in json && json.ok === true;
    report.status = report.schemaValid ? "passed" : "unexpected_output";
  } else if (mode === "matching") {
    const previous = JSON.parse(readFileSync(`${directory}/structured.json`, "utf8"));
    if (previous.status !== "passed" || previous.model !== model) throw new Error("Structured output not verified");
    if ((await getDatabase()).databaseName !== "vo_danh") throw new Error("Unexpected database");
    const index = await readPublishedChatIndex();
    const candidates = index.filter(row => ["cmtt45-q017", "cmtt45-q018", "cmtt45-q019"].includes(row.questionId));
    if (candidates.length !== 3) throw new Error("Three published candidates required");
    report.candidateIds = candidates.map(row => row.questionId); report.publishedCount = index.length;
    reserveGeneration("matching");
    globalThis.fetch = observedFetch;
    try {
      const text = await generateQuestionMatch("Hà Nội khởi nghĩa thắng lợi vào hôm nào vậy?", candidates, { ...chatAiConfig(), model, timeoutMs: 15000 });
      const decision = parseAiDecision(text, candidates);
      report.schemaValid = !!decision;
      report.decision = decision; // Only decision/ID, never the generated reason or any historical answer.
      const row = candidates.find(row => row.questionId === decision?.questionId);
      report.publishedAnswerVerified = !!row && !!await readPublishedChatAnswer(row.questionId, "vo-nguyen-giap", row.revisionId);
      report.status = decision?.questionId === "cmtt45-q017" && report.publishedAnswerVerified ? "passed" : "unexpected_output";
    } finally { globalThis.fetch = nativeFetch; }
  } else throw new Error("Unsupported diagnostic stage");
}
const started = performance.now();
main().catch(error => { report.status = "failed"; report.failure = describeGeminiFailure(error); process.exitCode = 1; })
  .finally(async () => { report.totalLatencyMs = Math.round(performance.now() - started); report.transport = transport; report.generationCallsAfter = ledger.calls;
    writeFileSync(`${directory}/${mode}.json`, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
    if (mode === "matching") await (await getMongoClient().catch(() => null))?.close(); });
