import type { ChatIndexEntry } from '@/server/domain/chat';

// Lexical equivalences only. These do not map facts, dates to cities, or question IDs.
export const VI_RANKING_VERSION = '5c3b-1';
export const FALLBACK_MIN_SCORE = 0.78;
const fold = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
const replacements: [RegExp, string][] = [
  [/\b(?:cmtt|cmt8)\b/g, 'cach mang thang tam'],
  [/\b(?:thang 8|thang tam)\b/g, 'thangtam'],
  [/\b(?:thang loi|thanh cong)\b/g, 'thangloi'],
  [/\b(?:khoi nghia|khoi ngia|noi day)\b/g, 'khoinghia'],
  [/\btha(?:ng|g) loi\b/g, 'thangloi'],
  [/\b(?:thanh lap|ra doi)\b/g, 'thanhlap'],
  [/\b(?:thoi gian|thoi diem|bao gio)\b/g, ''],
  [/\b(?:dau hang|chiu thua)\b/g, 'dauhang'],
  [/\b(?:ban bo|cong bo|ban hanh)\b/g, 'banbo'],
  [/\b(?:dao chinh|lat do)\b/g, 'daochinh'],
  [/\bquan lenh so (?:1|mot)\b/g, 'quanlenh1'],
  [/\b(?:nguyen nhan|yeu to)\b/g, 'nguyennhan'],
  [/\bchu quan\b/g, 'chuquan'], [/\bkhach quan\b/g, 'khachquan'],
  [/\bquoc te\b/g, 'quocte'], [/\btrong nuoc\b/g, 'trongnuoc'],
  [/\b(?:nhu the nao|ra sao|the nao)\b/g, ''],
];
const stop = new Set('la va cua thi ma co cho ve voi mot nhung cac duoc nao gi khi sao the toi minh ban bac oi hay xin hoi biet ke noi do ra a vay chau dong chi giup giai thich muon luc hom ngay may nam tai o da ay cuoc lieu tai lieu theo nhu nhan dan nguoi dan vao den nam thangtam cach mang 1945'.split(' '));
const anchors = ['ha noi', 'hue', 'sai gon', 'tan trao', 'ba dinh', 'cao bang', 'viet bac', 'dong duong',
  'truong chinh', 'le duan', 'pham van dong', 'vo nguyen giap'];
function raw(text: string) { return fold(text).replace(/[–—]/g, '-').replace(/\b(?:ngay\s+)?(\d{1,2})\s+thang\s+(\d{1,2})(?:\s+nam\s+(\d{4}))?/g, (_, d, m, y) => `${Number(d)}/${Number(m)}${y ? `/${y}` : ''}`); }
function normalized(text: string) {
  let value = raw(text);
  for (const [pattern, replacement] of replacements) value = value.replace(pattern, replacement);
  return value.replace(/[^a-z0-9]+/g, ' ').trim();
}
const words = (text: string) => [...new Set(normalized(text).split(/\s+/).filter(w => w && !stop.has(w)))];
function oneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 4 || /\d/.test(a + b) || Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, changes = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++changes > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return changes + Number(i < a.length || j < b.length) <= 1;
}
const present = (text: string, phrase: string) => ` ${text.replace(/[^a-z0-9]+/g, ' ')} `.includes(` ${phrase} `);
const dates = (text: string) => [...text.matchAll(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?\b/g)].map(m => `${Number(m[1])}/${Number(m[2])}`);
const years = (text: string): string[] => text.match(/\b(?:18|19|20)\d{2}\b/g) || [];
const negated = (text: string) => /\b(khong|chua|chang)\b/.test(text);

export function clearlyOutsideKnowledge(message: string): boolean {
  return /\b(thoi tiet|troi|mua khong|nang khong|bitcoin|pizza|nau an|nau pho|javascript|viet code|mat khau|bo qua.{0,20}(quy tac|huong dan)|dien bien phu)\b/.test(raw(message));
}
// Candidate metadata only; no hard-coded historical associations. Missing evidence fails closed.
export function compatibleVietnameseCandidate(message: string, entry: ChatIndexEntry): boolean {
  if (clearlyOutsideKnowledge(message)) return false;
  const query = raw(message), candidate = raw([entry.canonicalQuestion, ...entry.aliases].join(' '));
  if (anchors.some(anchor => present(query, anchor) && !present(candidate, anchor))) return false;
  if (dates(query).some(date => !dates(candidate).includes(date))) return false;
  if (years(query).some(year => !years(candidate).includes(year))) return false;
  if (negated(query) && !negated(candidate)) return false;
  const q = normalized(query), c = normalized(candidate);
  for (const group of [['chuquan', 'khachquan'], ['quocte', 'trongnuoc']]) {
    for (const term of group) if (present(q, term) && !present(c, term)) return false;
    if (group.some(term => present(q, term)) && group.some(term => !present(q, term) && present(c, term))) return false;
  }
  if (present(q, 'quanlenh1')) {
    for (const action of ['banbo', 'doc']) if (present(q, action) && !present(c, action)) return false;
  }
  return true;
}

export interface RankedChatCandidate { entry: ChatIndexEntry; score: number; coverage: number; common: number }
export function rankVietnameseCandidates(message: string, entries: ChatIndexEntry[]): RankedChatCandidate[] {
  const query = words(message);
  if (query.length < 2 || clearlyOutsideKnowledge(message)) return [];
  const docs = entries.map(entry => ({ entry, phrases: [entry.canonicalQuestion, ...entry.aliases]
    .filter(phrase => !/\btruoc ngay\b/.test(raw(phrase)) || /\btruoc\b/.test(raw(message))).map(words) }));
  const frequency = new Map<string, number>();
  for (const doc of docs) for (const word of new Set(doc.phrases.flat())) frequency.set(word, (frequency.get(word) || 0) + 1);
  const weight = (word: string) => Math.log(1 + entries.length / (frequency.get(word) || 1));
  const queryWeight = query.reduce((sum, word) => sum + weight(word), 0);
  return docs.filter(doc => compatibleVietnameseCandidate(message, doc.entry)).map(({ entry, phrases }) => {
    let best = { entry, score: 0, coverage: 0, common: 0 };
    for (const phrase of phrases) {
      const common = query.filter(word => phrase.some(other => oneEdit(word, other)));
      const coverage = common.reduce((sum, word) => sum + weight(word), 0) / queryWeight;
      const precision = common.length / Math.max(phrase.length, query.length);
      const score = coverage * 0.85 + precision * 0.15;
      if (score > best.score) best = { entry, score, coverage, common: common.length };
    }
    return best;
  }).filter(row => row.common >= 2).sort((a, b) => b.score - a.score || a.entry.questionId.localeCompare(b.entry.questionId));
}

export function confidentVietnameseSuggestions(message: string, entries: ChatIndexEntry[], minimum = FALLBACK_MIN_SCORE): ChatIndexEntry[] {
  return rankVietnameseCandidates(message, entries).filter(row => row.score >= minimum && row.coverage >= minimum).slice(0, 3).map(row => row.entry);
}
