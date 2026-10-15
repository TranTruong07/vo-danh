import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { loader } from "./support/load-typescript.mjs";
import { holdout } from "./fixtures/knowledge-phase-2-5-holdout.mjs";
import { auditCoverage, evaluateMatching, personaIds, stats } from "../scripts/knowledge/phase-2-5-audit.mjs";

const load = loader();
const { buildPhase25Drafts, newProposals, revisionRepairs, questionId } = load("@/scripts/knowledge/phase-2-5");
const { facetEvidence } = load("@/scripts/knowledge/phase-2-5-evidence");
const { validateKnowledge } = load("@/server/services/knowledge-validation");
const { normalizeKnowledgePhrase } = load("@/server/domain/knowledge");
const { matchChatQuestion } = load("@/server/services/chat-matcher");
const read = path => JSON.parse(readFileSync(path, "utf8"));
const before = read("knowledge/draft-questions-phase-2-v3.json");
const after = read("knowledge/draft-questions-phase-2-v4.json");
const oldAudit = read("knowledge/coverage-audit.json");
const audit = read("knowledge/coverage-audit-v4.json");
const manifest = read("knowledge/extraction-manifest.json");
const changes = read("knowledge/phase-2-5-changes.json");
const q = n => after.find(row => row._id === questionId(n));
const evaluate = (cases, rows) => evaluateMatching(cases, rows, matchChatQuestion, normalizeKnowledgePhrase);
const recompute = rows => auditCoverage(oldAudit, before, rows, facetEvidence);

test("v4 has 59 logical IDs, 37 new revisions, and retains 22 untouched v3 records", () => {
  assert.equal(after.length, 59);
  assert.equal(new Set(after.map(row => row._id)).size, 59);
  assert.equal(changes.changes.length, 37);
  assert.equal(after.filter(row => row.version === 1).length, 19);
  assert.equal(after.filter(row => row.version === 3).length, 22);
  assert.equal(after.filter(row => row.version === 4).length, 18);
  assert.equal(new Set(after.map(row => normalizeKnowledgePhrase(row.canonicalQuestion))).size, 59);
});

test("schema and exact source locators validate without alias collisions or review metadata", () => {
  const result = validateKnowledge(after, manifest);
  assert.deepEqual(result.errors, []);
  assert.equal(result.records.length, 59);
  assert.equal(result.warnings.length, 23);
  assert.ok(!result.warnings.some(w => ["LOCAL_ALIAS", "ALIAS_COLLISION"].includes(w.code)));
  for (const row of after) {
    assert.equal(row.status, "draft");
    for (const field of ["reviewedBy", "reviewedAt", "publishedVersionId"]) assert.equal(row[field], undefined);
    const selected = row.source.blockIds.map(id => manifest.blocks.find(block => block.id === id));
    assert.equal(row.source.excerpt, selected.map(block => block.text).join("\n"));
    assert.equal(row.source.paragraphIndex, selected[0].paragraphIndex);
  }
});

test("old v3 file is immutable and untouched/alias-only records preserve their content", () => {
  assert.equal(createHash("sha256").update(readFileSync("knowledge/draft-questions-phase-2-v3.json")).digest("hex"), "88eadd13039a5a87d4c1c871ed8f75c49aa36990ddef4e2cbbb642eabaec1dba");
  for (const old of before) {
    const next = after.find(row => row._id === old._id);
    const change = changes.changes.find(item => item.questionId === old._id);
    if (!change) assert.deepEqual(next, old);
    if (change?.kind === "aliases_only") for (const field of ["canonicalQuestion", "approvedAnswer", "characterAnswers", "source", "createdAt"]) assert.deepEqual(next[field], old[field]);
    if (change) assert.equal(next.version, 4);
  }
});

test("generator is deterministic for fixed inputs, does not mutate input and refuses reviewed input", () => {
  const snapshot = JSON.stringify(before);
  const generated = buildPhase25Drafts(before, manifest, q(41).createdAt);
  assert.deepEqual(generated.drafts, after);
  assert.equal(JSON.stringify(before), snapshot);
  const invalid = structuredClone(before); invalid[0].status = "approved";
  assert.throws(() => buildPhase25Drafts(invalid, manifest, q(41).createdAt));
  assert.throws(() => buildPhase25Drafts(before, { ...manifest, sourceSha256: "0".repeat(64) }, q(41).createdAt));
});

