import { loadEnvConfig } from '@next/env';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { getDatabase, getMongoClient } from '../lib/db/client';
import { readPublishedChatIndex, readPublishedChatAnswer } from '../server/repositories/chat-knowledge';
import { CHARACTER_ENV_KEYS, CHAT_PERSONAS } from '../server/services/chat-characters';
import type { KnowledgeCharacterId } from '../server/domain/knowledge';
import { chatAiConfig } from '../server/services/chat-ai-config';
loadEnvConfig(process.cwd());
const folder = '.local/chat-phase-5c2';
async function main() {
  mkdirSync(folder, { recursive: true });
  const db = await getDatabase(); if (db.databaseName !== 'vo_danh') throw new Error('Unexpected database');
  const index = await readPublishedChatIndex(); if (index.length !== 59) throw new Error('Unexpected published count');
  const questions = index.filter(row => ['cmtt45-q017', 'cmtt45-q018', 'cmtt45-q019'].includes(row.questionId));
  const personas = await Promise.all(Object.entries(CHARACTER_ENV_KEYS).map(async ([id, key]) => {
    const characterId = id as KnowledgeCharacterId, databaseId = process.env[key]?.trim();
    if (!databaseId) throw new Error('Missing character mapping');
    const answers: Record<string, string> = {};
    for (const q of questions) { const answer = await readPublishedChatAnswer(q.questionId, characterId, q.revisionId); if (!answer) throw new Error('Published answer missing'); answers[q.questionId] = answer.answer; }
    return { characterId, databaseId, name: CHAT_PERSONAS[characterId].name, refusalText: CHAT_PERSONAS[characterId].refusalText, quizCount: await db.collection('character_questions').countDocuments({ characterId: databaseId }), answers };
  }));
  const oldLedger = createHash('sha256').update(readFileSync('.local/chat-phase-5c1/generation-ledger.json')).digest('hex');
  const day = Math.floor(Date.now() / 86400000);
  const quota = await db.collection<{ _id: string; count: number }>('chat_limits').findOne({ _id: `gemini:day:${day}` });
  const config = chatAiConfig();
  writeFileSync(`${folder}/fixture.json`, JSON.stringify({ questions, publishedIds: index.map(q => q.questionId), personas }, null, 2));
  const before = { keyPresent: !!process.env.GEMINI_API_KEY?.trim(), config, autoAnswer: process.env.CHAT_AI_AUTO_ANSWER, oldLedgerSha256: oldLedger, dailyReservations: quota?.count || 0, personas: personas.map(({ name, quizCount }) => ({ name, quizCount })) };
  writeFileSync(`${folder}/environment-before.json`, JSON.stringify(before, null, 2));
  console.log(JSON.stringify(before));
}
main().catch(() => { console.error('Read-only 5C.2 preparation failed'); process.exitCode = 1; }).finally(async () => { await (await getMongoClient().catch(() => null))?.close(); });
