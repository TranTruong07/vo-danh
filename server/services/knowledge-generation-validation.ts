import { KNOWLEDGE_CHARACTERS, normalizeKnowledgePhrase, normalizeKnowledgeSource } from '@/server/domain/knowledge';
import { KnowledgeAdminError } from '@/server/domain/knowledge-admin';
import type { Duplicate, ProposalContent, SourceChunk } from '@/server/domain/knowledge-generation';
import { PERSONA_FRAMES } from '@/server/domain/knowledge-generation';

export const generationError = (message: string, code = 'INVALID_GENERATION', status = 400) => new KnowledgeAdminError(code, message, status);
export function inputObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw generationError('Dữ liệu không hợp lệ.');
  return input as Record<string, unknown>;
}
export function boundedText(input: unknown, max: number): string {
  if (typeof input !== 'string' || !input.trim() || input.length > max) throw generationError('Nội dung trống hoặc vượt giới hạn.');
  return input.trim().normalize('NFC');
}
export function parseProposal(input: unknown, chunks: SourceChunk[]): ProposalContent {
  const row = inputObject(input);
  if (Object.keys(row).some(k => !['canonicalQuestion','aliases','neutralAnswer','characterAnswers','evidence','warnings','insufficientEvidence'].includes(k))) throw generationError('Đề xuất chứa trường không được hỗ trợ.');
  if (typeof row.insufficientEvidence !== 'boolean' || !Array.isArray(row.warnings) || row.warnings.length > 40) throw generationError('Thiếu trạng thái bằng chứng.');
  if (!Array.isArray(row.aliases) || row.aliases.length < 2 || row.aliases.length > 5) throw generationError('Cần từ 2 đến 5 cách hỏi.');
  const characters = inputObject(row.characterAnswers);
  if (Object.keys(characters).length !== 4 || !KNOWLEDGE_CHARACTERS.every(k => k in characters)) throw generationError('Cần đủ bốn lời đáp nhân vật.');
  if (!Array.isArray(row.evidence) || row.evidence.length < 1 || row.evidence.length > 6) throw generationError('Cần trích dẫn từ nguồn đã chọn.', 'INSUFFICIENT_EVIDENCE');
  const evidence = row.evidence.map(raw => {
    const e = inputObject(raw), chunk = chunks.find(c => c._id === e.chunkId && c.sourceId === e.sourceId);
    if (!chunk || typeof e.quote !== 'string' || !e.quote.trim() || e.quote.length > 6000) throw generationError('Nguồn hoặc đoạn trích không tồn tại.', 'INSUFFICIENT_EVIDENCE');
    // Offsets are computed by the server, never accepted as proof from the model.
    const start = chunk.text.indexOf(e.quote);
    if (start < 0) throw generationError('Trích dẫn không xuất hiện nguyên văn trong nguồn.', 'INSUFFICIENT_EVIDENCE');
    return { sourceId: chunk.sourceId, chunkId: chunk._id, quote: e.quote, start, end: start + e.quote.length };
  });
  // Existing revision schema supports one source. Multiple sources may be used per generation batch,
  // but a single answer must have a coherent contiguous quotation from one chunk.
  if (new Set(evidence.map(e => e.chunkId)).size !== 1) throw generationError('Mỗi đề xuất cần một đoạn nguồn liên tục; tách câu hỏi nếu cần nhiều đoạn.', 'INSUFFICIENT_EVIDENCE');
  const canonicalQuestion = boundedText(row.canonicalQuestion, 500), aliases = row.aliases.map(a => boundedText(a, 500));
  if (new Set([canonicalQuestion, ...aliases].map(normalizeKnowledgePhrase)).size !== aliases.length + 1) throw generationError('Các cách hỏi bị trùng.');
  const neutralAnswer = boundedText(row.neutralAnswer, 12000);
  const characterAnswers = Object.fromEntries(KNOWLEDGE_CHARACTERS.map(k => [k, boundedText(characters[k], 12000)])) as ProposalContent['characterAnswers'];
  const warnings = row.warnings.map(w => boundedText(w, 1000));
  // Conservative extractive gate: citation validity alone cannot prove semantic entailment.
  // Require the full factual core verbatim in evidence and in every persona; any paraphrase needs
  // editor correction before draft conversion. Style may frame this core but is always human-reviewed.
  const core = normalizeKnowledgeSource(neutralAnswer);
  const supported = evidence.some(e => normalizeKnowledgeSource(e.quote).includes(core));
  const preserved = KNOWLEDGE_CHARACTERS.every(k => normalizeKnowledgeSource(characterAnswers[k]).includes(core));
  const framed = KNOWLEDGE_CHARACTERS.every(k => [neutralAnswer, ...PERSONA_FRAMES[k].map(prefix => prefix + neutralAnswer)]
    .some(allowed => normalizeKnowledgeSource(allowed) === normalizeKnowledgeSource(characterAnswers[k])));
  if (!supported) warnings.push('Đáp án trung tính phải là trích đoạn liên tục trong evidence; cần biên tập và đối chiếu nguồn.');
  if (!preserved) warnings.push('Bốn lời đáp phải giữ nguyên đầy đủ phần thông tin trung tính.');
  if (!framed) warnings.push('Lời đáp chỉ được thêm lời dẫn sư phạm được hỗ trợ vào nguyên văn đáp án trung tính; phần ngoài khung cần biên tập lại để không thêm dữ kiện.');
  if (Object.values(characterAnswers).some(s => /(?:tôi|ta|bác)\s+(?:đã|trực tiếp)\s+(?:chỉ huy|tham gia|ra lệnh|chứng kiến)/iu.test(s))) warnings.push('Cần kiểm tra phát ngôn ngôi thứ nhất về việc tham gia sự kiện.');
  warnings.push('Lời thoại mô phỏng giáo dục. Admin cần kiểm tra toàn bộ ý nghĩa, vai trò, địa danh, mốc thời gian và phần diễn đạt ngoài trích đoạn.');
  return { canonicalQuestion, aliases, neutralAnswer, characterAnswers, evidence, warnings: [...new Set(warnings)].slice(-40), insufficientEvidence: row.insufficientEvidence || !supported || !preserved || !framed };
}
export interface DuplicateCandidate { id: string; revisionId?: string; canonicalQuestion: string; aliases: string[]; neutralAnswer?: string }
export function detectDuplicates(content: Pick<ProposalContent, 'canonicalQuestion' | 'aliases'> & { neutralAnswer?: string }, candidates: DuplicateCandidate[]): Duplicate[] {
  const phrases = [content.canonicalQuestion, ...content.aliases].map(normalizeKnowledgePhrase);
  const words = (s: string) => new Set(s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  return candidates.flatMap(c => {
    const targets = [c.canonicalQuestion, ...c.aliases].map(normalizeKnowledgePhrase);
    const exact = phrases.some(p => targets.includes(p));
    // Broad editorial flag only; never used to answer, approve or merge automatically.
    const sameCore = !!content.neutralAnswer && !!c.neutralAnswer && normalizeKnowledgeSource(content.neutralAnswer) === normalizeKnowledgeSource(c.neutralAnswer);
    const possible = exact || sameCore || phrases.some(p => targets.some(t => { const a = words(p), b = words(t); const common = [...a].filter(w => b.has(w)).length; return common >= 4 && common / new Set([...a, ...b]).size >= 0.55; }));
    return possible ? [{ kind: exact ? 'exact_duplicate' as const : 'possible_duplicate' as const, id: c.id, question: c.canonicalQuestion, revisionId: c.revisionId }] : [];
  });
}
