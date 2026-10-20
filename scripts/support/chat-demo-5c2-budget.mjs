// Test-only preloader, inherited by the isolated Next development child process.
import { readFileSync, writeFileSync, appendFileSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
if (process.env.CHAT_AI_DIAGNOSTIC_RUN !== 'phase-5c2') throw new Error('Explicit diagnostic opt-in required');
const folder = process.env.CHAT_AI_DIAGNOSTIC_DIR;
if (!folder || !resolve(folder).endsWith('chat-phase-5c2')) throw new Error('Invalid diagnostic directory');
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname !== 'generativelanguage.googleapis.com' || !url.pathname.endsWith(':generateContent')) return nativeFetch(input, init);
  // Exclusive lock: concurrent workers fail closed, never overspend this run's ledger.
  const lock = `${folder}/budget.lock`, fd = openSync(lock, 'wx');
  let ledger;
  try {
    ledger = JSON.parse(readFileSync(`${folder}/generation-ledger.json`, 'utf8'));
    if (ledger.calls >= 10) throw new Error('Phase 5C.2 generation budget exhausted');
    ledger.calls++;
    writeFileSync(`${folder}/generation-ledger.json`, JSON.stringify(ledger, null, 2));
  } finally { closeSync(fd); unlinkSync(lock); }
  const started = performance.now();
  const row = { call: ledger.calls, apiVersion: url.pathname.split('/')[1], model: url.pathname.split('/').at(-1).split(':')[0] };
  try {
    const response = await nativeFetch(input, init);
    row.httpStatus = response.status;
    if (response.ok) {
      const body = await response.clone().json();
      row.finishReason = body.candidates?.[0]?.finishReason;
      const output = body.candidates?.[0]?.content?.parts?.filter(p => typeof p.text === 'string').map(p => p.text).join('') || '';
      try {
        const decision = JSON.parse(output);
        if (['match', 'no_match'].includes(decision.decision)) row.decision = decision.decision;
        if (/^cmtt45-q\d{3,6}$/.test(decision.questionId || '')) row.questionId = decision.questionId;
      } catch { row.invalidJson = true; }
    }
    return response;
  } catch (error) { row.transportFailed = true; throw error; }
  finally { row.latencyMs = Math.round(performance.now() - started); appendFileSync(`${folder}/generation-events.jsonl`, JSON.stringify(row) + '\n'); }
};
