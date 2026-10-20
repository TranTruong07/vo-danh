import test from 'node:test';
import assert from 'node:assert/strict';
import { modelMetrics } from '../scripts/support/chat-model-evaluation-metrics.mjs';
test('no live samples means unknown metrics, not zero accuracy or perfect reliability', () => {
  const m = modelMetrics([]);
  assert.equal(m.attempted, 0); assert.equal(m.successRate, null);
  assert.equal(m.matchingAccuracyAllAttempts, null); assert.equal(m.p95LatencyMsAllAttempts, null);
});
test('provider failures stay in accuracy/reliability denominators; percentiles use nearest rank', () => {
  const m = modelMetrics([
    { httpStatus: 200, schemaValid: true, validJson: true, correct: true, latencyMs: 100 },
    { httpStatus: 504, schemaValid: false, validJson: false, correct: null, latencyMs: 5000 },
  ]);
  assert.equal(m.successRate, .5); assert.equal(m.matchingAccuracyAllAttempts, .5);
  assert.equal(m.matchingAccuracyValidResponses, 1); assert.equal(m.jsonValidityHttp200, 1);
  assert.equal(m.p50LatencyMsAllAttempts, 100); assert.equal(m.p95LatencyMsAllAttempts, 5000);
  assert.equal(m.providerErrors[504], 1);
});
test('valid JSON is separate from schema validity and from correct matching', () => {
  const m = modelMetrics([
    { httpStatus: 200, schemaValid: false, validJson: true, correct: false, latencyMs: 100 },
    { httpStatus: 200, schemaValid: true, validJson: true, correct: false, latencyMs: 200 },
    { httpStatus: null, schemaValid: false, validJson: false, correct: null, latencyMs: 5000 },
  ]);
  assert.equal(m.transportSuccessRate, 2 / 3); assert.equal(m.successRate, 1 / 3);
  assert.equal(m.jsonValidityHttp200, 1); assert.equal(m.matchingAccuracyValidResponses, 0);
  assert.equal(m.noHttpResponse, 1);
});
