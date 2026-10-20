// Read-only snapshot for offline evaluation. Never imports the Gemini transport.
import { loadEnvConfig } from '@next/env';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { getMongoClient } from '../lib/db/client';
import { readPublishedChatIndex } from '../server/repositories/chat-knowledge';

const folder = '.local/chat-phase-5c3b';
const files = ['server/services/chat-matcher.ts', 'server/services/chat-ai-candidates.ts', 'server/services/chat-ai-matching.ts',
  'server/services/chat.ts', 'server/domain/chat.ts', 'features/game/character-chat.tsx'];
const protectedFiles = ['.env.local', 'server/services/chat-ai-config.ts', 'server/infrastructure/gemini-question-matcher.ts',
  '.local/chat-phase-5c1/generation-ledger.json', '.local/chat-phase-5c2/generation-ledger.json', '.local/chat-phase-5c3/generation-ledger.json'];
async function main() {
  if (existsSync(`${folder}/snapshot.json`)) throw new Error('Snapshot exists; do not overwrite baseline');
  loadEnvConfig(process.cwd());
  const index = await readPublishedChatIndex();
  if (index.length !== 59) throw new Error('Expected 59 published questions');
  mkdirSync(folder, { recursive: true });
  const snapshot = { at: new Date().toISOString(), index,
    baselineFiles: Object.fromEntries(files.map(file => [file, readFileSync(file, 'utf8')])),
    protectedHashes: Object.fromEntries(protectedFiles.map(file => [file, createHash('sha256').update(readFileSync(file)).digest('hex')])) };
  writeFileSync(`${folder}/snapshot.json`, JSON.stringify(snapshot, null, 2));
  console.log(JSON.stringify({ published: index.length, writesToDatabase: 0, generationCalls: 0 }));
}
main().catch(() => { console.error('Read-only preparation failed; no secrets logged.'); process.exitCode = 1; })
  .finally(async () => { await (await getMongoClient().catch(() => null))?.close(); });
