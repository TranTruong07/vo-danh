import test from 'node:test';
import assert from 'node:assert/strict';
import { loader } from './support/load-typescript.mjs';

// Evaluate the emitted Mongo match predicates against synthetic records (no DB writes).
const at = (obj, key) => key.split('.').reduce((value, part) => value?.[part], obj);
function matches(doc, query, vars = {}) {
  const value = token => token.startsWith('$$') ? vars[token.slice(2)] : at(doc, token.slice(1));
  return Object.entries(query).every(([key, rule]) => {
    if (key === '$expr') return rule.$and.every(expr => value(expr.$eq[0]) === value(expr.$eq[1]));
    const actual = at(doc, key);
    if (rule === null || typeof rule !== 'object') return actual === rule;
    return Object.entries(rule).every(([op, expected]) => {
      if (op === '$ne') return actual !== expected;
      if (op === '$regex') return typeof actual === 'string' && expected.test(actual);
      if (op === '$type') return expected === 'date' ? actual instanceof Date : expected === 'array' ? Array.isArray(actual) : typeof actual === expected;
      throw new Error(`Unsupported predicate ${op}`);
    });
  });
}
const characters = ['truong-chinh', 'le-duan', 'pham-van-dong', 'vo-nguyen-giap'];
const logical = () => ({ _id: 'cmtt45-q001', topicId: 'cach-mang-thang-tam-1945', publishedVersionId: 'cmtt45-q001:v2' });
const revision = () => ({ _id: 'cmtt45-q001:v2', questionId: 'cmtt45-q001', status: 'approved', reviewedBy: 'synthetic-reviewer', reviewedAt: new Date(), canonicalQuestion: 'Synthetic question?', aliases: ['Synthetic alias?'], approvedAnswer: 'Synthetic neutral', source: { document: 'fixture', sectionId: 'I', excerpt: 'Synthetic source' }, characterAnswers: Object.fromEntries(characters.map(c => [c, `Synthetic ${c}`])) });
function fixture(question = logical(), revisions = [revision()]) {
  const pipelines = [];
  const repo = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: name => {
    assert.equal(name, 'knowledge_questions');
    return { aggregate: pipeline => {
      pipelines.push(pipeline);
      const join = pipeline[1].$lookup;
      assert.equal(join.from, 'knowledge_question_revisions');
      assert.equal(join.let.published, '$publishedVersionId'); assert.equal(join.let.question, '$_id');
      const accepted = matches(question, pipeline[0].$match) ? revisions.filter(r => matches(r, join.pipeline[0].$match, { published: question.publishedVersionId, question: question._id })) : [];
      const answerField = join.pipeline[1].$project.answer;
      return { toArray: async () => accepted.map(r => ({ questionId: question._id, revisionId: r._id, canonicalQuestion: r.canonicalQuestion, aliases: r.aliases, ...(answerField ? { answer: at(r, answerField.slice(1)), source: { document: r.source.document, sectionId: r.source.sectionId } } : {}) })) };
    } };
  } }) } })('@/server/repositories/chat-knowledge');
  return { ...repo, pipelines };
}
test('only the pointer-selected approved revision is retrieved, never newer draft/approved revision', async () => {
  const selected = revision(), newer = { ...revision(), _id: 'cmtt45-q001:v3', canonicalQuestion: 'Newer unpublished' };
  const repo = fixture(logical(), [selected, newer]);
  assert.equal((await repo.readPublishedChatIndex())[0].revisionId, selected._id);
  for (const c of characters) {
    const answer = await repo.readPublishedChatAnswer('cmtt45-q001', c);
    assert.equal(answer.answer, `Synthetic ${c}`);
    assert.deepEqual(answer.source, { document: 'fixture', sectionId: 'I' });
    assert.equal(answer.characterAnswers, undefined);
  }
  assert.equal(await repo.readPublishedChatAnswer('cmtt45-q001', characters[0], newer._id), null);
  assert.equal(repo.pipelines[0][1].$lookup.pipeline[1].$project.answer, undefined);
});
test('draft/pending/rejected/dangling/cross-question/unpublished/wrong-topic records never appear', async () => {
  const cases = [
    ...['draft', 'pending_review', 'rejected'].map(status => [logical(), [{ ...revision(), status }]]),
    [{ ...logical(), publishedVersionId: null }, [revision()]],
    [{ ...logical(), publishedVersionId: '' }, [revision()]],
    [{ ...logical(), publishedVersionId: 'missing' }, [revision()]],
    [{ ...logical(), topicId: 'another-topic' }, [revision()]],
    [logical(), [{ ...revision(), questionId: 'cmtt45-q002' }]],
    [logical(), [{ ...revision(), reviewedBy: '' }]],
    [logical(), [{ ...revision(), reviewedAt: null }]],
    [logical(), [{ ...revision(), source: { ...revision().source, excerpt: '' } }]],
    ...characters.map(c => [logical(), [{ ...revision(), characterAnswers: { ...revision().characterAnswers, [c]: '' } }]]),
  ];
  for (const [question, revisions] of cases) {
    const repo = fixture(question, revisions);
    assert.deepEqual(await repo.readPublishedChatIndex(), []);
    assert.equal(await repo.readPublishedChatAnswer('cmtt45-q001', characters[0]), null);
  }
});
test('malformed published aliases and oversized indexes fail closed instead of hiding ambiguity', async () => {
  await assert.rejects(fixture(logical(), [{ ...revision(), aliases: [42] }]).readPublishedChatIndex(), /Invalid published/);
  const repo = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: () => ({ aggregate: () => ({ toArray: async () => Array(2001).fill({}) }) }) }) } })('@/server/repositories/chat-knowledge');
  await assert.rejects(repo.readPublishedChatIndex(), /Invalid published/);
});
test('session repository reads only binding metadata with owner/expiry and never mutates quiz', async () => {
  const calls = [];
  const repo = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: name => ({ findOne: async (query, options) => { calls.push({ name, query, options }); return null; } }) }) } })('@/server/repositories/chat-session');
  await repo.readChatGameSession('id', 'owner');
  assert.equal(calls[0].name, 'quiz_attempts');
  assert.equal(calls[0].query.ownerHash, 'owner'); assert.equal(calls[0].query.state, 'ready');
  assert.ok(calls[0].query.expiresAt.$gt instanceof Date);
  assert.deepEqual(Object.keys(calls[0].options.projection).sort(), ['_id', 'characterId', 'expiresAt', 'ownerHash', 'state']);
  assert.equal(await repo.chatCharacterExists('b'.repeat(24)), false);
});
test('quota writes only its own collection, handles duplicate upsert and uses expiring atomic counters', async () => {
  const calls = [];
  const repo = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: name => {
    assert.equal(name, 'chat_limits');
    return { createIndex: async (keys, opts) => { assert.deepEqual(keys, { expiresAt: 1 }); assert.equal(opts.expireAfterSeconds, 0); },
      findOneAndUpdate: async (...args) => { calls.push(args); if (calls.length === 1) throw { code: 11000 }; return { count: 2 }; } };
  } }) } })('@/server/repositories/chat-limits');
  assert.equal(await repo.incrementChatLimit('quota', new Date()), 2);
  assert.equal(calls[0][2].upsert, true); assert.equal(calls[1][2].upsert, undefined);
  assert.deepEqual(calls[1][1], { $inc: { count: 1 } });
});
test('quota storage failure never allows an unmetered request', async () => {
  const service = loader({ '@/server/repositories/chat-limits': { incrementChatLimit: async () => { throw new Error('unavailable'); } } })('@/server/services/chat-rate-limit');
  await assert.rejects(service.limitChatRequests('owner'), /unavailable/);
});
