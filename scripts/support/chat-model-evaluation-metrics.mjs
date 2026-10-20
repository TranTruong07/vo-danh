// Pure evaluation metrics. Provider failures remain in the end-to-end denominator.
export function modelMetrics(rows) {
  const ratio = (n, d) => d ? n / d : null;
  const percentile = (values, p) => {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    return sorted.length ? sorted[Math.ceil(p * sorted.length) - 1] : null;
  };
  const successful = rows.filter(r => r.httpStatus === 200 && r.schemaValid);
  const httpOk = rows.filter(r => r.httpStatus === 200);
  return {
    attempted: rows.length,
    transportSuccessRate: ratio(httpOk.length, rows.length),
    successRate: ratio(successful.length, rows.length),
    matchingAccuracyAllAttempts: ratio(rows.filter(r => r.correct === true).length, rows.length),
    matchingAccuracyValidResponses: ratio(successful.filter(r => r.correct === true).length, successful.length),
    jsonValidityAllAttempts: ratio(rows.filter(r => r.validJson).length, rows.length),
    jsonValidityHttp200: ratio(httpOk.filter(r => r.validJson).length, httpOk.length),
    p50LatencyMsAllAttempts: percentile(rows.map(r => r.latencyMs), .5),
    p95LatencyMsAllAttempts: percentile(rows.map(r => r.latencyMs), .95),
    p50LatencyMsSuccessful: percentile(successful.map(r => r.latencyMs), .5),
    p95LatencyMsSuccessful: percentile(successful.map(r => r.latencyMs), .95),
    providerErrors: Object.fromEntries([404, 429, 500, 503, 504].map(code => [code, rows.filter(r => r.httpStatus === code).length])),
    otherHttpErrors: rows.filter(r => r.httpStatus && r.httpStatus !== 200 && ![404, 429, 500, 503, 504].includes(r.httpStatus)).length,
    noHttpResponse: rows.filter(r => r.httpStatus === null).length,
  };
}
