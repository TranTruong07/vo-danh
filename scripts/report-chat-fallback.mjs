import fs from 'node:fs';
import { createHash } from 'node:crypto';
const reportFile = 'docs/chatbot-phase-5c3b-test-report.json';
const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const snapshot = read('.local/chat-phase-5c3b/snapshot.json');
const before = read('.local/chat-phase-5c3/knowledge-after.json');
const after = read('.local/chat-phase-5c3b/knowledge-after.json');
report.validation = { ...report.validation, typescript: { status: 'passed', command: 'npx tsc --noEmit' },
  lint: { status: 'passed', scope: 'All code/test/tooling files added or edited in 5C.3B' },
  browserE2E: { status: 'not_run', reason: 'UI response formatter/client and HTTP/service covered with offline mocks; no live server or Gemini calls.' },
  databaseIntegration: { status: 'not_run', reason: 'No separate MONGODB_TEST_URI; production knowledge inspected read-only only.' },
  buildNotes: ['Initial isolated copy omitted actions/data/hooks/types/tests; corrected the build harness, not application code.', 'Next production webpack build passed. PWA post-build script not run; no PWA source/assets changed.', 'Multiple lockfiles/workspace-root and experimental JSON import warnings remain.'] };
report.integrity.protectedFilesUnchanged = Object.fromEntries(Object.entries(snapshot.protectedHashes).map(([file, hash]) => [file, createHash('sha256').update(fs.readFileSync(file)).digest('hex') === hash]));
report.integrity.knowledgeComparison = { baseline: '.local/chat-phase-5c3/knowledge-after.json', inspectedAt: after.inspectedAt,
  unchanged: before.collections.length === after.collections.length && before.collections.every(b => after.collections.some(a => a.name === b.name && a.count === b.count && a.contentSha256 === b.contentSha256)),
  logicalQuestions: after.logicalQuestions, publishedQuestions: after.runtimeReadableQuestions, revisions: after.revisions, auditRecords: after.collections.find(c => c.name === 'knowledge_audit')?.count };
report.runtimeFiles = ['server/services/chat-vietnamese-ranking.ts', 'server/services/chat-matcher.ts', 'server/services/chat-ai-candidates.ts',
  'server/services/chat-ai-matching.ts', 'server/services/chat.ts', 'server/domain/chat.ts', 'features/game/chat-client.ts', 'features/game/character-chat.tsx'];
report.runtimeSha256 = Object.fromEntries(report.runtimeFiles.map(file => [file, createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ tests: report.validation.tests, build: report.validation.build.exitCode, knowledgeUnchanged: report.integrity.knowledgeComparison.unchanged,
  protectedFilesUnchanged: Object.values(report.integrity.protectedFilesUnchanged).every(Boolean), generationCalls: report.generationCalls }));
