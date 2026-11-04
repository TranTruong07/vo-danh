import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildGenerationPlan } from '../scripts/knowledge/rebuild-generation-plan.mjs';
import { loader } from './support/load-typescript.mjs';
const manifest = JSON.parse(readFileSync('knowledge/new-source-manifest.json', 'utf8'));
const drafts = JSON.parse(readFileSync('knowledge/new-questions-draft.json', 'utf8'));
const plan = buildGenerationPlan(manifest);
const load = loader();
const { parseProposal, detectDuplicates } = load('@/server/services/knowledge-generation-validation');
const { PERSONA_FRAMES } = load('@/server/domain/knowledge-generation');
const { KNOWLEDGE_CHARACTERS } = load('@/server/domain/knowledge');
function proposal(frame = 0) {
  const d = drafts[0], chunk = { _id: 'offline', sourceId: 'offline', text: d.source.excerpt };
  return { chunk, row: { canonicalQuestion: d.canonicalQuestion, aliases: [...d.aliases], neutralAnswer: d.approvedAnswer,
    characterAnswers: Object.fromEntries(KNOWLEDGE_CHARACTERS.map(k => [k, PERSONA_FRAMES[k][frame] + d.approvedAnswer])),
    evidence: [{ chunkId: chunk._id, sourceId: chunk.sourceId, quote: chunk.text }], warnings: [], insufficientEvidence: false } };
}
test('plan is pinned to actual new DOCX and refuses changed source', () => {
  assert.equal(createHash('sha256').update(readFileSync('docs/source/Tong-hop-kien-thuc-moi.docx')).digest('hex'), plan.sourceSha256);
  assert.throws(() => buildGenerationPlan({ ...manifest, document: 'other.docx' }));
  assert.throws(() => buildGenerationPlan({ ...manifest, sourceSha256: '0'.repeat(64) }));
});
test('source contexts preserve contiguous paragraphs and references without inventing text', () => {
  for (const u of plan.units) {
    const blocks = u.source.blockIds.map(id => manifest.blocks.find(b => b.id === id));
    assert.equal(u.context.text, blocks.map(b => b.text).join('\n'));
    assert.equal(u.sectionId, blocks[0].sectionId);
    assert.ok(blocks.every((b, i) => i === 0 || b.order === blocks[i-1].order + 1));
    assert.ok(u.context.text.length <= 6000);
  }
  assert.throws(() => buildGenerationPlan({ ...manifest, blocks: manifest.blocks.filter(b => b.order !== 25) }));
});
test('existing IDs and held history are excluded from every proposed batch', () => {
  assert.deepEqual(plan.units.filter(u => u.existingQuestionId).map(u => u.existingQuestionId), drafts.map(d => d._id));
  const selected = plan.batches.flatMap(b => b.unitKeys);
  assert.equal(new Set(selected).size, selected.length);
  assert.ok(plan.units.filter(u => u.status !== 'proposed_not_authorized').every(u => !selected.includes(u.key)));
  assert.equal(plan.units.filter(u => u.status === 'hold_for_source_review').length, 4);
  assert.equal(plan.safeguards.generationCallsAuthorized, 0);
  assert.equal(plan.safeguards.writeDatabase, false);
});
test('coverage counts intents once, not four personas or aliases', () => {
  assert.equal(plan.counts.units, plan.counts.existing + plan.counts.proposed + plan.counts.held);
  assert.equal(plan.coverage.draftIntentPercent, Number((100 * drafts.length / plan.units.length).toFixed(2)));
  assert.equal(plan.sections.reduce((n, s) => n + s.units, 0), plan.units.length);
});
test('both allowed frames preserve full core for every persona; no source rewriting', () => {
  for (const frame of [0, 1]) { const { row, chunk } = proposal(frame); assert.equal(parseProposal(row, [chunk]).insufficientEvidence, false); }
});
test('proposed natural frame remains rejected pending separate review', () => {
  const { row, chunk } = proposal();
  row.characterAnswers['pham-van-dong'] = 'Mình cùng khám phá câu chuyện này nhé: ' + row.neutralAnswer;
  assert.equal(parseProposal(row, [chunk]).insufficientEvidence, true);
});
test('factual mutation, omitted core, invented role and appended claim fail grounding', () => {
  for (const transform of [s => s.replace('28/1/1941', '29/1/1941'), s => s.replace('Nguyễn Ái Quốc', 'Hoàng Quốc Việt'),
    s => s.replace('sau hơn 30 năm hoạt động ở nước ngoài.', ''), s => 'Bác đã trực tiếp chỉ huy. ' + s, s => s + ' Sự kiện diễn ra ở Huế.']) {
    const { row, chunk } = proposal(); row.characterAnswers['vo-nguyen-giap'] = transform(row.characterAnswers['vo-nguyen-giap']);
    assert.equal(parseProposal(row, [chunk]).insufficientEvidence, true);
  }
});
test('fabricated citation and multiple chunks are rejected', () => {
  const { row, chunk } = proposal(); row.evidence[0].quote = 'Không có trong nguồn.';
  assert.throws(() => parseProposal(row, [chunk]));
  const second = proposal(); second.row.evidence.push({ ...second.row.evidence[0], chunkId: 'second' });
  assert.throws(() => parseProposal(second.row, [second.chunk, { ...second.chunk, _id: 'second' }]));
});
test('duplicate detector finds existing logical questions and same core paraphrase', () => {
  const candidates = drafts.map(d => ({ id: d._id, canonicalQuestion: d.canonicalQuestion, aliases: d.aliases, neutralAnswer: d.approvedAnswer }));
  for (const d of drafts) assert.ok(detectDuplicates({ canonicalQuestion: d.canonicalQuestion, aliases: [] }, candidates).some(m => m.id === d._id && m.kind === 'exact_duplicate'));
  assert.ok(detectDuplicates({ canonicalQuestion: 'Một cách hỏi khác?', aliases: [], neutralAnswer: drafts[0].approvedAnswer }, candidates).some(m => m.id === drafts[0]._id));
});
