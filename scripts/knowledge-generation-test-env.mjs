import nextEnvironment from '@next/env';
import { MongoClient } from 'mongodb';
export const TEST_DATABASE = 'vo_danh_phase5e1_test';
export function configureTestEnvironment() {
  nextEnvironment.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
  const uri = process.env.MONGODB_TEST_URI?.trim();
  if (!uri) throw new Error('TEST_URI_MISSING');
  let parsed;
  try { parsed = new URL(uri); } catch { throw new Error('TEST_URI_INVALID'); }
  const named = decodeURIComponent(parsed.pathname.slice(1));
  if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol) || (named && named !== TEST_DATABASE)) throw new Error('WRONG_TEST_TARGET');
  process.env.MONGODB_URI = uri;
  process.env.MONGODB_DB_NAME = TEST_DATABASE;
  process.env.GEMINI_API_KEY = '';
  process.env.KNOWLEDGE_GENERATION_ENABLED = 'false';
  process.env.CHAT_AI_MATCHING_ENABLED = 'false';
  const original = MongoClient.prototype.db;
  MongoClient.prototype.db = function(name, options) {
    if (name !== TEST_DATABASE) throw new Error('FORBIDDEN_DATABASE');
    return original.call(this, name, options);
  };
  return { uri, uriContainsDatabase: !!named, target: TEST_DATABASE };
}
export function safeError(error) {
  return { name: error?.name || 'Error', code: typeof error?.code === 'number' ? error.code : undefined,
    reason: /^[A-Z_]+$/.test(error?.message || '') ? error.message : 'CHECK_FAILED_REDACTED' };
}
