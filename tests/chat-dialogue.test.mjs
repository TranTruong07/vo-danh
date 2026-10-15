import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { loader } from './support/load-typescript.mjs';

const load = loader();
const { proposeCharacterDialogue } = load('@/scripts/knowledge/character-dialogue');
const { DRAFT_OUTLINE } = load('@/scripts/knowledge/draft-outline');
test('all forty proposals provide four distinct educational voices, without invented first-person memories', () => {
  assert.equal(DRAFT_OUTLINE.length, 40);
  for (const row of DRAFT_OUTLINE) {
    const replies = proposeCharacterDialogue(row.id);
    assert.equal(Object.keys(replies).length, 4);
    assert.equal(new Set(Object.values(replies)).size, 4);
    for (const reply of Object.values(replies)) {
      assert.doesNotMatch(reply, /(?:ta|tôi|bác) (?:đã|từng|nhớ khi|trực tiếp chỉ huy)/iu);
      assert.match(reply, /cháu/i);
    }
  }
  assert.throws(() => proposeCharacterDialogue('missing'));
});
test('sensitive proposals retain source qualifications: Lê Duẩn, two Quân lệnh dates and collective uprising', () => {
  for (const answer of Object.values(proposeCharacterDialogue('cmtt45-q023'))) {
    assert.match(answer, /sau khi Cách mạng tháng Tám thành công/);
    assert.match(answer, /Không nên trình bày đồng chí trực tiếp chỉ đạo/);
  }
  for (const answer of Object.values(proposeCharacterDialogue('cmtt45-q014'))) assert.match(answer, /đêm 13\/8\/1945/);
  for (const answer of Object.values(proposeCharacterDialogue('cmtt45-q026'))) assert.match(answer, /16\/8\/1945/);
  for (const answer of Object.values(proposeCharacterDialogue('cmtt45-q025'))) assert.match(answer, /không chỉ là một chiến dịch quân sự/);
});
const hasArtifacts = existsSync('knowledge/draft-questions-phase-2-v3.json') && existsSync('knowledge/draft-questions-phase-2.json');
test('generated revisions preserve source/neutral answers/aliases and remain unreviewed drafts', { skip: !hasArtifacts }, () => {
  const before = JSON.parse(readFileSync('knowledge/draft-questions-phase-2.json', 'utf8'));
  const after = JSON.parse(readFileSync('knowledge/draft-questions-phase-2-v3.json', 'utf8'));
  assert.equal(after.length, before.length);
  for (const row of after) {
    const old = before.find(r => r._id === row._id);
    assert.ok(old); assert.equal(row.version, old.version + 1); assert.equal(row.status, 'draft');
    assert.equal(row.reviewedBy, undefined); assert.equal(row.reviewedAt, undefined); assert.equal(row.publishedVersionId, undefined);
    for (const key of ['source', 'approvedAnswer', 'aliases', 'canonicalQuestion', 'normalizedPhrases']) assert.deepEqual(row[key], old[key]);
    assert.deepEqual(row.characterAnswers, proposeCharacterDialogue(row._id));
  }
});
