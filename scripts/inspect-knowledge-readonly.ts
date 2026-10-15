import { loadEnvConfig } from "@next/env";
import { createHash } from "node:crypto";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { BSON, type MongoClient } from "mongodb";
import { getDatabase, getMongoClient } from "../lib/db/client";
import { readKnowledgeImportState } from "../server/repositories/knowledge-import";
import { readPublishedChatIndex } from "../server/repositories/chat-knowledge";

// Deliberately bypass auth repositories: even their reads can initialize indexes.
// This command has no mutation mode and never creates indexes or collections.
let connectedClient: MongoClient | undefined;
async function main() {
  const { values } = parseArgs({ options: { report: { type: "string" } }, strict: true });
  if (!values.report) throw new Error("--report is required");
  loadEnvConfig(process.cwd());
  connectedClient = await getMongoClient();
  const db = await getDatabase();
  const names = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map(row => row.name).filter(name => name.startsWith("knowledge")).sort();
  const collections = await Promise.all(names.map(async name => {
    const rows = await db.collection(name).find({}).sort({ _id: 1 }).toArray();
    const indexes = await db.collection(name).listIndexes().toArray();
    return { name, count: rows.length, indexes,
      contentSha256: createHash("sha256").update(BSON.EJSON.stringify(rows, { relaxed: false })).digest("hex") };
  }));
  const { questions, revisions } = await readKnowledgeImportState();
  const hello = await db.command({ hello: 1 });
  const runtimeIndex = await readPublishedChatIndex();
  const duplicateVersions = revisions.filter((r, i) => revisions.findIndex(other => other.questionId === r.questionId && other.version === r.version) !== i).map(r => r._id);
  const invalidRevisionIds = revisions.filter(r => r._id !== `${r.questionId}:v${r.version}`).map(r => r._id);
  const orphanRevisions = revisions.filter(r => !questions.some(q => q._id === r.questionId)).map(r => r._id);
  const brokenPublishedPointers = questions.filter(q => q.publishedVersionId && !revisions.some(r => r._id === q.publishedVersionId && r.questionId === q._id && r.status === "approved" && !!r.reviewedBy && r.reviewedAt instanceof Date)).map(q => q._id);
  const report = {
    inspectedAt: new Date().toISOString(), mode: "read-only", databaseName: db.databaseName,
    collections, logicalQuestions: questions.length, revisions: revisions.length,
    revisionVersions: Object.fromEntries([...new Set(revisions.map(r => r.version))].sort((a, b) => a - b).map(v => [v, revisions.filter(r => r.version === v).length])),
    revisionStatuses: Object.fromEntries([...new Set(revisions.map(r => r.status))].sort().map(s => [s, revisions.filter(r => r.status === s).length])),
    approvedRevisions: revisions.filter(r => r.status === "approved").length,
    publishedPointers: questions.filter(q => q.publishedVersionId).length,
    runtimeReadableQuestions: runtimeIndex.length,
    supportsTransactions: !!hello.setName || hello.msg === "isdbgrid",
    adminConfiguration: { emailConfigured: !!process.env.ADMIN_EMAIL?.trim(), passwordConfigured: !!process.env.ADMIN_PASSWORD?.trim() },
    integrationTestUriConfigured: !!process.env.MONGODB_TEST_URI?.trim(),
    integrity: { duplicateVersions, invalidRevisionIds, orphanRevisions, brokenPublishedPointers },
    questions: questions.map(q => ({ id: q._id, topicId: q.topicId, publishedVersionId: q.publishedVersionId ?? null, managementVersion: q.managementVersion ?? 0 })),
    revisionInventory: revisions.map(r => ({ id: r._id, questionId: r.questionId, version: r.version, status: r.status, reviewerPresent: !!r.reviewedBy, reviewedAtPresent: r.reviewedAt instanceof Date })),
    writes: 0, indexesCreated: 0, collectionsCreated: 0,
  };
  mkdirSync(dirname(values.report), { recursive: true });
  writeFileSync(values.report, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify({ report: values.report, ...report, collections: collections.map(({ name, count }) => ({ name, count })), questions: undefined, revisionInventory: undefined }));
}
main().catch(() => {
  // Driver errors may contain connection details; do not log them.
  console.error("Read-only inspection failed. Check MongoDB access/configuration; no credentials logged.");
  process.exitCode = 1;
}).finally(async () => { await connectedClient?.close(); });
