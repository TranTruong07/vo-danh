import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { configureTestEnvironment, TEST_DATABASE, safeError } from './knowledge-generation-test-env.mjs';
const folder = process.argv.includes('--phase5e2') ? '.local/chat-phase-5e2' : '.local/chat-phase-5e1'; fs.mkdirSync(folder, { recursive: true });
const report = { startedAt: new Date().toISOString(), target: TEST_DATABASE, status: 'running', generationCalls: 0, checks: {} };
let client;
try {
  const config = configureTestEnvironment();
  report.uriContainsDatabase = config.uriContainsDatabase;
  report.targetSelection = 'Explicit client.db(TEST_DATABASE), process MONGODB_DB_NAME, and db-name guard';
  client = new MongoClient(config.uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 5 });
  await client.connect();
  const db = client.db(TEST_DATABASE);
  if (db.databaseName !== TEST_DATABASE) throw new Error('WRONG_TEST_TARGET');
  await db.command({ ping: 1 }); report.checks.ping = true;
  const hello = await db.command({ hello: 1 });
  report.checks.replicaSetOrMongos = !!hello.setName || hello.msg === 'isdbgrid';
  if (!report.checks.replicaSetOrMongos || !hello.logicalSessionTimeoutMinutes) throw new Error('TRANSACTIONS_UNSUPPORTED');
  const id = `preflight-${randomUUID()}`; report.runId = id;
  const probes = db.collection('phase5e1_test_runs');
  await probes.insertOne({ _id: id, kind: 'preflight', createdAt: new Date(), target: TEST_DATABASE });
  await probes.createIndex({ createdAt: 1 }); report.checks.writeAndIndexPrivileges = true;
  const session = client.startSession();
  try {
    await session.withTransaction(async () => { await probes.updateOne({ _id: id }, { $set: { committed: true } }, { session }); });
    report.checks.transactionCommit = (await probes.findOne({ _id: id })).committed === true;
    session.startTransaction(); await probes.updateOne({ _id: id }, { $set: { mustRollback: true } }, { session }); await session.abortTransaction();
    report.checks.transactionRollback = !('mustRollback' in await probes.findOne({ _id: id }));
  } finally { await session.endSession(); }
  if (!report.checks.transactionCommit || !report.checks.transactionRollback) throw new Error('TRANSACTION_CHECK_FAILED');
  report.status = 'passed';
} catch (error) { report.status = 'blocked'; report.error = safeError(error); process.exitCode = 1; }
finally { await client?.close(); fs.writeFileSync(`${folder}/preflight.json`, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report)); }
