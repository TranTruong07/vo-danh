import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ObjectId } from 'mongodb';
import { loader } from './support/load-typescript.mjs';

test('shuffle bags exhaust every question before repeating, avoid cycle-boundary repeats and accommodate bank changes', () => {
  const { questionCandidates } = loader()('@/server/domain/question-cycle');
  const ids = ['a', 'b', 'c', 'd']; let seen = [], last;
  for (let cycle = 0; cycle < 40; cycle++) {
    const draws = [];
    for (let i = 0; i < ids.length; i++) {
      const bag = questionCandidates(ids, seen, last);
      const selected = bag.candidates[(cycle + i) % bag.candidates.length];
      assert.notEqual(selected, last);
      seen = [...bag.seenIds, selected]; last = selected; draws.push(selected);
    }
    assert.equal(new Set(draws).size, ids.length);
  }
  assert.deepEqual(questionCandidates(['a', 'b', 'new'], ['a', 'b', 'deleted'], 'b'), { candidates: ['new'], seenIds: ['a', 'b'] });
  assert.deepEqual(questionCandidates(['a'], ['a'], 'a').candidates, ['a']);
  assert.deepEqual(questionCandidates([], [], undefined).candidates, []);
});

test('atomic draw retries prevent simultaneous tabs from selecting the same question within a cycle', async () => {
  const rows = new Map(); const characterId = new ObjectId().toHexString();
  let questions = Array.from({ length: 4 }, () => ({ _id: new ObjectId(), characterId, question: 'Question' }));
  const cycles = {
    createIndex: async () => {},
    findOne: async filter => rows.has(filter._id) ? structuredClone(rows.get(filter._id)) : null,
    insertOne: async row => { if (rows.has(row._id)) throw { code: 11000 }; rows.set(row._id, row); },
    replaceOne: async (filter, row) => {
      if (rows.get(filter._id)?.version !== filter.version) return { modifiedCount: 0 };
      rows.set(filter._id, row); return { modifiedCount: 1 };
    },
  };
  const bank = { find: filter => ({ toArray: async () => questions.filter(row => row.characterId === filter.characterId) }), findOne: async filter => questions.find(row => row.characterId === filter.characterId && row._id.equals(filter._id)) };
  const { drawCharacterQuestion } = loader({ '@/lib/db/client': { getDatabase: async () => ({ collection: name => name === 'question_cycles' ? cycles : bank }) } })('@/server/repositories/question-cycles');
  const first = await Promise.all(Array.from({ length: 4 }, () => drawCharacterQuestion(characterId, 'player-one')));
  assert.equal(new Set(first.map(row => row._id.toHexString())).size, 4);
  const last = rows.get(`player-one:${characterId}`).lastId;
  assert.notEqual((await drawCharacterQuestion(characterId, 'player-one'))._id.toHexString(), last);
  await drawCharacterQuestion(characterId, 'player-two');
  assert.equal(rows.get(`player-two:${characterId}`).seenIds.length, 1);
  questions = [];
  assert.equal(await drawCharacterQuestion(characterId, 'player-one'), null);
});
