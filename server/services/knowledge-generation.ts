import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { KNOWLEDGE_TOPIC, normalizeKnowledgePhrase, type KnowledgeDraft } from '@/server/domain/knowledge';
import { assertKnowledgeId, KnowledgeAdminError } from '@/server/domain/knowledge-admin';
import { sourceManifest, type KnowledgeProposal, type SourceRecord } from '@/server/domain/knowledge-generation';
import { requireKnowledgeAdmin } from '@/server/services/knowledge-admin';
import { assertChatGroupId } from '@/server/services/chat-history-admin';
import { readChatGroup } from '@/server/repositories/chat-history';
import * as repository from '@/server/repositories/knowledge-generation';
import { extractKnowledgeFile } from '@/server/infrastructure/knowledge-extraction';
import { generateKnowledge, GENERATION_PROMPT_VERSION, knowledgeGenerationConfig } from '@/server/infrastructure/gemini-knowledge-generator';
import { boundedText, detectDuplicates, generationError, inputObject, parseProposal } from './knowledge-generation-validation';
import { validateKnowledge } from './knowledge-validation';

const id = (value: unknown) => { if (typeof value !== 'string' || !/^[a-f0-9-]{36,64}$/.test(value)) throw generationError('Mã dữ liệu không hợp lệ.'); return value; };
const pageNumber = (value: number) => { if (!Number.isSafeInteger(value) || value < 1 || value > 500) throw generationError('Trang không hợp lệ.'); return value; };
export async function adminGenerationList(kind: 'sources' | 'proposals', page = 1) {
  await requireKnowledgeAdmin(); pageNumber(page);
  return { items: kind === 'sources' ? await repository.generationSources(page) : await repository.listProposals(page), page };
}
export async function adminUploadKnowledge(buffer: Buffer, mime: string, filename: string) {
  const actor = await requireKnowledgeAdmin();
  filename = boundedText(filename, 180).replace(/[\\/\x00-\x1f]/g, '_');
  const extracted = await extractKnowledgeFile(buffer, mime, filename);
  if (extracted.chunks.length > 2000) throw generationError('Tài liệu có quá nhiều đoạn. Hãy chia nhỏ tài liệu.');
  const source: SourceRecord = { _id: extracted.sourceId, title: filename, originalFilename: filename,
    fileType: extracted.type, checksum: extracted.checksum, uploadedBy: actor.userId, uploadedAt: new Date(),
    extractionStatus: 'ready', chunkCount: extracted.chunks.length, sourceStatus: 'pending', storageRef: '', errors: [], size: buffer.length };
  await repository.saveKnowledgeSource(source, extracted.chunks, buffer);
  return { sourceId: source._id };
}
export async function adminGenerationSource(sourceId: string) {
  await requireKnowledgeAdmin(); const { source, chunks } = await repository.generationSource(id(sourceId));
  return { source: { ...source, storageRef: undefined }, chunks };
}
export async function adminConfirmSource(sourceId: string, input: unknown) {
  const actor = await requireKnowledgeAdmin(), row = inputObject(input);
  if (row.confirmed !== true) throw generationError('Cần xác nhận đã đọc và chấp nhận tài liệu nguồn.');
  await repository.generationSource(id(sourceId));
  await repository.confirmKnowledgeSource(sourceId, actor.userId); return { ok: true };
}
export async function adminGenerationContext(groupId?: string) {
  await requireKnowledgeAdmin();
  const config = knowledgeGenerationConfig();
  const controls = { enabled: config.enabled, model: config.model, maxPerRequest: config.maxPerRequest,
    quota: await repository.generationBudget(config.dailyCalls) };
  if (!groupId) return { originalQuestion: null, relatedChatGroups: [], ...controls };
  assertChatGroupId(groupId);
  const detail = await readChatGroup(groupId, 1, 1);
  if (!detail) throw generationError('Câu hỏi đã hết thời gian lưu hoặc không còn tồn tại.', 'NOT_FOUND', 404);
  const relatedChatGroups: { groupId: string; question: string }[] = [];
  const equivalentId = detail.group.review?.equivalentGroupId;
  if (equivalentId && equivalentId !== groupId) {
    const equivalent = await readChatGroup(equivalentId, 1, 1);
    if (equivalent) relatedChatGroups.push({ groupId: equivalentId, question: equivalent.group.question });
  }
  return { originalQuestion: detail.group.question, relatedChatGroups, ...controls };
}
export async function adminCreateManualKnowledge(input: unknown) {
  const actor = await requireKnowledgeAdmin(), row = inputObject(input);
  if (Object.keys(row).some(k => !['requestId','sourceId','chunkId','groupId','content','notes'].includes(k))) throw generationError('Yêu cầu có trường không được hỗ trợ.');
  const requestId = id(row.requestId), pack = await repository.generationSource(id(row.sourceId));
  if (pack.source.sourceStatus !== 'confirmed' || !pack.source.confirmedBy) throw generationError('Hãy xác nhận tài liệu trước khi tạo đề xuất.', 'SOURCE_NOT_CONFIRMED');
  const chunk = pack.chunks.find(c => c._id === row.chunkId);
  if (!chunk) throw generationError('Đoạn nguồn không tồn tại.', 'INSUFFICIENT_EVIDENCE');
  const groupId = row.groupId === undefined ? undefined : String(row.groupId), context = await adminGenerationContext(groupId);
  const content = parseProposal(row.content, [chunk]);
  const notes = row.notes === '' || row.notes === undefined ? '' : boundedText(row.notes, 2000);
  const now = new Date(), proposalId = createHash('sha256').update(`manual:${actor.userId}:${requestId}`).digest('hex');
  const proposal: KnowledgeProposal = { _id: proposalId, batchId: proposalId, creationMethod: 'manual', origin: groupId ? 'chat_question' : 'document',
    sourceIds: [pack.source._id], sourceChunkIds: [chunk._id], ...(groupId ? { originalChatGroupId: groupId, originalQuestion: context.originalQuestion!, relatedChatGroups: context.relatedChatGroups } : {}),
    content, notes, duplicates: detectDuplicates(content, (await repository.generationCandidates()).filter(c => c.id !== `proposal:${proposalId}`)),
    generationModel: 'manual', promptVersion: 'manual-5e2', generationStatus: content.insufficientEvidence ? 'insufficient_evidence' : 'ready_for_review',
    createdBy: actor.userId, createdAt: now, updatedAt: now, version: 1,
    requestFingerprint: createHash('sha256').update(JSON.stringify({ content, notes, sourceId: pack.source._id, chunkId: chunk._id, groupId })).digest('hex') };
  return repository.saveManualProposal(proposal);
}
export async function adminGenerateKnowledge(input: unknown) {
  const actor = await requireKnowledgeAdmin(), row = inputObject(input), config = knowledgeGenerationConfig();
  if (Object.keys(row).some(k => !['requestId','sourceIds','chunkIds','count','groupId','confirmed'].includes(k))) throw generationError('Yêu cầu có trường không được hỗ trợ.');
  if (row.confirmed !== true) throw generationError('Cần xác nhận số câu và hạn mức trước khi gọi Gemini.', 'CONFIRMATION_REQUIRED');
  const requestId = id(row.requestId);
  if (!Array.isArray(row.sourceIds) || !row.sourceIds.length || row.sourceIds.length > 3 || !Array.isArray(row.chunkIds) || !row.chunkIds.length || row.chunkIds.length > 12) throw generationError('Chọn 1–3 nguồn và tối đa 12 đoạn trích.');
  if (!Number.isInteger(row.count) || Number(row.count) < 1 || Number(row.count) > config.maxPerRequest) throw generationError(`Mỗi lượt tạo tối đa ${config.maxPerRequest} câu.`);
  const sourceIds = [...new Set(row.sourceIds.map(id))], packs = await Promise.all(sourceIds.map(s => repository.generationSource(s)));
  if (packs.some(p => p.source.sourceStatus !== 'confirmed' || !p.source.confirmedBy)) throw generationError('Hãy xác nhận tài liệu trước khi gọi Gemini.', 'SOURCE_NOT_CONFIRMED');
  const chunks = packs.flatMap(p => p.chunks).filter(c => (row.chunkIds as unknown[]).includes(c._id));
  if (chunks.length !== new Set(row.chunkIds).size || chunks.reduce((n,c) => n + c.text.length, 0) > 24000) throw generationError('Đoạn trích không hợp lệ hoặc vượt 24.000 ký tự.');
  const groupId = row.groupId === undefined ? undefined : String(row.groupId);
  const context = await adminGenerationContext(groupId);
  if (!config.enabled) throw generationError('Chưa bật tạo kiến thức bằng AI. Admin có thể chuẩn bị nguồn trước.', 'GENERATION_DISABLED', 503);
  const now = new Date(), proposalId = createHash('sha256').update(`${actor.userId}:${requestId}`).digest('hex');
  const root: KnowledgeProposal = { _id: proposalId, batchId: proposalId, creationMethod: 'gemini', origin: groupId ? 'chat_question' : 'document', sourceIds,
    requestFingerprint: createHash('sha256').update(JSON.stringify({ sourceIds: [...sourceIds].sort(), chunkIds: chunks.map(c => c._id).sort(), count: row.count, groupId })).digest('hex'),
    sourceChunkIds: chunks.map(c => c._id), ...(groupId ? { originalChatGroupId: groupId, originalQuestion: context.originalQuestion!, relatedChatGroups: context.relatedChatGroups } : {}),
    duplicates: [], generationModel: config.model, promptVersion: GENERATION_PROMPT_VERSION, generationStatus: 'generating', createdBy: actor.userId,
    createdAt: now, updatedAt: now, version: 0, notes: '' };
  const reserved = await repository.reserveGeneration(root, config.dailyCalls);
  if (!reserved?.started) return { batchId: proposalId, reused: true, status: reserved?.proposal.generationStatus, errorCode: reserved?.proposal.errorCode };
  let proposals: KnowledgeProposal[];
  try {
    const result = inputObject(await generateKnowledge(chunks, Number(row.count), context.originalQuestion || undefined));
    if (typeof result.insufficientEvidence !== 'boolean' || !Array.isArray(result.proposals) || result.proposals.length > Number(row.count)) throw generationError('Định dạng AI không hợp lệ.');
    if (result.insufficientEvidence || !result.proposals.length) proposals = [{ ...root, generationStatus: 'insufficient_evidence', updatedAt: new Date(), version: 1, errorCode: 'INSUFFICIENT_EVIDENCE' }];
    else {
      const candidates = await repository.generationCandidates();
      proposals = result.proposals.map((raw, index) => {
        const content = parseProposal(raw, chunks), _id = index === 0 ? proposalId : randomUUID();
        const duplicates = detectDuplicates(content, candidates);
        candidates.push({ id: `proposal:${_id}`, canonicalQuestion: content.canonicalQuestion, aliases: content.aliases, neutralAnswer: content.neutralAnswer });
        return { ...root, _id, content, duplicates, generationStatus: content.insufficientEvidence ? 'insufficient_evidence' : 'ready_for_review', updatedAt: new Date(), version: 1 };
      });
    }
  } catch (error) {
    proposals = [{ ...root, generationStatus: error instanceof KnowledgeAdminError && error.code === 'INSUFFICIENT_EVIDENCE' ? 'insufficient_evidence' : 'failed',
      errorCode: error instanceof KnowledgeAdminError ? error.code : 'GENERATION_FAILED', updatedAt: new Date(), version: 1 }];
  }
  // Persistence errors are not confused with provider failures and never trigger another generation.
  await repository.completeGeneration(root, proposals);
  return { batchId: proposalId, count: proposals.length, status: proposals[0].generationStatus, errorCode: proposals[0].errorCode };
}
export async function adminProposalDetail(proposalId: string) {
  await requireKnowledgeAdmin();
  const proposal = await repository.readProposal(id(proposalId));
  const packs = await Promise.all(proposal.sourceIds.map(s => repository.generationSource(s)));
  return { proposal, sources: packs.map(p => ({ source: { ...p.source, storageRef: undefined }, chunks: p.chunks.filter(c => proposal.sourceChunkIds.includes(c._id)) })),
    duplicates: proposal.content ? detectDuplicates(proposal.content, (await repository.generationCandidates()).filter(c => c.id !== `proposal:${proposal._id}`)) : [] };
}
export async function adminEditProposal(proposalId: string, input: unknown) {
  const actor = await requireKnowledgeAdmin(), row = inputObject(input);
  const p = await repository.readProposal(id(proposalId));
  if (!Number.isInteger(row.version) || Number(row.version) < 0) throw generationError('Thiếu phiên bản đề xuất.');
  if (row.action === 'discard') { await repository.editProposal(p._id, Number(row.version), { generationStatus: 'discarded' }, actor.userId); return { ok: true }; }
  if (row.action !== 'edit') throw generationError('Thao tác không hợp lệ.');
  const chunks = (await Promise.all(p.sourceIds.map(s => repository.generationSource(s)))).flatMap(s => s.chunks).filter(c => p.sourceChunkIds.includes(c._id));
  const content = parseProposal(row.content, chunks), notes = typeof row.notes === 'string' && row.notes.length <= 2000 ? row.notes : '';
  const duplicates = detectDuplicates(content, (await repository.generationCandidates()).filter(c => c.id !== `proposal:${p._id}`));
  await repository.editProposal(p._id, Number(row.version), { content, notes, duplicates, generationStatus: content.insufficientEvidence ? 'insufficient_evidence' : 'ready_for_review' }, actor.userId);
  return { ok: true };
}
export async function adminConvertProposal(proposalId: string, input: unknown) {
  const actor = await requireKnowledgeAdmin(), row = inputObject(input);
  if (!Number.isInteger(row.version) || Number(row.version) < 0 || row.reviewedEvidence !== true || row.reviewedPersonas !== true) throw generationError('Cần đối chiếu nguồn và cả bốn lời đáp trước khi lưu bản nháp.');
  const targetId = row.targetId ? String(row.targetId) : undefined;
  if (targetId) assertKnowledgeId(targetId);
  return repository.convertProposal(id(proposalId), Number(row.version), targetId, (p, packs, candidates, questionId, version, previous, previousRevision) => {
    if (packs.some(s => s.source.sourceStatus !== 'confirmed' || !s.source.confirmedBy)) throw generationError('Admin cần xác nhận tài liệu hợp lệ trước khi lưu Draft.', 'SOURCE_NOT_CONFIRMED');
    const chunks = packs.flatMap(s => s.chunks).filter(c => p.sourceChunkIds.includes(c._id)), content = parseProposal(p.content, chunks);
    if (content.insufficientEvidence) throw generationError('Chưa đủ bằng chứng để tạo Draft.', 'INSUFFICIENT_EVIDENCE');
    const duplicates = detectDuplicates(content, candidates.filter(c => c.id !== `proposal:${p._id}`));
    if (duplicates.some(d => d.kind === 'exact_duplicate' && d.id !== targetId)) throw generationError('Đã có câu hỏi hoặc proposal trùng chính xác. Dùng revision của câu hiện hữu hoặc loại bỏ proposal trùng.', 'EXACT_DUPLICATE', 409);
    if (duplicates.length && row.duplicateDecision !== 'reviewed') throw generationError('Cần quyết định xử lý các câu có thể trùng.', 'DUPLICATE_REVIEW_REQUIRED');
    const evidence = content.evidence[0], pack = packs.find(s => s.source._id === evidence.sourceId)!, chunk = chunks.find(c => c._id === evidence.chunkId)!;
    const manifest = sourceManifest(pack.source, pack.chunks), sectionId = manifest.blocks.find(b => b.id === chunk._id)!.sectionId;
    const now = new Date(), draft: KnowledgeDraft = { _id: questionId, topicId: KNOWLEDGE_TOPIC, sectionId,
      canonicalQuestion: content.canonicalQuestion, aliases: content.aliases, normalizedPhrases: [content.canonicalQuestion, ...content.aliases].map(normalizeKnowledgePhrase),
      approvedAnswer: content.neutralAnswer, characterAnswers: content.characterAnswers,
      source: { document: pack.source.originalFilename, sourceSha256: pack.source.checksum, sectionId, blockIds: [chunk._id], excerpt: evidence.quote, paragraphIndex: chunk.paragraphIndex },
      status: 'draft', version, createdAt: now.toISOString(), updatedAt: now.toISOString(), reviewNotes: [...content.warnings, ...(p.notes ? [p.notes] : [])] };
    const validation = validateKnowledge([draft], manifest);
    if (validation.errors.length) throw generationError(validation.errors.map(e => e.message).join(' '));
    const revision = { _id: `${questionId}:v${version}`, questionId, version, canonicalQuestion: draft.canonicalQuestion, aliases: draft.aliases,
      normalizedPhrases: draft.normalizedPhrases, approvedAnswer: draft.approvedAnswer, characterAnswers: draft.characterAnswers,
      source: draft.source, status: 'draft' as const, reviewNotes: draft.reviewNotes, createdAt: now, updatedAt: now, importBatchId: p.batchId, createdBy: actor.userId,
      ...(previousRevision ? { basedOnRevisionId: previousRevision._id } : {}) };
    return { revision, audit: { _id: randomUUID(), questionId, revisionId: revision._id, action: 'create_revision', actorId: actor.userId, actorEmail: actor.email,
      reason: `Tạo Draft từ proposal ${p._id}; đã đối chiếu evidence/persona${duplicates.length ? '; đã rà soát trùng lặp' : ''}.`, createdAt: now,
      before: { status: previousRevision?.status || 'draft', publishedVersionId: previous?.publishedVersionId || null, managementVersion: previous?.managementVersion || 0 },
      after: { status: 'draft', publishedVersionId: previous?.publishedVersionId || null, managementVersion: (previous?.managementVersion || 0) + 1 }, changedFields: ['canonicalQuestion','aliases','approvedAnswer','characterAnswers','source'] } };
  });
}
