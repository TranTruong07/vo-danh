export const questionId = 'cmtt45-q901';
export const testActor = { userId: 'a'.repeat(24), email: 'reviewer@example.test', role: 'admin' };
export const manifest = { schemaVersion: 1, document: 'synthetic-fixture.docx', sourceSha256: 'f'.repeat(64), blocks: [
  { id: 'body/1', order: 1, sectionId: 'I', paragraphIndex: 0, text: 'Nội dung thử nghiệm tổng hợp, không phải dữ liệu lịch sử.', normalizedText: 'Nội dung thử nghiệm tổng hợp, không phải dữ liệu lịch sử.', kind: 'paragraph', isHeading: false },
], sections: [{ sectionId: 'I', title: 'Fixture' }], counts: { paragraphs: 1, tables: 0, blocks: 1 }, warnings: [], locatorConvention: 'fixture' };
export function fixtureState() {
  const now = new Date('2026-10-14T00:00:00Z');
  return { question: { _id: questionId, topicId: 'cach-mang-thang-tam-1945', createdAt: now, updatedAt: now }, revisions: [{
    _id: `${questionId}:v3`, questionId, version: 3, canonicalQuestion: 'Câu hỏi thử nghiệm?', aliases: ['Cách hỏi thử nghiệm một?', 'Cách hỏi thử nghiệm hai?'],
    normalizedPhrases: ['câu hỏi thử nghiệm', 'cách hỏi thử nghiệm một', 'cách hỏi thử nghiệm hai'],
    approvedAnswer: 'Đáp án trung tính thử nghiệm.', characterAnswers: { 'truong-chinh': 'Lời đáp fixture một.', 'le-duan': 'Lời đáp fixture hai.', 'pham-van-dong': 'Lời đáp fixture ba.', 'vo-nguyen-giap': 'Lời đáp fixture bốn.' },
    source: { document: manifest.document, sectionId: 'I', excerpt: manifest.blocks[0].text, sourceSha256: manifest.sourceSha256, blockIds: ['body/1'], paragraphIndex: 0 },
    status: 'draft', createdAt: now, updatedAt: now, reviewNotes: [], importBatchId: 'synthetic-only',
  }] };
}
export function command(action, extra = {}) { return { action, revisionId: `${questionId}:v3`, expectedVersion: 0, reason: 'Kiểm thử tự động trên fixture, không dùng lịch sử.', ...(action === 'approve' ? { acknowledged: true } : {}), ...extra }; }
export function applyPlan(state, plan) {
  state.question.managementVersion = (state.question.managementVersion || 0) + 1;
  if (plan.insert) state.revisions.unshift(plan.insert);
  if (plan.review) { const metadata = { ...plan.review }; delete metadata.revisionId; delete metadata.previousStatus; Object.assign(state.revisions.find(r => r._id === plan.review.revisionId), metadata); }
  if (plan.publication === null) delete state.question.publishedVersionId;
  else if (plan.publication !== undefined) state.question.publishedVersionId = plan.publication;
}
