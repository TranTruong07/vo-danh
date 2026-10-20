import "server-only";

export type GeminiFailureKind = "model_unsupported" | "permission_denied" | "invalid_api_key" | "free_quota_exceeded"
  | "quota_exceeded" | "billing_required" | "timeout" | "sdk_configuration" | "structured_output_schema"
  | "network" | "provider_unavailable" | "invalid_response" | "unknown";
export interface GeminiFailure {
  kind: GeminiFailureKind;
  httpStatus?: number;
  providerCode?: string;
  reason?: string;
  message: string;
  networkCode?: string;
}
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const identifier = (value: unknown) => typeof value === "string" && /^[A-Z][A-Z0-9_]{1,79}$/.test(value) ? value : undefined;

// Extract evidence without returning raw SDK errors (which may contain requests/secrets).
export function describeGeminiFailure(error: unknown): GeminiFailure {
  const top = object(error), cause = object(top.cause);
  let parsed: Record<string, unknown> = {};
  if (typeof top.message === "string") {
    try { parsed = object(JSON.parse(top.message)); } catch { /* Non-JSON SDK/network error. */ }
  }
  const provider = object(parsed.error || top.error);
  const details = Array.isArray(provider.details) ? provider.details.map(object) : [];
  const reason = details.map(row => identifier(row.reason)).find(Boolean);
  const message = [top.message, provider.message, cause.message].filter(value => typeof value === "string").join(" ");
  const status = [top.status, provider.code].find(value => typeof value === "number" && Number.isInteger(value) && value >= 400 && value <= 599) as number | undefined;
  const providerCode = identifier(provider.status);
  const code = identifier(cause.code) || identifier(top.code);
  let kind: GeminiFailureKind = "unknown";
  if (/API_KEY_INVALID|API key not valid|invalid api.?key|expired.*key/i.test(`${reason} ${message}`)) kind = "invalid_api_key";
  else if (/billing.{0,40}(required|enable)|enable.{0,20}billing|BILLING_DISABLED/i.test(`${reason} ${message}`)) kind = "billing_required";
  else if (status === 429 || providerCode === "RESOURCE_EXHAUSTED") kind = /free.?tier|free_tier/i.test(message) ? "free_quota_exceeded" : "quota_exceeded";
  else if (status === 401 || status === 403 || providerCode === "PERMISSION_DENIED") kind = "permission_denied";
  else if (status === 404 || /model.{0,80}(not found|not supported|unsupported)/i.test(message)) kind = "model_unsupported";
  else if (status === 408 || status === 504 || /timeout|timed out|aborted|gemini_timeout/i.test(message) || top.name === "AbortError") kind = "timeout";
  else if (status === 400 && /schema|response.?mime|response.?json|generation.?config/i.test(message)) kind = "structured_output_schema";
  else if (/ENOTFOUND|ECONNRESET|ECONNREFUSED|ETIMEDOUT|UND_ERR|EAI_AGAIN/.test(code || "") || /fetch failed|fetch request failed|network|socket/i.test(message)) kind = "network";
  else if (status && status >= 500) kind = "provider_unavailable";
  else if (top.name === "SyntaxError" || /Unexpected token|not valid JSON|Response body is empty/i.test(message)) kind = "invalid_response";
  else if (status === 400 || /not supported|not correctly set|is required|cannot set|can not be/i.test(message)) kind = "sdk_configuration";
  const descriptions: Record<GeminiFailureKind, string> = {
    model_unsupported: "Provider reports model not found or unsupported for this request.",
    permission_denied: "Provider denied access; this alone does not establish an invalid API key.",
    invalid_api_key: "Provider explicitly reports an invalid or expired API key.",
    free_quota_exceeded: "Provider explicitly reports exhausted Free Tier quota.",
    quota_exceeded: "Provider reports exhausted quota; the billing tier is not established.",
    billing_required: "Provider explicitly requires billing. No billing changes were made.",
    timeout: "Request was aborted or exceeded a deadline.",
    sdk_configuration: "Request configuration was rejected.",
    structured_output_schema: "Provider rejected the structured output configuration/schema.",
    network: "Transport/network failure; no successful generation confirmed.",
    provider_unavailable: "Provider returned a server failure.",
    invalid_response: "Response could not be interpreted as the expected JSON transport envelope.",
    unknown: "Failure did not contain enough safe evidence to classify.",
  };
  return { kind, httpStatus: status, providerCode, reason, message: descriptions[kind], networkCode: code };
}
