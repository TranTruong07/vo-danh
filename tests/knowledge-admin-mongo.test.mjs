import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { loader } from './support/load-typescript.mjs';
import { fixtureState, command, questionId, manifest, testActor } from './support/knowledge-admin-fixture.mjs';

// Opt in with a dedicated test URI. Never load .env.local or fall back to MONGODB_URI.
test('Mongo replica-set integration: transitions, atomic audit, races, rollback and runtime visibility', { skip: !process.env.MONGODB_TEST_URI }, async t => {
  const name = `codex_knowledge_test_${randomUUID().replaceAll('-', '')}`;
  const client = new MongoClient(process.env.MONGODB_TEST_URI, { serverSelectionTimeoutMS: 5000 });
  let created = false;
  try {
    await client.connect();
    const hello = await client.db('admin').command({ hello: 1 });
    if (!hello.setName && hello.msg !== 'isdbgrid') { t.skip('MongoDB test server must support transactions (replica set).'); return; }
    const db = client.db(name);
    assert.match(name, /^codex_knowledge_test_[a-f0-9]{32}$/);
    assert.equal((await db.listCollections({}, { nameOnly: true }).toArray()).length, 0);
    const state = fixtureState(); created = true;
    await db.collection('knowledge_questions').insertOne(state.question);
    await db.collection('knowledge_question_revisions').insertMany(state.revisions);
    const load = loader({ '@/lib/db/client': { getDatabase: async () => db, getMongoClient: async () => client } });
    const repo = load('@/server/repositories/knowledge-admin'), chat = load('@/server/repositories/chat-knowledge');
    const { planKnowledgeMutation } = load('@/server/services/knowledge-admin');
    const run = (cmd, extra = {}) => repo.mutateKnowledge(questionId, cmd.expectedVersion, s => ({ ...planKnowledgeMutation(s, cmd, testActor, manifest), ...extra }));
    assert.deepEqual(await chat.readPublishedChatIndex(), []);
    await assert.rejects(run(command('publish')), e => e.code === 'INVALID_TRANSITION');
    assert.equal(await db.collection('knowledge_audit').countDocuments(), 0);
    await run(command('approve'));
    assert.deepEqual(await chat.readPublishedChatIndex(), []);
    await assert.rejects(run(command('publish')), e => e.code === 'CONFLICT');
    await run(command('publish', { expectedVersion: 1 }));
    assert.equal((await chat.readPublishedChatAnswer(questionId, 'le-duan')).answer, state.revisions[0].characterAnswers['le-duan']);
    const content = { canonicalQuestion: 'Câu hỏi fixture mới?', aliases: state.revisions[0].aliases, approvedAnswer: 'Nội dung fixture mới.', characterAnswers: state.revisions[0].characterAnswers };
    const racing = await Promise.allSettled([run(command('create_revision', { expectedVersion: 2, content })), run(command('unpublish', { expectedVersion: 2 }))]);
    assert.equal(racing.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(racing.filter(r => r.status === 'rejected' && r.reason.code === 'CONFLICT').length, 1);
    const before = await repo.readKnowledgeState(questionId);
    const existingAudit = await db.collection('knowledge_audit').findOne({});
    const action = before.question.publishedVersionId ? 'unpublish' : 'publish';
    await assert.rejects(repo.mutateKnowledge(questionId, 3, s => { const p = planKnowledgeMutation(s, command(action, { expectedVersion: 3 }), testActor, manifest); p.audit._id = existingAudit._id; return p; }));
    assert.deepEqual((await repo.readKnowledgeState(questionId)).question, before.question, 'audit failure rolls back pointer/version');
    const unpub = await repo.readKnowledgeState(questionId);
    if (unpub.question.publishedVersionId) await run(command('unpublish', { expectedVersion: unpub.question.managementVersion }));
    assert.deepEqual(await chat.readPublishedChatIndex(), []);
    assert.equal((await repo.readKnowledgeState(questionId)).revisions.find(r => r.version === 3).status, 'approved');
    assert.ok(await db.collection('knowledge_audit').countDocuments() >= 3);
  } finally {
    // Only the unique test database created above can be dropped.
    if (created && /^codex_knowledge_test_[a-f0-9]{32}$/.test(name)) await client.db(name).dropDatabase();
    await client.close();
  }
});
