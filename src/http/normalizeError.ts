import { isHttpException } from '../exceptions/HttpException';

export interface NormalizedError {
  statusCode: number;
  message: string;
  details: unknown;
}

/**
 * Any thrown value, reduced to what the error envelope needs.
 *
 * Three sources, in order: Foundation's own `HttpException` hierarchy; anything that looks
 * like a framework HTTP exception (`getStatus()` + `getResponse()`, which is Nest's); and
 * everything else, which is a 500 that reveals nothing.
 *
 * The middle case is recognised by SHAPE, not by `instanceof`. A service that links
 * Foundation with `file:` can end up with two copies of its framework — the service's and
 * Foundation's own — and an `instanceof` against the wrong copy would turn every 403 into a
 * 500.
 */
export function normalizeError(exception: unknown): NormalizedError {
  if (isHttpException(exception)) {
    const e = exception as { statusCode: number; message: string; data?: unknown };
    return { statusCode: e.statusCode, message: e.message, details: e.data ?? null };
  }

  if (isFrameworkHttpException(exception)) {
    const res = exception.getResponse();
    const raw =
      typeof res === 'string'
        ? res
        : (((res as Record<string, unknown> | null)?.message as string | string[] | undefined) ?? exception.message);
    return {
      statusCode: exception.getStatus(),
      message: Array.isArray(raw) ? raw.join(', ') : String(raw),
      details: typeof res === 'object' ? res : null,
    };
  }

  return { statusCode: 500, message: 'Internal server error', details: null };
}

interface FrameworkHttpException {
  message: string;
  getStatus(): number;
  getResponse(): unknown;
}

function isFrameworkHttpException(value: unknown): value is FrameworkHttpException {
  return (
    value instanceof Error &&
    typeof (value as Partial<FrameworkHttpException>).getStatus === 'function' &&
    typeof (value as Partial<FrameworkHttpException>).getResponse === 'function'
  );
}
