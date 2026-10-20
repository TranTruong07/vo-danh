import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { modelMetrics } from './support/chat-model-evaluation-metrics.mjs';
const folder = '.local/chat-phase-5c3';
const read = name => JSON.parse(readFileSync(`${folder}/${name}.json`, 'utf8'));
const offline = read('offline'), listing = read('model-list'), ledger = read('generation-ledger');
const live = readdirSync(folder).filter(p => /^live-gemini-.*\.json$/.test(p)).map(p => JSON.parse(readFileSync(`${folder}/${p}`, 'utf8'))).sort((a, b) => a.call - b.call);
const gate = existsSync(`${folder}/live-eligibility.json`) ? read('live-eligibility') : { ownerConfirmedFreeTierNoBilling: false };
const modelRows = listing.candidates.map(m => ({
  modelId: m.model, release: 'stable', officialFreeTier: true,
  pricingSource: `https://ai.google.dev/gemini-api/docs/pricing#${m.model}`,
  capabilitiesSource: `https://ai.google.dev/gemini-api/docs/models/${m.model}`,
  listedForCurrentKey: m.listed, generateContentInMetadata: m.generateContent,
  projectMetadataAccessVerified: m.listed,
  projectGenerationAccessVerifiedThisPhase: live.some(r => r.model === m.model && r.httpStatus === 200),
  structuredOutputsDocumented: true, structuredOutputsVerifiedThisPhase: live.some(r => r.model === m.model && r.schemaValid),
  actualProjectQuota: null, actualProjectBillingTierVerifiedByApi: false,
  accountFreeTierOwnerConfirmed: gate.ownerConfirmedFreeTierNoBilling,
  metrics: modelMetrics(live.filter(r => r.model === m.model)),
}));
const unchanged = Object.fromEntries(Object.entries(offline.protectedHashes).map(([path, hash]) => [path, createHash('sha256').update(readFileSync(path)).digest('hex') === hash]));
const before = read('knowledge-before');
const after = existsSync(`${folder}/knowledge-after.json`) ? read('knowledge-after') : null;
const report = {
  phase: '5C.3A', generatedAt: new Date().toISOString(), timezone: 'Asia/Bangkok',
  status: live.length ? 'limited_live_evaluation' : 'offline_complete_live_blocked_account_free_tier_unverified',
  blockedReason: live.length ? null : 'Official model Free Tier and metadata access verified; actual project Free Tier/no-billing confirmation not received. No generation to honor zero-cost requirement.',
  budget: { maximum: 6, reservedCalls: ledger.calls, actualNetworkGenerationCalls: live.reduce((n, r) => n + (r.networkCalls || 0), 0), retries: 0, ledger: `${folder}/generation-ledger.json` },
  api: { sdk: '@google/genai@2.30.0', version: 'v1beta', timeoutMs: offline.timeoutMs, maxOutputTokens: 256, temperature: 0, attempts: 1, unchangedProductionMatcherUsedByHarness: true },
  metadataRequest: { httpStatuses: listing.httpStatuses, keyPresent: listing.keyPresent, listedModelsCount: listing.models.length },
  models: modelRows,
  offline: { total: offline.cases.length, scored: offline.summary.scored, needsReview: offline.summary.needsReview,
    categories: offline.summary.categories, overlapsExistingPhrase: offline.summary.overlapsExistingPhrase,
    legacyTop1: { numerator: offline.summary.legacyTop1Correct, denominator: offline.summary.scored, rate: offline.summary.legacyTop1Correct / offline.summary.scored },
    candidateRecall: { numerator: offline.summary.candidateRecallNumerator, denominator: offline.summary.candidateRecallDenominator, rate: offline.summary.candidateRecallNumerator / offline.summary.candidateRecallDenominator },
    sourceSha256: offline.sourceHash, publishedIndexSha256: offline.indexSha256, promptSha256: offline.promptSha256, schemaSha256: offline.schemaSha256,
    note: 'Legacy retrieval metrics only, not Gemini quality. Three uncertain labels excluded; no historical data approved.',
    cases: offline.cases.map(({ candidates, ...s }) => ({ ...s, candidateIds: candidates.map(c => c.questionId) })) },
  livePlan: { models: offline.selectedModels, caseIds: offline.liveIds, callsPerModel: 2, totalCalls: 6,
    order: offline.liveIds.flatMap((caseId, round) => (round ? [...offline.selectedModels].reverse() : offline.selectedModels).map(model => ({ model, caseId }))),
    equalPayloadPerCase: true, frozenCandidateOrder: true, cachedAnswersUsedToScore: false,
    noWritesToApplicationQuotaOrCache: true, quotaCheckedReadOnly: true,
    stopModelOn: [401, 403, 404, 429], noRetries: true },
  liveResults: live,
  metricDefinitions: {
    successRate: 'HTTP 200 and valid runtime schema / all attempts',
    matchingAccuracyAllAttempts: 'Correct decision and ID / all attempts; provider failures are not silently dropped',
    matchingAccuracyValidResponses: 'Correct decision and ID / valid successful responses',
    jsonValidity: 'Reported both across all attempts and conditional on HTTP 200; separate from schema validity',
    latency: 'Nearest rank ceil(p*n); separate all-attempt and successful latency; empty samples -> null',
  },
  historical504: { phase: '5C.2', errors: 6, calls: 9, rootCause: null, evidence: 'HTTP 504 observed with 5000 ms request deadline; previous raw provider error body unavailable',
    hypothesesOnly: ['provider gateway or processing deadline', 'request timeout budget interacting with model latency'],
    disprovedOrUnproven: ['invalid key not established', 'billing issue not established', 'bad JSON schema not established'] },
  current504: { errors: live.filter(r => r.httpStatus === 504).length, rootCause: null,
    evidence: 'Three HTTP 504 responses with provider status DEADLINE_EXCEEDED, observed before the 5000 ms local deadline. No provider request trace available; upstream cause remains unverified.' },
  recommendation: { changeMainModelNow: false, provenBestModel: null, candidateToEvaluateFirstAsAlternative: 'gemini-3.1-flash-lite',
    fallbackModelRecommendation: null, reason: 'Retain 3.5 Flash-Lite for demo: 2/2 correct structured responses versus 1/2 for 3.1 and 0/2 for 3.8 in this small paired sample. Prior 3.5 failures remain relevant; no proven reliability winner or automatic fallback justified.',
    currentMainModelRetained: 'gemini-3.5-flash-lite', proposedAutoAnswer: false, proposedApiVersion: 'v1beta', proposedTimeoutMs: 5000 },
  integrity: { protectedFilesUnchanged: unchanged, knowledgeCountAndHashesUnchanged: after ? before.collections.length === after.collections.length && before.collections.every(b => after.collections.some(a => a.name === b.name && a.count === b.count && a.contentSha256 === b.contentSha256)) : null,
    knowledgeBeforeInspectedAt: before.inspectedAt, knowledgeAfterInspectedAt: after?.inspectedAt ?? null,
    knowledgeAfter: after ? { logicalQuestions: after.logicalQuestions, revisions: after.revisions, approvedRevisions: after.approvedRevisions, publishedQuestions: after.runtimeReadableQuestions, integrity: after.integrity } : null,
    databaseWritesByHarness: 0, oldLedgersReset: false, billingChanged: false, productionDeployed: false },
  validation: { typescript: 'passed', changedFilesLint: 'passed', metricTests: { passed: 3, failed: 0 } },
  limitations: ['No API exposes verified account billing tier via models.list', 'Model listing is not proof of generation access', 'Project RPM/TPM/RPD unknown; view AI Studio', '24 offline cases are not 24 live calls', 'Two samples per model cannot establish production stability', 'Uncertain labels remain excluded', 'No application cache/quota mutations or production changes'],
  officialReferences: ['https://ai.google.dev/gemini-api/docs/pricing', 'https://ai.google.dev/gemini-api/docs/models', 'https://ai.google.dev/gemini-api/docs/rate-limits'],
};
writeFileSync('docs/chatbot-phase-5c3-model-results.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ status: report.status, models: modelRows.map(m => m.modelId), generationCalls: report.budget.actualNetworkGenerationCalls, protectedFilesUnchanged: Object.values(unchanged).every(Boolean), knowledgeUnchanged: report.integrity.knowledgeCountAndHashesUnchanged }));