test("N01–N19 all retain every neutral clause in four distinct educational personas", () => {
  assert.deepEqual(newProposals.map(p => p.proposalId), Array.from({ length: 19 }, (_, i) => `N${String(i + 1).padStart(2, "0")}`));
  for (const proposal of newProposals) {
    const row = q(proposal.number);
    assert.equal(new Set(Object.values(row.characterAnswers)).size, 4);
    for (const clause of proposal.clauses) {
      assert.ok(row.approvedAnswer.includes(clause));
      for (const text of Object.values(row.characterAnswers)) assert.ok(text.includes(clause), `${row._id}: lost clause`);
    }
    for (const text of Object.values(row.characterAnswers)) assert.doesNotMatch(text, /(?:ta|tôi|bác) (?:đã|từng|trực tiếp chỉ huy|nhớ khi)/iu);
  }
});

test("R01–R09 keep all original neutral facts and source blocks, add missing locators", () => {
  for (const number of revisionRepairs) {
    const old = before.find(row => row._id === questionId(number)), next = q(number);
    assert.equal(next.version, 4);
    for (const clause of old.approvedAnswer.split("\n")) {
      assert.ok(next.approvedAnswer.includes(clause));
      for (const text of Object.values(next.characterAnswers)) assert.ok(text.includes(clause));
    }
    for (const id of old.source.blockIds) assert.ok(next.source.blockIds.includes(id));
  }
  assert.ok(q(13).source.blockIds.includes("body/18"));
  assert.ok(q(11).source.blockIds.includes("body/42"));
  assert.ok(q(11).source.blockIds.includes("body/43"));
});

test("N17/N18 preserve correction, collective roles and limitations in all five answers", () => {
  for (const number of [54, 57, 58]) {
    const row = q(number);
    assert.ok(row.source.blockIds.includes("body/111"));
    assert.ok(row.source.blockIds.includes("body/167"));
    for (const text of [row.approvedAnswer, ...Object.values(row.characterAnswers)]) {
      assert.match(text, /1940/); assert.match(text, /Côn Đảo/);
      assert.match(text, /sau khi Cách mạng tháng Tám thành công/);
      assert.match(text, /không (?:gán cho|trình bày ông) trực tiếp chỉ đạo/iu);
    }
  }
  for (const text of [q(57).approvedAnswer, ...Object.values(q(57).characterAnswers)]) assert.match(text, /Nguồn chưa xác định thời điểm riêng/);
  for (const text of [q(58).approvedAnswer, ...Object.values(q(58).characterAnswers)]) {
    assert.match(text, /các tổ chức Đảng/); assert.match(text, /đông đảo quần chúng/);
    assert.match(text, /Không quy thắng lợi ấy cho riêng Lê Duẩn/);
  }
});

test("dates, issuing/reading Quân lệnh and subjective causes stay distinct", () => {
  for (const text of Object.values(q(14).characterAnswers)) assert.match(text, /đêm 13\/8\/1945/);
  for (const text of Object.values(q(26).characterAnswers)) assert.match(text, /16\/8\/1945 tại Tân Trào/);
  for (const text of Object.values(q(3).characterAnswers)) { assert.match(text, /15\/8\/1945/); assert.match(text, /2\/9\/1945/); }
  for (const text of Object.values(q(31).characterAnswers)) {
    assert.match(text, /chủ trương và quyết định khởi nghĩa được đưa ra kịp thời/);
    assert.match(text, /Đảng và Chủ tịch Hồ Chí Minh/);
    assert.match(text, /Mặt trận Việt Minh/);
  }
});

test("all 18 historical warnings remain open; five additional warnings are reported", () => {
  const old = validateKnowledge(before, manifest).warnings;
  assert.equal(old.length, 18);
  for (const warning of old) assert.ok(changes.warnings.some(w => w.questionId === warning.questionId && w.code === warning.code));
  assert.equal(changes.inheritedWarnings.length, 18);
  assert.ok(changes.inheritedWarnings.every(w => !w.resolved && w.status === "needs_admin_review"));
  assert.ok(changes.sourceReconciliation.every(r => !r.resolved));
});

test("audit keeps all 92 units, 136 facets, source locators and I–X boundaries unchanged", () => {
  assert.equal(audit.units.length, 92);
  assert.equal(audit.units.flatMap(u => u.facets).length, 136);
  for (const old of oldAudit.units) {
    const next = audit.units.find(u => u.id === old.id);
    assert.deepEqual(next.sourceBlockIds, old.sourceBlockIds);
    for (const facet of old.facets) {
      const nextFacet = next.facets.find(f => f.id === facet.id);
      for (const field of ["claim", "sourceBlockIds", "sections"]) assert.deepEqual(nextFacet[field], facet[field]);
    }
  }
  for (let i = 0; i < 10; i++) assert.deepEqual(audit.sections[i].assessments.map(a => [a.unitId, a.facetIds]), oldAudit.sections[i].assessments.map(a => [a.unitId, a.facetIds]));
});

