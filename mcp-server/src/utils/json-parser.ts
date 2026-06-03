import { logger } from './logger';

export type JsonParseResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: 'INVALID_JSON';
        message: string;
      };
    };

export function safeJsonParse<T>(raw: string): JsonParseResult<T> {
  try {
    return {
      ok: true,
      data: JSON.parse(raw) as T,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown JSON parse error';
    logger.error('Failed to parse JSON payload.', { message });
    return {
      ok: false,
      error: {
        code: 'INVALID_JSON',
        message,
      },
    };
  }
}
