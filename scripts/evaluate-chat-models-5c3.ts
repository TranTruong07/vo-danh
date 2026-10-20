// Evaluation only. No MongoDB writes, feature-flag changes or production matcher changes.
import { loadEnvConfig } from '@next/env';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { GoogleGenAI } from '@google/genai';
import { getDatabase, getMongoClient } from '../lib/db/client';
import { readPublishedChatIndex } from '../server/repositories/chat-knowledge';
import { CHAT_AI_BENCHMARK } from '../tests/fixtures/chat-ai-benchmark';
import { CHAT_AI_SCHEMA, CHAT_AI_SYSTEM, parseAiDecision } from '../server/domain/chat-ai';
import { matchChatQuestion } from '../server/services/chat-matcher';
import { retrieveAiCandidates } from '../server/services/chat-ai-candidates';
import { normalizeKnowledgePhrase } from '../server/domain/knowledge';
import { chatAiConfig } from '../server/services/chat-ai-config';
import { generateQuestionMatch, GEMINI_API_VERSION } from '../server/infrastructure/gemini-question-matcher';
import { describeGeminiFailure } from '../server/infrastructure/gemini-errors';
import type { ChatIndexEntry } from '../server/domain/chat';

loadEnvConfig(process.cwd());
const folder = '.local/chat-phase-5c3';
const models = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
const selected = [1, 5, 7, 8, 10, 15, 16, 23, 24, 27, 28, 33, 34, 35, 36, 37, 38, 39, 40, 45, 52, 100, 101, 115];
const liveIds = ['5c-033', '5c-101']; // Locked positive Hanoi + out-of-scope Hue weather, same for every model.
const sha = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
const json = <T,>(name: string): T => JSON.parse(readFileSync(`${folder}/${name}.json`, 'utf8')) as T;
const save = (name: string, data: unknown) => writeFileSync(`${folder}/${name}.json`, JSON.stringify(data, null, 2));
const protectedFiles = ['.env.local', '.local/chat-phase-5c1/generation-ledger.json', '.local/chat-phase-5c2/generation-ledger.json',
  'server/infrastructure/gemini-question-matcher.ts', 'server/services/chat-ai-config.ts', 'server/services/chat-ai-matching.ts', 'server/domain/chat-ai.ts', 'server/repositories/chat-ai-cache.ts'];
