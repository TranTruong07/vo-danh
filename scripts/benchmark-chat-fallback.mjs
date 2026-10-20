import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { loader } from '../tests/support/load-typescript.mjs';
import { FALLBACK_CASES } from '../tests/fixtures/chat-fallback-cases.mjs';

// This executable never imports the server transport or environment loader.
globalThis.fetch = async () => { throw Error('Network forbidden in offline benchmark'); };
const mode = process.argv[2] || 'tune';
const fixturePath = 'tests/fixtures/chat-matching-baseline-5c3b.json';
if (mode === 'freeze') {
  if (fs.existsSync(fixturePath)) throw Error('Do not overwrite frozen baseline');
  const local = JSON.parse(fs.readFileSync('.local/chat-phase-5c3b/snapshot.json', 'utf8'));
  const prior = JSON.parse(fs.readFileSync('docs/chatbot-phase-5c3-model-results.json', 'utf8'));
  fs.writeFileSync(fixturePath, JSON.stringify({ at: local.at, index: local.index,
    matcher: local.baselineFiles['server/services/chat-matcher.ts'], retrieval: local.baselineFiles['server/services/chat-ai-candidates.ts'],
    cases: prior.offline.cases.map(c => ({ ...c, expectedIds: c.expectedQuestionId ? [c.expectedQuestionId] : [], split: 'phase5c3a' })) }, null, 2));
  console.log('Frozen metadata and baseline; zero network calls.');
  process.exit(0);
}
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const load = loader(), native = createRequire(import.meta.url);
function baseline(source) {
  const compiled = { exports: {} };
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(name => name.startsWith('@/') ? load(name) : native(name), compiled, compiled.exports);
  return compiled.exports;
}
const beforeMatch = baseline(fixture.matcher).matchChatQuestion, beforeRetrieve = baseline(fixture.retrieval).retrieveAiCandidates;
const afterMatch = load('@/server/services/chat-matcher').matchChatQuestion;
const afterRetrieve = load('@/server/services/chat-ai-candidates').retrieveAiCandidates;
const { rankVietnameseCandidates, confidentVietnameseSuggestions, FALLBACK_MIN_SCORE } = load('@/server/services/chat-vietnamese-ranking');
const ids = match => match.type === 'exact' ? [match.entry.questionId] : match.type === 'suggest' ? match.suggestions.map(s => s.questionId) : [];
const ratio = (numerator, denominator) => ({ numerator, denominator, rate: denominator ? numerator / denominator : null });
function measure(cases, match, retrieve, threshold) {
  const rows = cases.map(c => {
    const start = performance.now(), result = match(c.message, fixture.index);
    const suggestions = threshold === undefined ? ids(result) : confidentVietnameseSuggestions(c.message, fixture.index, threshold).map(e => e.questionId);
    const candidates = retrieve(c.message, fixture.index, result, 8).map(e => e.questionId);
    return { id: c.id, category: c.category, message: c.message, expectedIds: c.expectedIds, needsReview: c.needsReview,
      suggestions, candidates, latencyMs: performance.now() - start };
  });
  const scored = rows.filter(r => !r.needsReview), positive = scored.filter(r => r.expectedIds.length), negative = scored.filter(r => !r.expectedIds.length);
  const suggestionCount = scored.reduce((n, r) => n + r.suggestions.length, 0), withSuggestions = scored.filter(r => r.suggestions.length);
  const correctCount = scored.reduce((n, r) => n + r.suggestions.filter(id => r.expectedIds.includes(id)).length, 0);
  const latency = scored.map(r => r.latencyMs).sort((a, b) => a - b), percentile = p => latency[Math.ceil(p * latency.length) - 1] ?? null;
  return { total: rows.length, scored: scored.length, excluded: rows.filter(r => r.needsReview).map(r => r.id),
    top1: ratio(scored.filter(r => r.expectedIds.length ? r.expectedIds.includes(r.suggestions[0]) : !r.suggestions.length).length, scored.length),
    candidateRecall8: ratio(positive.filter(r => r.candidates.some(id => r.expectedIds.includes(id))).length, positive.length),
    fallbackPrecision3: ratio(correctCount, suggestionCount),
    falseSuggestionRate: ratio(scored.filter(r => r.suggestions.some(id => !r.expectedIds.includes(id))).length, scored.length),
    falseSuggestionRateWhenSuggested: ratio(withSuggestions.filter(r => r.suggestions.some(id => !r.expectedIds.includes(id))).length, withSuggestions.length),
    negativeRejection: ratio(negative.filter(r => !r.suggestions.length).length, negative.length),
    outOfScopeRejection: ratio(negative.filter(r => r.category === 'out_of_scope' && !r.suggestions.length).length, negative.filter(r => r.category === 'out_of_scope').length),
    positiveSuggestionRecall: ratio(positive.filter(r => r.suggestions.some(id => r.expectedIds.includes(id))).length, positive.length),
    latency: { p50Ms: percentile(.5), p95Ms: percentile(.95) }, rows };
}
// Warm local code only. No model, DB, provider quota, or cache access.
for (let i = 0; i < 10; i++) { beforeMatch('Hà Nội khởi nghĩa hôm nào?', fixture.index); rankVietnameseCandidates('Hà Nội khởi nghĩa hôm nào?', fixture.index); }
const tuning = [...fixture.cases, ...FALLBACK_CASES.filter(c => c.split === 'tuning')];
if (mode === 'tune') {
  const grid = [.65, .7, .75, .78, .8, .85, .9, .95].map(threshold => {
    const m = measure(tuning, afterMatch, afterRetrieve, threshold);
    return { threshold, precision: m.fallbackPrecision3, falseRate: m.falseSuggestionRate, recall: m.positiveSuggestionRecall, top1: m.top1 };
  });
  fs.writeFileSync('.local/chat-phase-5c3b/calibration.json', JSON.stringify(grid, null, 2));
  const details = measure(tuning, afterMatch, afterRetrieve);
  fs.writeFileSync('.local/chat-phase-5c3b/tuning.json', JSON.stringify(details, null, 2));
  console.log(JSON.stringify(grid, null, 2));
} else if (mode === 'evaluate') {
  const result = { phase: '5C.3B', generatedAt: new Date().toISOString(), generationCalls: 0, mongodbWrites: 0,
    threshold: FALLBACK_MIN_SCORE, fixtureSha256: createHash('sha256').update(fs.readFileSync(fixturePath)).digest('hex'),
    newCasesSha256: createHash('sha256').update(fs.readFileSync('tests/fixtures/chat-fallback-cases.mjs')).digest('hex'),
    calibration: JSON.parse(fs.readFileSync('.local/chat-phase-5c3b/calibration.json', 'utf8')),
    benchmarks: Object.fromEntries([['phase5c3a', fixture.cases], ['tuningNew', FALLBACK_CASES.filter(c => c.split === 'tuning')], ['holdoutNew', FALLBACK_CASES.filter(c => c.split === 'holdout')]].map(([name, cases]) => [name, { before: measure(cases, beforeMatch, beforeRetrieve), after: measure(cases, afterMatch, afterRetrieve) }])) };
  result.definitions = {
    top1: 'Expected ID is first suggestion, or no suggestion when the label is empty / scored cases. Before is legacy Fuse; after is Vietnamese fallback ranking. Not automatic-answer accuracy.',
    candidateRecall8: 'Positive cases with an expected ID in retrieval top 8 / positive cases.',
    fallbackPrecision3: 'Correct suggestion slots / all emitted suggestion slots (micro precision over at most 3, not padded to 3).',
    falseSuggestionRate: 'Scored cases with at least one incorrect suggestion / all scored cases; conditional denominator also reported.',
    rejection: 'No suggestion for a negative case; clarification counts as safe abstention, not necessarily an out_of_scope API status.',
    latency: 'One measured local matcher + retrieval pass per sample after warmup; nearest-rank P50/P95; no DB/API/network latency.',
  };
  result.protocol = { newCases: FALLBACK_CASES.length, tuningNew: 16, holdoutNew: 24,
    excludedLabelsUnchanged: ['5c-027', '5c-028', '5c-115'],
    selection: 'Grid tuned only on 21 scored old + 16 new tuning cases. Pick lowest threshold with zero false suggestions, then maximize recall: 0.78.',
    holdoutLimitation: 'Separate authored cases, not an external independently collected corpus. No threshold/synonym tuning on holdout results; later date-parser safety hardening did not change holdout counts.' };
  const local = '.local/chat-phase-5c3b/';
  result.validation = Object.fromEntries(['tests', 'build'].map(name => [name, fs.existsSync(`${local}${name}.json`) ? JSON.parse(fs.readFileSync(`${local}${name}.json`, 'utf8')) : null]));
  if (fs.existsSync(`${local}snapshot.json`)) {
    const snapshot = JSON.parse(fs.readFileSync(`${local}snapshot.json`, 'utf8'));
    result.integrity = { protectedFilesUnchanged: Object.fromEntries(Object.entries(snapshot.protectedHashes).map(([file, hash]) => [file, createHash('sha256').update(fs.readFileSync(file)).digest('hex') === hash])),
      apiVersion: 'v1beta', model: 'gemini-3.5-flash-lite', autoAnswer: false, timeoutMs: 5000, knowledgeWrites: 0, oldLedgerResets: 0 };
  }
  result.remainingMisses = Object.fromEntries(Object.entries(result.benchmarks).map(([name, data]) => [name, data.after.rows.filter(row => !row.needsReview && row.expectedIds.length && !row.suggestions.some(id => row.expectedIds.includes(id))).map(({ id, message, expectedIds, candidates }) => ({ id, message, expectedIds, expectedInRetrieval: candidates.some(id => expectedIds.includes(id)) }))]));
  fs.writeFileSync('docs/chatbot-phase-5c3b-test-report.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(Object.fromEntries(Object.entries(result.benchmarks).map(([name, m]) => [name, Object.fromEntries(Object.entries(m).map(([key, values]) => [key, { ...values, rows: undefined }]))])), null, 2));
} else throw Error('Use freeze, tune, or evaluate');
