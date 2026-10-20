import fs from 'node:fs';
import { createHash } from 'node:crypto';
const folder = '.local/chat-phase-5d';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const before = read(`${folder}/before.json`), tests = read(`${folder}/tests.json`), build = read(`${folder}/build.json`);
const inventory = read(`${folder}/inventory.json`), knowledge = read(`${folder}/knowledge-after.json`);
const previousKnowledge = read('.local/chat-phase-5c3b/knowledge-after.json');
const protectedFiles = Object.entries(before.protectedHashes).map(([file, hash]) => ({ file,
  unchanged: createHash('sha256').update(fs.readFileSync(file)).digest('hex') === hash,
  permittedMetadataOnlyChange: file === 'server/services/chat-ai-matching.ts',
}));
const knowledgeHashes = knowledge.collections.map(row => ({ collection: row.name, count: row.count,
  unchanged: previousKnowledge.collections.find(old => old.name === row.name)?.contentSha256 === row.contentSha256 }));
if (protectedFiles.some(row => !row.unchanged && !row.permittedMetadataOnlyChange) || knowledgeHashes.some(row => !row.unchanged)) throw Error('Protected baseline differs; inspect before reporting completion');
const report = {
  phase: '5D', date: '2026-10-17', timezone: 'Asia/Bangkok', generatedAt: new Date().toISOString(),
  generationCalls: 0, productionDatabaseWrites: 0, deployment: false,
  tests: { ...tests, previousRegressionTests: 115, newTests: tests.total - 115 },
  typecheck: { command: 'npx tsc --noEmit', exitCode: 0 },
  lint: { scope: 'All changed TypeScript/TSX/test/tooling files for Phase 5D', exitCode: 0 },
  build,
  mongo: { database: inventory.database, inspectedAt: inventory.at, existingCollections: inventory.names,
    newHistoryCollectionsCreatedDuringVerification: false, indexWrites: 0, readOnlyQuerySmoke: inventory.readQueries,
    logicalQuestions: knowledge.logicalQuestions, revisions: knowledge.revisions, publishedPointers: knowledge.publishedPointers,
    runtimeReadableQuestions: knowledge.runtimeReadableQuestions, knowledgeHashes,
    integrationWrites: { status: 'not_run', reason: 'MONGODB_TEST_URI not configured; no fake data in production' },
  },
  protectedFiles,
  security: { serverCharacterOnly: true, publishedAnswersRevalidated: true, optionalSignedOfferBoundToSession: true,
    adminAuthorization: true, privateNoStore: true, chatTextInQueryString: false, rawAnswerCopiesStored: false,
    sessionTokensStored: false, historyRedaction: 'heuristic; not complete DLP', defaultHistoryRetentionDays: 30 },
  api: ['POST /api/admin/chat-analytics', 'POST /api/admin/chat-questions', 'POST /api/admin/chat-questions/[id]', 'PATCH /api/admin/chat-questions/[id]', 'DELETE /api/admin/chat-questions/[id]'],
  routes: ['/admin/chat-analytics', '/admin/chat-questions'],
  limitations: [
    'Mongo TTL execution and transactional writes not integration-tested without a dedicated test DB.',
    'No browser/mobile/manual demo in this phase.',
    'History is best effort; storage outages may lose events or permit multiple answers to the same offer across instances.',
    'Concurrent first requests may run matching twice; unique history ID prevents duplicate records, not distributed exactly-once generation.',
    'Legacy clients without requestId cannot distinguish retry from a new deliberate identical message.',
    'Shared CHAT_HISTORY_SIGNING_SECRET required for reliable multi-instance signed offers during DB outages; local fallback is process-scoped.',
    'Raw history expiry removes its analytics contribution; review metadata/audit are retained without raw questions.',
    'Read-only query smoke used an empty history database; does not validate realistic data volume.',
  ],
};
fs.writeFileSync('docs/chatbot-phase-5d-test-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ tests, buildExitCode: build.exitCode, protectedFiles, knowledgeHashes, report: 'docs/chatbot-phase-5d-test-report.json' }));
