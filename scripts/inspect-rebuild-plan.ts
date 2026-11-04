import { loadEnvConfig } from '@next/env';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { getDatabase, getMongoClient } from '../lib/db/client';
import { generationBudget, generationCandidates, registeredSourceByHash } from '../server/repositories/knowledge-generation';
import { knowledgeGenerationConfig } from '../server/infrastructure/gemini-knowledge-generator';
import { detectDuplicates } from '../server/services/knowledge-generation-validation';
import type { KnowledgeDraft } from '../server/domain/knowledge';

// Read-only current-environment inspection: no indexes, reservations, provider calls or fixtures.
async function main() {
  loadEnvConfig(process.cwd());
  const config = knowledgeGenerationConfig(), db = await getDatabase();
  const plan = JSON.parse(readFileSync('knowledge/new-generation-plan.json', 'utf8')) as {
    sourceSha256: string; units: { key: string; questionIntent: string; existingQuestionId: string | null }[];
  };
  const drafts = JSON.parse(readFileSync('knowledge/new-questions-draft.json', 'utf8')) as KnowledgeDraft[];
  const candidates = await generationCandidates();
  const duplicates = plan.units.map(unit => ({ unit: unit.key, existingQuestionId: unit.existingQuestionId,
    matches: detectDuplicates({ canonicalQuestion: unit.questionIntent, aliases: [] }, candidates) })).filter(row => row.matches.length);
  const planCandidates = plan.units.map(u => ({ id: u.key, canonicalQuestion: u.questionIntent, aliases: [] }));
  const intentOverlaps = planCandidates.flatMap((c, i) => detectDuplicates(c, planCandidates.slice(i + 1)).map(match => ({ left: c.id, right: match.id, kind: match.kind })));
  const report = { at: new Date().toISOString(), databaseName: db.databaseName, mode: 'read-only',
    environmentDatabaseNameConfigured: !!process.env.MONGODB_DB_NAME?.trim(),
    config: { ...config, apiKeyPresent: !!process.env.GEMINI_API_KEY?.trim(), apiVersion: 'v1beta' },
    applicationBudget: await generationBudget(config.dailyCalls), providerRemainingQuota: 'UNVERIFIED',
    newSourceConfirmedInMongo: !!await registeredSourceByHash(plan.sourceSha256),
    existingDraftIds: drafts.map(d => d._id), duplicateCandidateCount: candidates.length,
    duplicates, intentOverlaps, writes: 0, generationCalls: 0 };
  mkdirSync('.local/knowledge-rebuild-planning', { recursive: true });
  writeFileSync('.local/knowledge-rebuild-planning/preflight.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
main().catch(() => { console.error('Read-only planning inspection failed; no connection details logged.'); process.exitCode = 1; })
  .finally(async () => { await (await getMongoClient().catch(() => null))?.close(); });
