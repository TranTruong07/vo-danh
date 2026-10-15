import { loadEnvConfig } from '@next/env';
import { mkdirSync, writeFileSync } from 'node:fs';
import { getDatabase, getMongoClient } from '../lib/db/client';
import { readPublishedChatIndex, readPublishedChatAnswer } from '../server/repositories/chat-knowledge';
import { CHARACTER_ENV_KEYS, CHAT_PERSONAS } from '../server/services/chat-characters';
import { matchChatQuestion } from '../server/services/chat-matcher';
import type { KnowledgeCharacterId } from '../server/domain/knowledge';
import type { KnowledgeRevisionModel } from '../server/models/knowledge';
loadEnvConfig(process.cwd());
async function main() {
  const db = await getDatabase(); if (db.databaseName !== 'vo_danh') throw new Error('Wrong database');
  const index = await readPublishedChatIndex(); if (index.length !== 59) throw new Error('Unexpected published count');
  const row = index.find(r => r.questionId === 'cmtt45-q017') || index[0];
  const fuzzy = [row.canonicalQuestion.replace('Hà Nội', 'Hà Nôi'), row.canonicalQuestion.slice(0, -3), row.canonicalQuestion + ' nhỉ']
    .find(message => matchChatQuestion(message, index).type === 'suggest');
  if (!fuzzy) throw new Error('No fuzzy test phrase');
  const personas = await Promise.all(Object.entries(CHARACTER_ENV_KEYS).map(async ([key, env]) => {
    const characterId = key as KnowledgeCharacterId, databaseId = process.env[env]?.trim();
    const answer = await readPublishedChatAnswer(row.questionId, characterId);
    if (!databaseId || !answer) throw new Error('Persona fixture unavailable');
    const quizCount = await db.collection('character_questions').countDocuments({ characterId: databaseId });
    return { characterId, databaseId, name: CHAT_PERSONAS[characterId].name, answer: answer.answer, quizCount };
  }));
  const revisions = await db.collection<KnowledgeRevisionModel>('knowledge_question_revisions').find({ status: 'draft' }).toArray();
  const unpublished = await Promise.all(revisions.filter(r => !index.some(p => p.revisionId === r._id)).map(async r => ({
    questionId: r.questionId, revisionId: r._id, canonicalQuestion: r.canonicalQuestion,
    publishedAnswer: (await readPublishedChatAnswer(r.questionId, 'truong-chinh'))?.answer ?? null,
  })));
  mkdirSync('.local', { recursive: true });
  writeFileSync('.local/phase4-demo-fixture.json', JSON.stringify({ question: row, fuzzy, personas, unpublished }, null, 2));
  console.log(JSON.stringify({ published: index.length, personas: personas.map(p => ({ name: p.name, quizCount: p.quizCount })), unpublishedDrafts: unpublished.length, fuzzyAvailable: true }));
}
main().catch(() => { process.exitCode = 1; console.error('Read-only demo fixture failed'); }).finally(async () => { await (await getMongoClient().catch(() => null))?.close(); });
