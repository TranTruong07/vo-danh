import test from 'node:test';
import assert from 'node:assert/strict';
import { loader } from './support/load-typescript.mjs';
const { describeGeminiFailure } = loader()('@/server/infrastructure/gemini-errors');
const apiError = (status, message, code = 'UNKNOWN', details = []) => ({ status, message: JSON.stringify({ error: { code: status, status: code, message, details } }) });

test('Gemini diagnostics distinguish provider failures without guessing quota tier or key validity', () => {
  const cases = [
    [apiError(404, 'Model not found', 'NOT_FOUND'), 'model_unsupported'],
    [apiError(403, 'Permission denied', 'PERMISSION_DENIED'), 'permission_denied'],
    [apiError(400, 'API key not valid', 'INVALID_ARGUMENT', [{ reason: 'API_KEY_INVALID' }]), 'invalid_api_key'],
    [apiError(429, 'Quota exceeded for generate_content_free_tier_requests', 'RESOURCE_EXHAUSTED'), 'free_quota_exceeded'],
    [apiError(429, 'Quota exceeded', 'RESOURCE_EXHAUSTED'), 'quota_exceeded'],
    [apiError(403, 'Please enable billing', 'PERMISSION_DENIED'), 'billing_required'],
    [Error('gemini_timeout'), 'timeout'], [apiError(504, 'Deadline exceeded'), 'timeout'],
    [apiError(400, 'responseJsonSchema invalid'), 'structured_output_schema'],
    [Error('HTTP options are not correctly set'), 'sdk_configuration'],
    [new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } }), 'network'],
    [apiError(503, 'Unavailable', 'UNAVAILABLE'), 'provider_unavailable'],
    [new SyntaxError('Unexpected token'), 'invalid_response'],
    [Error('Unrecognized failure'), 'unknown'],
  ];
  for (const [error, kind] of cases) assert.equal(describeGeminiFailure(error).kind, kind);
});
test('safe Gemini diagnostics retain status/reason but never raw key, prompt or URL', () => {
  const error = apiError(400, 'API key not valid SECRET_KEY https://example.test?key=SECRET_KEY question: private', 'INVALID_ARGUMENT', [{ reason: 'API_KEY_INVALID', metadata: { secret: 'SECRET_KEY' } }]);
  const safe = describeGeminiFailure(error);
  assert.equal(safe.httpStatus, 400); assert.equal(safe.providerCode, 'INVALID_ARGUMENT'); assert.equal(safe.reason, 'API_KEY_INVALID');
  assert.doesNotMatch(JSON.stringify(safe), /SECRET_KEY|https:|private|metadata/);
  assert.equal(describeGeminiFailure(null).kind, 'unknown');
});
