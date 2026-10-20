import { loadEnvConfig } from '@next/env';
import { mkdirSync, writeFileSync } from 'node:fs';
import { getDatabase, getMongoClient } from '../lib/db/client';
import { chatAnalytics, queryChatGroups, readChatGroup } from '../server/repositories/chat-history';

async function main() {
  loadEnvConfig(process.cwd());
  const client = await getMongoClient();
  try {
    const db = await getDatabase();
    const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map(row => row.name).sort();
    const relevant = names.filter(name => /chat|history|feedback|analytic|knowledge/.test(name));
    const collections = await Promise.all(relevant.map(async name => ({ name,
      count: await db.collection(name).countDocuments(),
      indexes: (await db.collection(name).listIndexes().toArray()).map(({ name, key, expireAfterSeconds }) => ({ name, key, expireAfterSeconds })),
    })));
    const now = new Date();
    const filter = { from: new Date(now.getTime() - 30 * 86400000), to: now, page: 1, pageSize: 20, text: '' };
    const analytics = await chatAnalytics(filter);
    const groups = await queryChatGroups({ ...filter, status: 'new' });
    const detail = await readChatGroup('0'.repeat(64));
    // Retain only counts. Do not export question text from a live database.
    const report = { at: new Date().toISOString(), database: db.databaseName, names, collections,
      readQueries: { analytics: 'passed', groups: 'passed', absentDetail: detail === null, asks: analytics.totals.asks, reviewGroups: groups.total },
      testDatabaseConfigured: !!process.env.MONGODB_TEST_URI, writes: 0, indexesCreated: 0 };
    mkdirSync('.local/chat-phase-5d', { recursive: true });
    writeFileSync('.local/chat-phase-5d/inventory.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } finally { await client.close(); }
}
main().catch(() => { console.error('Read-only inventory failed; no credentials logged.'); process.exitCode = 1; });
