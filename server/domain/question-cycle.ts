// A shuffle bag: draw only unseen IDs, then start another cycle without an immediate repeat.
export function questionCandidates(ids: string[], seenIds: string[], lastId?: string) {
  const seen = new Set(seenIds);
  const available = new Set(ids);
  const unseen = ids.filter(id => !seen.has(id));
  return { candidates: unseen.length ? unseen : ids.filter(id => ids.length === 1 || id !== lastId), seenIds: unseen.length ? seenIds.filter(id => available.has(id)) : [] };
}
