// Explicit test-only preloader. Never imported by app code or normal npm start/build.
// Bounds the entire Phase 5C.1 diagnostic run across CLI stages and this one local server.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

if (process.env.CHAT_AI_DIAGNOSTIC_RUN !== 'phase-5c1') throw new Error('Diagnostic run opt-in required');
const directory = '.local/chat-phase-5c1';
const ledgerFile = `${directory}/generation-ledger.json`;
const transportFile = `${directory}/e2e-generation.jsonl`;
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname !== 'generativelanguage.googleapis.com' || !url.pathname.endsWith(':generateContent')) return nativeFetch(input, init);
  const ledger = JSON.parse(readFileSync(ledgerFile, 'utf8'));
  if (ledger.calls >= 5) throw new Error('Diagnostic generation budget exhausted');
  ledger.calls++; ledger.stages.push('e2e');
  writeFileSync(ledgerFile, JSON.stringify(ledger, null, 2));
  const start = performance.now();
  const row = { call: ledger.calls, stage: 'e2e', apiVersion: url.pathname.split('/')[1] };
  try {
    const response = await nativeFetch(input, init);
    row.httpStatus = response.status;
    // Observe only decision/id/finish reason from the controlled test; never log key or request text.
    if (response.ok) {
      const body = await response.clone().json();
      row.finishReason = body.candidates?.[0]?.finishReason;
      const text = body.candidates?.[0]?.content?.parts?.filter(part => typeof part.text === 'string').map(part => part.text).join('') || '';
      try {
        const decision = JSON.parse(text);
        if (decision.decision === 'match' || decision.decision === 'no_match') row.decision = decision.decision;
        if (typeof decision.questionId === 'string' && /^cmtt45-q\d{3,6}$/.test(decision.questionId)) row.questionId = decision.questionId;
      } catch { row.invalidJson = true; }
    }
    return response;
  } catch { row.transportFailed = true; throw new Error('Diagnostic transport failed'); }
  finally { row.latencyMs = Math.round(performance.now() - start); appendFileSync(transportFile, JSON.stringify(row) + '\n'); }
};
