import test from 'node:test';
import assert from 'node:assert/strict';
import { loader } from './support/load-typescript.mjs';

const load = loader();
const { parseProposal, detectDuplicates } = load('@/server/services/knowledge-generation-validation');
const { KNOWLEDGE_CHARACTERS } = load('@/server/domain/knowledge');
const { PERSONA_FRAMES } = load('@/server/domain/knowledge-generation');
const sourceId = '11111111-1111-4111-8111-111111111111', proposalId = 'a'.repeat(64);
// Synthetic editorial fixtures; not historical knowledge and never imported.
const core = 'Đây là nội dung thử nghiệm để kiểm tra nguồn trích dẫn.';
const chunk = { _id: `${sourceId}:0`, sourceId, text: core, section: 'Tiêu đề của tài liệu kiểm thử rất dài nhưng không phải một mã mục', paragraphIndex: 0, order: 0, start: 0, end: core.length };
const source = { _id: sourceId, sourceStatus: 'confirmed', confirmedBy: 'real-admin', originalFilename: 'test.docx', checksum: 'b'.repeat(64), chunkCount: 1 };
function content() { return { canonicalQuestion: 'Nội dung thử nghiệm này là gì?', aliases: ['Cho biết nội dung dùng để thử?', 'Đoạn này dùng kiểm tra điều gì?'], neutralAnswer: core,
  characterAnswers: Object.fromEntries(KNOWLEDGE_CHARACTERS.map(k => [k, PERSONA_FRAMES[k][0] + core])), evidence: [{ sourceId, chunkId: chunk._id, quote: core }], warnings: [], insufficientEvidence: false }; }