test("all reported per-persona coverage and totals recompute from actual evidence", () => {
  const actual = recompute(after);
  for (const key of ["summary", "units", "sections", "remainingGaps"]) assert.deepEqual(actual[key], audit[key]);
  assert.deepEqual(stats(["covered", "partially_covered", "uncovered"]), { total: 3, covered: 1, partially_covered: 1, uncovered: 1, strictPercent: 33.33, partialCreditPercent: 50, anyCoveragePercent: 66.67 });
  for (const u of audit.units) for (const f of u.facets) for (const [channel, evidence] of Object.entries(f.channelEvidence)) {
    for (const e of evidence) {
      const row = after.find(row => row._id === e.questionId);
      assert.equal(row.version, e.version);
      if (e.verifiedAnchors) for (const anchor of e.verifiedAnchors) assert.ok((channel === "neutral" ? row.approvedAnswer : row.characterAnswers[channel]).includes(anchor));
    }
  }
});

test("audit detects loss in one persona instead of inferring four from one", () => {
  const changed = structuredClone(after);
  changed.find(row => row._id === questionId(55)).characterAnswers["truong-chinh"] = "Không còn dữ kiện.";
  const unit = recompute(changed).units.find(u => u.id === "K066");
  assert.equal(unit.coverage, "partially_covered");
  assert.equal(unit.neutralCoverage, "covered");
  assert.equal(unit.characterCoverage["truong-chinh"], "uncovered");
  assert.equal(unit.characterCoverage["le-duan"], "covered");
});

test("audit downgrades missing neutral and missing restored persona detail", () => {
  const changed = structuredClone(after);
  changed.find(row => row._id === questionId(55)).approvedAnswer = "Không còn dữ kiện.";
  changed.find(row => row._id === questionId(29)).characterAnswers["vo-nguyen-giap"] = "Thắng lợi tạo cơ sở xây dựng nhà nước mới.";
  const actual = recompute(changed);
  assert.equal(actual.units.find(u => u.id === "K066").neutralCoverage, "uncovered");
  assert.equal(actual.units.find(u => u.id === "K066").coverage, "partially_covered");
  assert.equal(actual.units.find(u => u.id === "K079").coverage, "partially_covered");
});

test("holdout contains independent short/reordered/unaccented/negative/multi/scope cases", () => {
  assert.equal(holdout.length, 36);
  assert.equal(new Set(holdout.map(h => h.category)).size, 6);
  for (const rows of [before, after]) assert.equal(evaluate(holdout, rows).declaredOverlap, 0);
  const result = evaluate(holdout, after);
  assert.equal(result.unsafeAutoAnswers, 0);
  assert.equal(result.supportedIntentCount, 27);
  assert.deepEqual(result, audit.expressionAudit.holdout.after);
});

test("declared phrases resolve uniquely; this consistency check is not held-out recall", () => {
  const entries = after.map(row => ({ questionId: row._id, revisionId: `${row._id}:v${row.version}`, canonicalQuestion: row.canonicalQuestion, aliases: row.aliases }));
  for (const entry of entries) for (const phrase of [entry.canonicalQuestion, ...entry.aliases]) {
    const result = matchChatQuestion(phrase, entries);
    assert.equal(result.type, "exact"); assert.equal(result.entry.questionId, entry.questionId);
  }
});

test("ambiguous exact, undeclared fuzzy, negated/multi/outside queries never become certain answers", () => {
  const entries = after.map(row => ({ questionId: row._id, revisionId: `${row._id}:v${row.version}`, canonicalQuestion: row.canonicalQuestion, aliases: row.aliases }));
  const duplicate = structuredClone(entries); duplicate[1].aliases.push(entries[0].canonicalQuestion);
  assert.equal(matchChatQuestion(entries[0].canonicalQuestion, duplicate).type, "suggest");
  const typo = matchChatQuestion("Khởi nghĩa giành chính quyên ở Hà Nội thắng lợi ngày nào?", entries);
  assert.equal(typo.type, "suggest");
  for (const probe of holdout.filter(h => ["negation", "multi_intent", "out_of_scope"].includes(h.category))) assert.notEqual(matchChatQuestion(probe.query, entries).type, "exact");
  for (const persona of personaIds) assert.ok(q(53).characterAnswers[persona]);
});
