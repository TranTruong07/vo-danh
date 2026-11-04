import { loadEnvConfig } from '@next/env';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { getMongoClient, getDatabase } from '../lib/db/client';
import { inspectOldKnowledgeCleanup, applyOldKnowledgeCleanup } from '../server/repositories/knowledge-cleanup';
import { writeJson } from './knowledge/common';
import type { KnowledgeCleanupPlan } from '../server/services/knowledge-cleanup';

async function main() {
  const { values } = parseArgs({ options: { apply: { type: 'boolean' }, plan: { type: 'string' }, report: { type: 'string' }, confirmation: { type: 'string' } } });
  if (!values.plan || !values.report) throw new Error('PLAN_AND_REPORT_REQUIRED');
  loadEnvConfig(process.cwd());
  if (!values.apply) { const plan = await inspectOldKnowledgeCleanup(); writeJson(values.plan, plan); console.log(JSON.stringify({ database: plan.database, questions: plan.questions.length, revisions: plan.revisions.length, pointers: plan.publishedPointers, writes: 0 })); return; }
  if (values.confirmation !== 'vo_danh:60:75:59') throw new Error('EXPLICIT_CONFIRMATION_REQUIRED');
  const expected = JSON.parse(readFileSync(values.plan, 'utf8')) as KnowledgeCleanupPlan;
  const result = await applyOldKnowledgeCleanup(expected);
  const db = await getDatabase();
  const remaining = { questions: await db.collection('knowledge_questions').countDocuments(), revisions: await db.collection('knowledge_question_revisions').countDocuments() };
  writeJson(values.report, { ...result, remaining, completedAt: new Date().toISOString(), droppedCollections: [], retried: false });
  console.log(JSON.stringify({ ...result, remaining }));
}
main().catch(() => { console.error('Cleanup stopped. Inspect current database state before any further action; no retry. Secrets omitted.'); process.exitCode = 1; })
  .finally(async () => { await (await getMongoClient().catch(() => null))?.close(); });