function proposal() { return { _id: proposalId, sourceIds: [sourceId], sourceChunkIds: [chunk._id], content: content(), generationStatus: 'ready_for_review', version: 1, notes: '', batchId: proposalId }; }
test('grounding computes citation offsets from actual source and preserves four factual cores', () => {
  const parsed = parseProposal(content(), [chunk]); assert.equal(parsed.insufficientEvidence, false);
  assert.equal(parsed.evidence[0].start, 0); assert.equal(parsed.evidence[0].end, core.length);
  assert.equal(Object.keys(parsed.characterAnswers).length, 4);
});
test('forged source, chunk and quotation fail even if caller supplies offsets', () => {
  for (const patch of [{ sourceId: 'forged' }, { chunkId: 'forged' }, { quote: 'Thông tin không tồn tại.', start: 0, end: 10 }]) {
    const c = content(); Object.assign(c.evidence[0], patch); assert.throws(() => parseProposal(c, [chunk]), e => e.code === 'INSUFFICIENT_EVIDENCE');
  }
});
test('unsupported fact and omitted persona core remain insufficient, not approved', () => {
  const c = content(); c.neutralAnswer = 'Một dữ kiện ngoài nguồn.'; assert.equal(parseProposal(c, [chunk]).insufficientEvidence, true);
  for (const persona of KNOWLEDGE_CHARACTERS) { const p = content(); p.characterAnswers[persona] = 'Đã lược thông tin.'; assert.equal(parseProposal(p, [chunk]).insufficientEvidence, true); }
});
test('persona cannot append an unsupported fact while retaining the full core', () => {
  const c = content(); c.characterAnswers['le-duan'] += ' Tôi trực tiếp chỉ huy sự kiện này.';
  assert.equal(parseProposal(c, [chunk]).insufficientEvidence, true);
});
test('invalid shapes, extra approval fields and duplicate aliases are rejected', () => {
  for (const c of [{ ...content(), status: 'approved' }, { ...content(), aliases: ['một'] }, { ...content(), aliases: ['lặp', 'lặp'] }, { ...content(), characterAnswers: {} }]) assert.throws(() => parseProposal(c, [chunk]));
});
test('duplicate canonical, alias, batch and near-duplicate are flags only', () => {
  const c = content();
  assert.equal(detectDuplicates(c, [{ id: 'old', ...c }])[0].kind, 'exact_duplicate');
  assert.equal(detectDuplicates(c, [{ id: 'batch:1', canonicalQuestion: c.aliases[0], aliases: [] }])[0].kind, 'exact_duplicate');
  assert.equal(detectDuplicates(c, [{ id: 'near', canonicalQuestion: 'Nội dung thử nghiệm này có gì?', aliases: [] }])[0].kind, 'possible_duplicate');
  assert.deepEqual(detectDuplicates(c, [{ id: 'other', canonicalQuestion: 'Một câu hoàn toàn khác?', aliases: [] }]), []);
});
function service(options = {}) {
  let generated = 0, written = null, stored = null;
  const p = options.proposal || proposal();
  const repo = {
    generationSource: async () => ({ source: { ...source, ...(options.source || {}) }, chunks: [chunk] }),
    generationCandidates: async () => options.candidates || [],
    generationBudget: async max => ({ remaining: 4, used: 1, limit: max, day: '2026-10-19' }),
    saveManualProposal: async p => { written = p; return { proposalId: p._id }; },
    reserveGeneration: async root => { if (options.quota) throw Error('quota'); if (stored) return { started: false, proposal: stored }; stored = root; return { started: true, proposal: root }; },
    completeGeneration: async (_root, records) => { written = records; },
    readProposal: async () => p,
    convertProposal: async (_id, _version, _target, plan) => { written = plan(p, [{ source: { ...source, ...(options.source || {}) }, chunks: [chunk] }], options.candidates || [], 'cmtt45-q060', 4, { publishedVersionId: 'cmtt45-q060:v3', managementVersion: 2 }, { _id: 'cmtt45-q060:v3', status: options.previousStatus || 'approved' }); return written; },
  };
  const local = loader({
    '@/server/services/knowledge-admin': { requireKnowledgeAdmin: async () => { if (options.denied) throw Error('forbidden'); return { userId: 'real-admin', email: 'admin@example.test' }; } },
    '@/server/services/chat-history-admin': { assertChatGroupId: value => assert.match(value, /^[a-f0-9]{64}$/) },
    '@/server/repositories/chat-history': { readChatGroup: async () => options.missingGroup ? null : { group: { question: 'Câu hỏi lấy từ server' } } },
    '@/server/repositories/knowledge-generation': repo,
    '@/server/infrastructure/knowledge-extraction': {},
    '@/server/infrastructure/gemini-knowledge-generator': {
      GENERATION_PROMPT_VERSION: 'test', knowledgeGenerationConfig: () => ({ enabled: options.enabled !== false, model: 'mock', dailyCalls: 5, maxPerRequest: 2 }),
      generateKnowledge: async (_chunks, _count, question) => { generated++; if (options.failureCode) { const E=local('@/server/domain/knowledge-admin').KnowledgeAdminError; throw new E(options.failureCode, 'Safe provider error', options.httpStatus || 503); } if (options.failure) throw Error('provider secret must not leak'); if (options.assertQuestion) assert.equal(question, 'Câu hỏi lấy từ server'); return options.result || { insufficientEvidence: false, proposals: [content()] }; },
    },
  });
  const s = local('@/server/services/knowledge-generation');
  return { s, generated: () => generated, written: () => written };
}
const request = { requestId: '22222222-2222-4222-8222-222222222222', sourceIds: [sourceId], chunkIds: [chunk._id], count: 1, confirmed: true };
test('document flow validates output, repeated request does not generate twice', async () => {
  const h = service(); await h.s.adminGenerateKnowledge(request); await h.s.adminGenerateKnowledge(request);
  assert.equal(h.generated(), 1); assert.equal(h.written()[0].generationStatus, 'ready_for_review');
  assert.equal(h.written()[0].content.insufficientEvidence, false);
});
test('chat origin loads original question server-side; client cannot inject question or status', async () => {
  const h = service({ assertQuestion: true }); await h.s.adminGenerateKnowledge({ ...request, groupId: 'c'.repeat(64) });
  assert.equal(h.written()[0].originalQuestion, 'Câu hỏi lấy từ server');
  await assert.rejects(() => h.s.adminGenerateKnowledge({ ...request, originalQuestion: 'forged' }));
  const gone = service({ missingGroup: true }); await assert.rejects(() => gone.s.adminGenerateKnowledge({ ...request, groupId: 'c'.repeat(64) })); assert.equal(gone.generated(), 0);
});
test('auth, disabled config, invalid chunks and quota fail before provider call', async () => {
  for (const options of [{ denied: true }, { enabled: false }, { quota: true }]) { const h = service(options); await assert.rejects(() => h.s.adminGenerateKnowledge(request)); assert.equal(h.generated(), 0); }
  const h = service(); await assert.rejects(() => h.s.adminGenerateKnowledge({ ...request, chunkIds: ['forged'] })); assert.equal(h.generated(), 0);
});
test('provider failure is sanitized, recorded and never automatically retried', async () => {
  const h = service({ failure: true }); await h.s.adminGenerateKnowledge(request); await h.s.adminGenerateKnowledge(request);
  assert.equal(h.generated(), 1); assert.equal(h.written()[0].generationStatus, 'failed'); assert.equal(h.written()[0].errorCode, 'GENERATION_FAILED');
  assert.ok(!JSON.stringify(h.written()).includes('secret'));
});
test('insufficient result and invented evidence cannot enter ready state', async () => {
  const h = service({ result: { insufficientEvidence: true, proposals: [] } }); await h.s.adminGenerateKnowledge(request); assert.equal(h.written()[0].generationStatus, 'insufficient_evidence');
  const c = content(); c.evidence[0].quote = 'Invented'; const invalid = service({ result: { insufficientEvidence: false, proposals: [c] } });
  await invalid.s.adminGenerateKnowledge(request); assert.equal(invalid.written()[0].generationStatus, 'insufficient_evidence');
});
const confirm = { version: 1, reviewedEvidence: true, reviewedPersonas: true };
test('draft conversion uses real actor, preserves published pointer and has no reviewer or approval', async () => {
  const h = service(); await h.s.adminConvertProposal(proposalId, confirm);
  const { revision, audit } = h.written();
  assert.equal(revision.status, 'draft'); assert.equal(revision.reviewedBy, undefined); assert.equal(revision.createdBy, 'real-admin');
  assert.equal(audit.before.publishedVersionId, audit.after.publishedVersionId); assert.equal(audit.actorId, 'real-admin');
  assert.equal(revision.source.sourceSha256, source.checksum); assert.equal(revision.source.sectionId, 'section-1');
});
test('unconfirmed source, unreviewed persona and unsupported content block draft conversion', async () => {
  const h = service({ source: { sourceStatus: 'pending' } }); await assert.rejects(() => h.s.adminConvertProposal(proposalId, confirm), e => e.code === 'SOURCE_NOT_CONFIRMED');
  await assert.rejects(() => service().s.adminConvertProposal(proposalId, { ...confirm, reviewedPersonas: false }));
  const p = proposal(); p.content.neutralAnswer = 'Ngoài nguồn'; await assert.rejects(() => service({ proposal: p }).s.adminConvertProposal(proposalId, confirm), e => e.code === 'INSUFFICIENT_EVIDENCE');
});
test('conversion audit reflects the actual preceding revision status and provenance', async () => {
  for (const previousStatus of ['draft', 'pending_review', 'approved', 'rejected']) {
    const h = service({ previousStatus }); await h.s.adminConvertProposal(proposalId, confirm);
    const { revision, audit } = h.written();
    assert.equal(audit.before.status, previousStatus); assert.equal(audit.after.status, 'draft');
    assert.equal(revision.basedOnRevisionId, 'cmtt45-q060:v3');
    assert.equal(audit.before.publishedVersionId, audit.after.publishedVersionId);
  }
});
test('duplicate check repeats at draft conversion; exact requires existing logical revision', async () => {
  const candidate = { id: 'cmtt45-q001', ...content() };
  const h = service({ candidates: [candidate] }); await assert.rejects(() => h.s.adminConvertProposal(proposalId, confirm), e => e.code === 'EXACT_DUPLICATE');
  await assert.rejects(() => h.s.adminConvertProposal(proposalId, { ...confirm, targetId: candidate.id }), e => e.code === 'DUPLICATE_REVIEW_REQUIRED');
  await h.s.adminConvertProposal(proposalId, { ...confirm, targetId: candidate.id, duplicateDecision: 'reviewed' });
  assert.equal(h.written().revision.status, 'draft');
});
test('existing review resolves the confirmed uploaded source by immutable chunk reference', async () => {
  const sourceRepo = loader({ './knowledge-generation': { generationSource: async () => ({ source, chunks: [chunk] }) } })('@/server/repositories/knowledge-source');
  const reference = { blockIds: [chunk._id], sourceSha256: source.checksum, document: source.originalFilename };
  const manifest = await sourceRepo.readKnowledgeManifest(reference);
  assert.equal(manifest.sourceSha256, source.checksum); assert.equal(manifest.blocks[0].id, chunk._id);
  await assert.rejects(() => sourceRepo.readKnowledgeManifest({ ...reference, sourceSha256: 'c'.repeat(64) }), e => e.code === 'SOURCE_UNAVAILABLE');
  const pending = loader({ './knowledge-generation': { generationSource: async () => ({ source: { ...source, sourceStatus: 'pending' }, chunks: [chunk] }) } })('@/server/repositories/knowledge-source');
  await assert.rejects(() => pending.readKnowledgeManifest(reference), e => e.code === 'SOURCE_UNAVAILABLE');
});

