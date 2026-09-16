import axios from "axios";

export type ApiErrorEnvelope = {
  code?: string;
  message?: string;
  details?: Record<string, string[]>;
  traceId?: string;
};

function readTrimmedString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function toApiError(error: unknown): ApiErrorEnvelope | null {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const data = error.response?.data;
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  const detailsCandidate = record.details;
  const details =
    detailsCandidate &&
    typeof detailsCandidate === "object" &&
    !Array.isArray(detailsCandidate)
      ? (detailsCandidate as Record<string, string[]>)
      : undefined;

  const code = readTrimmedString(record.code);
  // Prefer API envelope message; fall back to RFC7807 ProblemDetails title.
  const message =
    readTrimmedString(record.message) ??
    readTrimmedString(record.title) ??
    readTrimmedString(record.error);
  const traceId = readTrimmedString(record.traceId);

  if (!code && !message && !details && !traceId) {
    return null;
  }

  // Envelope with only a traceId (common for antiforgery ProblemDetails) is not
  // useful to the UI — treat as unparsed so callers can apply a fallback message.
  if (!code && !message && !details) {
    return null;
  }

  return {
    code,
    message,
    details,
    traceId,
  };
}

export function toApiErrorWithFallback(
  error: unknown,
  fallback: string,
): ApiErrorEnvelope {
  const next = toApiError(error);
  return {
    code: next?.code,
    message: next?.message ?? fallback,
    details: next?.details,
    traceId: next?.traceId,
  };
}

export function getFieldError(
  details: Record<string, string[]> | undefined,
  key: string,
): string | null {
  if (!details) return null;
  const exact = details[key];
  if (exact?.length) return exact[0] ?? null;

  const hit = Object.entries(details).find(
    ([k]) => k.toLowerCase() === key.toLowerCase(),
  );
  if (!hit || !hit[1]?.length) return null;
  return hit[1][0] ?? null;
}
