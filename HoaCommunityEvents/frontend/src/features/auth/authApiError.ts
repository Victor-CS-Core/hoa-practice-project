import axios from "axios";

export type ApiErrorEnvelope = {
  code?: string;
  message?: string;
  details?: Record<string, string[]>;
  traceId?: string;
};

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
    detailsCandidate && typeof detailsCandidate === "object"
      ? (detailsCandidate as Record<string, string[]>)
      : undefined;

  return {
    code: typeof record.code === "string" ? record.code : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
    details,
    traceId: typeof record.traceId === "string" ? record.traceId : undefined,
  };
}

export function getFieldError(
  details: Record<string, string[]> | undefined,
  key: string,
): string | null {
  if (!details) return null;
  const exact = details[key];
  if (exact?.length) return exact[0] ?? null;

  const hit = Object.entries(details).find(([k]) => k.toLowerCase() === key.toLowerCase());
  if (!hit || !hit[1]?.length) return null;
  return hit[1][0] ?? null;
}