const manualRequest = () => ({ requestId: request.requestId, sourceId, chunkId: chunk._id, content: content(), notes: 'Biên tập thủ công' });
test('manual creation works with AI disabled, saves proposal with real actor and no quota/generation', async () => {
  const h = service({ enabled: false }); await h.s.adminCreateManualKnowledge(manualRequest());
  const p = h.written(); assert.equal(p.creationMethod, 'manual'); assert.equal(p.generationModel, 'manual');
  assert.equal(p.generationStatus, 'ready_for_review'); assert.equal(p.createdBy, 'real-admin');
  assert.equal(p.draftId, undefined); assert.equal(p.reviewedBy, undefined); assert.equal(h.generated(), 0);
});
test('manual history resolves server question and rejects client provenance, approval or missing history', async () => {
  const h = service(); await h.s.adminCreateManualKnowledge({ ...manualRequest(), groupId: 'c'.repeat(64) });
  assert.equal(h.written().originalQuestion, 'Câu hỏi lấy từ server');
  for (const extra of [{originalQuestion:'forged'}, {status:'approved'}, {createdBy:'forged'}]) await assert.rejects(() => h.s.adminCreateManualKnowledge({...manualRequest(), ...extra}));
  await assert.rejects(() => service({missingGroup:true}).s.adminCreateManualKnowledge({...manualRequest(),groupId:'c'.repeat(64)}));
});
test('manual authorization, source confirmation, chunk and fields are required', async () => {
  for (const options of [{denied:true},{source:{sourceStatus:'pending'}}]) await assert.rejects(() => service(options).s.adminCreateManualKnowledge(manualRequest()));
  for (const patch of [{chunkId:'forged'}, {notes:'x'.repeat(2001)}, {content:{...content(),characterAnswers:{}}}, {content:{...content(),aliases:['same','same']}}]) await assert.rejects(() => service().s.adminCreateManualKnowledge({...manualRequest(),...patch}));
});
test('manual unsupported facts stay insufficient and duplicates are visible before Draft', async () => {
  const h = service({candidates:[{id:'cmtt45-q001',...content()}]});
  await h.s.adminCreateManualKnowledge(manualRequest()); assert.equal(h.written().duplicates[0].kind,'exact_duplicate');
  const raw=manualRequest();raw.content.neutralAnswer='Ngoài nguồn';await h.s.adminCreateManualKnowledge(raw);assert.equal(h.written().generationStatus,'insufficient_evidence');
});
test('generation requires confirmation, confirmed sources and configured request cap before reservation', async () => {
  for (const patch of [{confirmed:false},{count:3}]) { const h=service();await assert.rejects(()=>h.s.adminGenerateKnowledge({...request,...patch}));assert.equal(h.generated(),0); }
  const h=service({source:{sourceStatus:'pending'}});await assert.rejects(()=>h.s.adminGenerateKnowledge(request),e=>e.code==='SOURCE_NOT_CONFIRMED');assert.equal(h.generated(),0);
});
test('context exposes application quota and model, not credentials', async () => {
  const result=await service().s.adminGenerationContext();assert.equal(result.maxPerRequest,2);assert.equal(result.quota.remaining,4);assert.equal(result.model,'mock');assert.equal(result.apiKey,undefined);
});
test('same factual core flags possible duplicate even for unrelated phrasing', () => {
  assert.equal(detectDuplicates(content(),[{id:'old',canonicalQuestion:'Khái quát?',aliases:[],neutralAnswer:core}])[0].kind,'possible_duplicate');
});
test('generation request config clamps cap without changing model or matcher flag', () => {
  const env={...process.env};
  try { const config=loader()('@/server/infrastructure/gemini-knowledge-generator').knowledgeGenerationConfig;
    for (const [value,expected] of [['1',1],['3',3],['20',5],['-1',1],['bad',1]]) {process.env.KNOWLEDGE_GENERATION_MAX_PER_REQUEST=value;assert.equal(config().maxPerRequest,expected);}
  } finally {process.env=env;}
});
test('quota, 503, 504 and timeout statuses remain inspectable without retry', async () => {
  for(const [failureCode,httpStatus] of [['PROVIDER_QUOTA',429],['GENERATION_FAILED',503],['PROVIDER_TIMEOUT',504],['GENERATION_TIMEOUT',504]]) {
    const h=service({failureCode,httpStatus});const result=await h.s.adminGenerateKnowledge(request);
    assert.equal(result.status,'failed');assert.equal(result.errorCode,failureCode);await h.s.adminGenerateKnowledge(request);assert.equal(h.generated(),1);
  }
});
test('history count range validation rejects ambiguous/invalid filters',()=>{
  const parse=loader({'@/server/services/knowledge-admin':{},'@/server/repositories/chat-history':{},'@/server/repositories/chat-knowledge':{}})('@/server/services/chat-history-admin').parseChatHistoryFilter;
  assert.equal(parse({minCount:2,maxCount:5}).minCount,2);
  for(const input of [{minCount:0},{maxCount:-1},{minCount:'2'},{minCount:5,maxCount:2},{maxCount:1000001},{minCount:1.5}])assert.throws(()=>parse(input));
});
test('real generator boundary maps provider 429/503/504, uses v1beta and one SDK attempt',async()=>{
  const saved={...process.env};
  try {
    process.env.KNOWLEDGE_GENERATION_ENABLED='true';process.env.GEMINI_API_KEY='offline-fixture';
    for(const [status,code] of [[429,'PROVIDER_QUOTA'],[503,'GENERATION_FAILED'],[504,'PROVIDER_TIMEOUT']]) {
      let calls=0;
      class MockClient {
        constructor(options) { assert.equal(options.apiVersion,'v1beta');assert.equal(options.httpOptions.retryOptions.attempts,1);assert.equal(options.httpOptions.timeout,30000); }
        models={generateContent:async request=>{calls++;assert.equal(request.config.responseMimeType,'application/json');assert.ok(request.config.responseJsonSchema);throw Object.assign(Error('provider secret must never propagate'),{status});}};
      }
      const g=loader({'@google/genai':{GoogleGenAI:MockClient}})('@/server/infrastructure/gemini-knowledge-generator');
      await assert.rejects(()=>g.generateKnowledge([chunk],1),e=>e.code===code&&!e.message.includes('secret'));assert.equal(calls,1);
    }
  } finally {process.env=saved;}
});
