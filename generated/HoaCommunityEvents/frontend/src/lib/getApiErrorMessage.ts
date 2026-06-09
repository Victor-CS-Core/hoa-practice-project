import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;

      if (typeof record.error === 'string' && record.error.trim()) {
        return record.error;
      }

      if (typeof record.message === 'string' && record.message.trim()) {
        return record.message;
      }

      if (Array.isArray(record.errors) && record.errors.length > 0) {
        const first = record.errors[0];
        if (typeof first === 'string' && first.trim()) {
          return first;
        }
      }
    }
  }

  return fallback;
}
