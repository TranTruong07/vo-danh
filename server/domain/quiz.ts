export interface QuizQuestion { question: string; options: string[]; correctIndex: number; explanation: string; correctFeedback?: string; incorrectFeedback?: string }
export interface PublicQuestion { id: string; question: string; options: string[]; expiresAt: string }
export interface AnswerResult { selectedIndex: number; correctIndex: number; correct: boolean; explanation: string; fact: string; sources: string }
export type GameResult<T> = { ok: true; data: T } | { ok: false; message: string };

