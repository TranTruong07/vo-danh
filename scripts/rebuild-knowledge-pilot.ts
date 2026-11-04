// Explicitly authorized, two-call editorial pilot. Never run from runtime routes or automated tests.
import { loadEnvConfig } from '@next/env';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { getDatabase, getMongoClient } from '@/lib/db/client';
import { generateKnowledge, knowledgeGenerationConfig } from '@/server/infrastructure/gemini-knowledge-generator';
import { generationCandidates, generationBudget, reserveOfflineGenerationCall } from '@/server/repositories/knowledge-generation';
import { parseProposal, detectDuplicates, inputObject } from '@/server/services/knowledge-generation-validation';
import { validateKnowledge } from '@/server/services/knowledge-validation';
import { KNOWLEDGE_TOPIC, normalizeKnowledgePhrase, type ExtractionManifest, type KnowledgeDraft } from '@/server/domain/knowledge';
import type { SourceChunk } from '@/server/domain/knowledge-generation';

const folder = '.local/knowledge-rebuild', ledgerFile = `${folder}/pilot-ledger.json`;
const hash = 'fc0f492babe6407a2d9469b9e935f6ce6543916842d1d5e1de6c8a80e64c385e';
const blockIds = ['body/24', 'body/310'];
type Attempt = { call: number; blockId: string; at: string; model: string; status: string; latencyMs?: number; httpStatus?: number; tokens?: unknown; generationRequests: number; code?: string; duplicateCount?: number; draftId?: string };
const save = (path: string, value: unknown) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf8');
async function main() {
  const call = Number(process.argv[2]);
  if (![1,2].includes(call) || process.argv[3] !== '--authorized-two-call-pilot') throw Error('EXPLICIT_PILOT_ARGUMENT_REQUIRED');
  loadEnvConfig(process.cwd()); mkdirSync(folder, { recursive: true });
  const config = knowledgeGenerationConfig();
  const db = await getDatabase();
  if (db.databaseName !== 'vo_danh') throw Error('WRONG_DATABASE');
  if (!config.enabled || config.model !== 'gemini-3.5-flash-lite') throw Error('CONFIG_CHANGED');
  const preflight = JSON.parse(readFileSync(`${folder}/preflight.json`, 'utf8'));
  if (!preflight.modelAccessible || !preflight.supportsGenerateContent) throw Error('MODEL_PREFLIGHT_REQUIRED');
  // Owner confirmed Free Tier/no billing in this session. Pricing checked 2026-11-02.
  const manifest = JSON.parse(readFileSync('knowledge/new-source-manifest.json','utf8')) as ExtractionManifest;
  if (manifest.sourceSha256 !== hash || createHash('sha256').update(readFileSync('docs/source/Tong-hop-kien-thuc-moi.docx')).digest('hex') !== hash) throw Error('SOURCE_CHANGED');
  const block = manifest.blocks.find(b => b.id === blockIds[call - 1]);
  if (!block || block.isHeading) throw Error('MISSING_SOURCE_BLOCK');
  const chunk: SourceChunk = { _id: block.id, sourceId: manifest.document, order: block.order, section: manifest.sections.find(s => s.sectionId === block.sectionId)?.title || block.sectionId, text: block.text, paragraphIndex: block.paragraphIndex, start: 0, end: block.text.length };
  const attempts: Attempt[] = existsSync(ledgerFile) ? JSON.parse(readFileSync(ledgerFile,'utf8')) : [];
  if (attempts.length >= 2 || attempts.some(a => a.call === call) || call !== attempts.length + 1) throw Error('ALREADY_ATTEMPTED_OR_OUT_OF_ORDER');
  if (attempts.some(a => a.status !== 'draft_exported')) throw Error('PRIOR_ATTEMPT_REQUIRES_REVIEW');
  if (!(await generationBudget(config.dailyCalls)).remaining) throw Error('DAILY_BUDGET_EXHAUSTED');
  const candidates = await generationCandidates();
  const drafts: KnowledgeDraft[] = existsSync('knowledge/new-questions-draft.json') ? JSON.parse(readFileSync('knowledge/new-questions-draft.json','utf8')) : [];
  const attempt: Attempt = { call, blockId: block.id, at: new Date().toISOString(), model: config.model, status: 'reserved', generationRequests: 0 };
  // Exclusive marker is never removed: crash/restart cannot send the same paid operation twice.
  writeFileSync(`${folder}/pilot-call-${call}.reserved`, attempt.at, { flag: 'wx' });
  attempts.push(attempt); save(ledgerFile, attempts);
  await reserveOfflineGenerationCall(config.dailyCalls);
  const originalFetch = globalThis.fetch, started = Date.now();
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    if (url.hostname !== 'generativelanguage.googleapis.com' || !url.pathname.endsWith(':generateContent')) throw Error('UNEXPECTED_PROVIDER_REQUEST');
    if (++attempt.generationRequests > 1) throw Error('RETRY_FORBIDDEN');
    save(ledgerFile, attempts);
    const response = await originalFetch(input, init);
    attempt.httpStatus = response.status;
    const raw = await response.clone().json().catch(() => null);
    // Only successful provider output, never request headers/prompts or provider error text.
    if (response.ok) { save(`${folder}/pilot-call-${call}-raw.json`, raw); attempt.tokens = raw?.usageMetadata; }
    save(ledgerFile, attempts);
    return response;
  };
  try {
    const output = inputObject(await generateKnowledge([chunk], 1));
    save(`${folder}/pilot-call-${call}-output.json`, output);
    if (output.insufficientEvidence === true) { attempt.status = 'insufficient_evidence'; return; }
    if (output.insufficientEvidence !== false || !Array.isArray(output.proposals) || output.proposals.length !== 1) throw Error('INVALID_BATCH_SCHEMA');
    const content = parseProposal(output.proposals[0], [chunk]);
    save(`${folder}/pilot-call-${call}-validated.json`, content);
    if (content.insufficientEvidence) { attempt.status = 'insufficient_evidence'; return; }
    const duplicates = detectDuplicates(content, [...candidates, ...drafts.map(d => ({ id: d._id, canonicalQuestion: d.canonicalQuestion, aliases: d.aliases, neutralAnswer: d.approvedAnswer }))]);
    attempt.duplicateCount = duplicates.length;
    if (duplicates.length) { save(`${folder}/pilot-call-${call}-duplicates.json`, duplicates); attempt.status = 'duplicate_review'; return; }
    const now = new Date().toISOString();
    const draft: KnowledgeDraft = { _id: `cmtt45-q${String(60 + call).padStart(3, '0')}`, topicId: KNOWLEDGE_TOPIC, sectionId: block.sectionId, canonicalQuestion: content.canonicalQuestion, aliases: content.aliases,
      normalizedPhrases: [content.canonicalQuestion,...content.aliases].map(normalizeKnowledgePhrase), approvedAnswer: content.neutralAnswer, characterAnswers: content.characterAnswers,
      source: { document: manifest.document, sectionId: block.sectionId, excerpt: content.evidence[0].quote, sourceSha256: hash, blockIds: [block.id], paragraphIndex: block.paragraphIndex },
      status: 'draft', version: 1, createdAt: now, updatedAt: now, reviewNotes: [...content.warnings, 'NEEDS_REVIEW: Cần quản trị viên đối chiếu nghĩa canonical/aliases và sự thật lịch sử; chưa duyệt hoặc công bố.'] };
    const validation = validateKnowledge([...drafts,draft], manifest);
    save(`${folder}/pilot-call-${call}-validation.json`, { errors: validation.errors, warnings: validation.warnings });
    if (validation.errors.length) throw Error('DRAFT_SCHEMA_FAILED');
    save('knowledge/new-questions-draft.json', [...drafts,draft]);
    attempt.draftId = draft._id; attempt.status = 'draft_exported';
  } catch (error) {
    attempt.status = 'failed'; attempt.code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'PILOT_FAILED';
  } finally {
    globalThis.fetch = originalFetch; attempt.latencyMs = Date.now() - started; save(ledgerFile, attempts); console.log(JSON.stringify(attempt));
  }
}
main().catch(() => { console.error('PILOT_BLOCKED: inspect local checkpoint; no automatic retry.'); process.exitCode=1; }).finally(async () => { await (await getMongoClient().catch(()=>null))?.close(); });
