// Per-test store only. Never connects to Mongo or changes runtime code.
export function historyMemory() {
  const rows = new Map();
  return { rows,
    readInteraction: async (id, sessionRef) => { const r = rows.get(id); return r?.sessionRef === sessionRef && r.expiresAt > new Date() ? r : null; },
    recordInteraction: async row => { if (!rows.has(row._id)) rows.set(row._id, structuredClone(row)); },
    latestOfferedInteraction: async (sessionRef, questionId) => [...rows.values()].reverse().find(r => r.sessionRef === sessionRef && r.expiresAt > new Date() && r.suggestedQuestionIds.includes(questionId)) || null,
    recordSelection: async (id, sessionRef, questionId, revisionId, latencyMs) => {
      const r = rows.get(id);
      if (!r) return 'missing';
      if (r.sessionRef !== sessionRef || !r.suggestedQuestionIds.includes(questionId) || (r.selectedQuestionId && r.selectedQuestionId !== questionId)) return 'conflict';
      if (!r.selectedQuestionId) Object.assign(r, { selectedQuestionId: questionId, answeredQuestionId: questionId, publishedVersionId: revisionId, selectedAt: new Date(), selectionLatencyMs: latencyMs, outcome: 'answered' });
      return 'saved';
    },
  };
}