type Sample = typeof CHAT_AI_BENCHMARK[number] & { candidates: ChatIndexEntry[]; payloadSha256: string; legacyIds: string[]; matchesExistingPhrase: boolean };
type Offline = { indexSha256: string; promptSha256: string; schemaSha256: string; timeoutMs: number; cases: Sample[]; protectedHashes: Record<string, string> };
async function prepare() {
  if (existsSync(`${folder}/offline.json`)) throw new Error('Frozen benchmark already exists; do not overwrite');
  if ((await getDatabase()).databaseName !== 'vo_danh') throw new Error('Unexpected database');
  const index = await readPublishedChatIndex(); if (index.length !== 59) throw new Error('Expected 59 Published questions');
  const prior = JSON.parse(readFileSync('docs/chatbot-phase-5c-benchmark-results.json', 'utf8')) as { sourceHash: string; results: { id: string; needsReview: boolean }[] };
  if (sha(readFileSync('docs/source/Tong-hop-kien-thuc.docx')) !== prior.sourceHash) throw new Error('Source changed; review labels first');
  const snapshot = JSON.parse(readFileSync('knowledge/draft-questions-phase-2-v4.json', 'utf8')) as { _id: string; canonicalQuestion: string }[];
  const cases = selected.map(number => {
    const sample = CHAT_AI_BENCHMARK.find(s => s.id === `5c-${String(number).padStart(3, '0')}`)!;
    const legacy = matchChatQuestion(sample.message, index);
    const candidates = retrieveAiCandidates(sample.message, index, legacy, chatAiConfig().maxCandidates);
    const current = index.find(q => q.questionId === sample.expectedQuestionId);
    if (sample.expectedQuestionId && !current) throw new Error('Published label missing');
    const changed = !!current && current.canonicalQuestion !== snapshot.find(q => q._id === sample.expectedQuestionId)?.canonicalQuestion;
    const payload = { question: sample.message, candidates: candidates.map(({ questionId, canonicalQuestion, aliases }) => ({ questionId, canonicalQuestion, aliases })) };
    return { ...sample, needsReview: sample.needsReview || changed || !!prior.results.find(r => r.id === sample.id)?.needsReview,
      candidates, payloadSha256: sha(JSON.stringify(payload)),
      legacyIds: legacy.type === 'exact' ? [legacy.entry.questionId] : legacy.type === 'suggest' ? legacy.suggestions.map(s => s.questionId) : [],
      matchesExistingPhrase: index.some(q => [q.canonicalQuestion, ...q.aliases].some(s => normalizeKnowledgePhrase(s) === normalizeKnowledgePhrase(sample.message))) };
  });
  for (const id of liveIds) {
    const row = cases.find(s => s.id === id);
    if (!row || row.needsReview || !row.candidates.length || row.matchesExistingPhrase) throw new Error('Live case not eligible');
  }
  const scored = cases.filter(s => !s.needsReview), positive = scored.filter(s => s.expectedQuestionId);
  const data = { generatedAt: new Date().toISOString(), sourceHash: prior.sourceHash, publishedCount: index.length, indexSha256: sha(JSON.stringify(index)),
    promptSha256: sha(CHAT_AI_SYSTEM), schemaSha256: sha(JSON.stringify(CHAT_AI_SCHEMA)), timeoutMs: chatAiConfig().timeoutMs,
    selectedModels: models, liveIds, cases, protectedHashes: Object.fromEntries(protectedFiles.map(p => [p, sha(readFileSync(p))])),
    summary: { total: cases.length, scored: scored.length, needsReview: cases.length - scored.length,
      categories: Object.fromEntries([...new Set(cases.map(s => s.category))].map(c => [c, cases.filter(s => s.category === c).length])),
      overlapsExistingPhrase: cases.filter(s => s.matchesExistingPhrase).length,
      legacyTop1Correct: scored.filter(s => (s.legacyIds[0] || null) === s.expectedQuestionId).length,
      candidateRecallNumerator: positive.filter(s => s.candidates.some(c => c.questionId === s.expectedQuestionId)).length, candidateRecallDenominator: positive.length }, generationCalls: 0 };
  save('offline', data);
  if (!existsSync(`${folder}/generation-ledger.json`)) save('generation-ledger', { maximum: 6, calls: 0, attempts: [] });
  console.log(JSON.stringify(data.summary));
}
async function list() {
  const rows: { name?: string; supportedActions?: string[] }[] = [], statuses: number[] = [];
  const nativeFetch = globalThis.fetch;
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY?.trim(), apiVersion: GEMINI_API_VERSION,
    httpOptions: { timeout: 5000, retryOptions: { attempts: 1 }, fetch: async (input, init) => { const r = await nativeFetch(input, init); statuses.push(r.status); return r; } } });
  for await (const row of await client.models.list({ config: { pageSize: 100 } })) rows.push({ name: row.name, supportedActions: row.supportedActions });
  const report = { checkedAt: new Date().toISOString(), keyPresent: !!process.env.GEMINI_API_KEY?.trim(), apiVersion: GEMINI_API_VERSION, httpStatuses: statuses, models: rows,
    candidates: models.map(model => ({ model, listed: rows.some(r => r.name === `models/${model}`), generateContent: rows.some(r => r.name === `models/${model}` && r.supportedActions?.includes('generateContent')) })) };
  save('model-list', report); console.log(JSON.stringify({ httpStatuses: statuses, candidates: report.candidates }));
}
async function live(model: string, caseId: string) {
  // Owner's account-tier confirmation is recorded explicitly; never inferred from HTTP 200 or metadata.
  const gate = json<{ ownerConfirmedFreeTierNoBilling: boolean; freeTierDocsVerifiedModels: string[] }>('live-eligibility');
  if (!gate.ownerConfirmedFreeTierNoBilling || !gate.freeTierDocsVerifiedModels.includes(model) || !models.includes(model) || !liveIds.includes(caseId)) throw new Error('Live eligibility not verified');
  const listing = json<{ candidates: { model: string; listed: boolean; generateContent: boolean }[] }>('model-list');
  if (!listing.candidates.some(m => m.model === model && m.listed && m.generateContent)) throw new Error('Model metadata access not verified');
  const frozen = json<Offline>('offline'), sample = frozen.cases.find(s => s.id === caseId)!;
  for (const [path, hash] of Object.entries(frozen.protectedHashes)) if (sha(readFileSync(path)) !== hash) throw new Error('Protected configuration/code/ledger changed');
  if (sha(CHAT_AI_SYSTEM) !== frozen.promptSha256 || sha(JSON.stringify(CHAT_AI_SCHEMA)) !== frozen.schemaSha256) throw new Error('Prompt/schema changed');
  const config = chatAiConfig(); if (config.timeoutMs !== frozen.timeoutMs) throw new Error('Timeout changed');
  if (sha(JSON.stringify(await readPublishedChatIndex())) !== frozen.indexSha256) throw new Error('Published index changed');
  // Keep application quota data untouched. Read current consumption and fail closed if exhausted.
  const db = await getDatabase(), day = Math.floor(Date.now() / 86400000), minute = Math.floor(Date.now() / 60000);
  const quota = db.collection<{ _id: string; count: number }>('chat_limits');
  const usedDay = (await quota.findOne({ _id: `gemini:day:${day}` }))?.count || 0;
  const usedMinute = (await quota.findOne({ _id: `gemini:minute:${minute}` }))?.count || 0;
  const lock = openSync(`${folder}/run.lock`, 'wx');
  try {
    const ledger = json<{ calls: number; attempts: { model: string; caseId: string; at: number }[] }>('generation-ledger');
    if (ledger.calls >= 6 || ledger.attempts.some(a => a.model === model && a.caseId === caseId)) throw new Error('Budget exhausted or attempted pair; no retry');
    for (const attempt of ledger.attempts.filter(a => a.model === model)) {
      const prior = json<{ httpStatus: number | null }>(`live-${model}-${attempt.caseId}`);
      if (prior.httpStatus !== null && [401, 403, 404, 429].includes(prior.httpStatus)) throw new Error('Model blocked by prior access/quota failure');
    }
    if (usedDay + ledger.calls >= config.perDay || usedMinute + ledger.attempts.filter(a => Math.floor(a.at / 60000) === minute).length >= config.perMinute) throw new Error('Read-only quota guard blocked this call');
    const resultFile = `live-${model}-${caseId}`;
    ledger.calls++; ledger.attempts.push({ model, caseId, at: Date.now() }); save('generation-ledger', ledger);
    const result: Record<string, unknown> = { model, caseId, expectedQuestionId: sample.expectedQuestionId, call: ledger.calls,
      payloadSha256: sample.payloadSha256, candidateIds: sample.candidates.map(c => c.questionId), timeoutMs: frozen.timeoutMs, apiVersion: GEMINI_API_VERSION,
      httpStatus: null, validJson: false, schemaValid: false, correct: null, automaticRetries: 0 };
    const nativeFetch = globalThis.fetch, started = performance.now();
    let networkCalls = 0;
    globalThis.fetch = async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
      if (url.hostname !== 'generativelanguage.googleapis.com' || !url.pathname.endsWith(':generateContent') || ++networkCalls !== 1) throw new Error('Unexpected evaluation transport');
      const r = await nativeFetch(input, init); result.httpStatus = r.status;
      if (!r.ok) {
        try { const error = await r.clone().json(); result.providerFailure = describeGeminiFailure({ status: r.status, message: JSON.stringify(error) }); } catch { /* Preserve safe HTTP status only. */ }
      }
      return r;
    };
    try {
      const output = await generateQuestionMatch(sample.message, sample.candidates, { ...config, model });
      try { JSON.parse(output); result.validJson = true; } catch { /* Invalid JSON remains a failure. */ }
      const decision = parseAiDecision(output, sample.candidates);
      result.schemaValid = !!decision; result.decision = decision?.decision || null; result.questionId = decision?.questionId ?? null;
      result.correct = decision ? decision.questionId === sample.expectedQuestionId : false;
    } catch (error) { result.failure = describeGeminiFailure(error); }
    finally {
      globalThis.fetch = nativeFetch; result.latencyMs = Math.round(performance.now() - started); result.networkCalls = networkCalls;
      save(resultFile, result); console.log(JSON.stringify(result));
    }
  } finally { closeSync(lock); unlinkSync(`${folder}/run.lock`); }
}
mkdirSync(folder, { recursive: true });
const mode = process.argv[2];
async function main() {
  if (mode === 'prepare') await prepare();
  else if (mode === 'models') await list();
  else if (mode === 'live') await live(process.argv[3], process.argv[4]);
  else throw new Error('Expected prepare, models, or live model caseId');
}
main().catch(error => { console.error(JSON.stringify({ status: 'blocked_or_failed', failure: describeGeminiFailure(error) })); process.exitCode = 1; })
  .finally(async () => { await (await getMongoClient().catch(() => null))?.close(); });
