/**
 * The response envelope every service of the ecosystem answers with.
 *
 * One shape for success and for failure, so a client parses one thing: `success` says
 * which, `payload` carries the data (or the error details), `statusCode` repeats the HTTP
 * status for clients that only see the body. `HttpResponse` writes the same shape on a
 * plain Express `res`; the Nest interceptor and filter in `@torfax/foundation/nest` build it
 * with these helpers.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  payload: T;
  statusCode: number;
}

/** A handler may return this to set its own message alongside the payload. */
export interface WithMessage<T> {
  message: string;
  payload: T;
}

export function hasMessage<T>(value: unknown): value is WithMessage<T> {
  return typeof value === 'object' && value !== null && 'message' in value && 'payload' in value;
}

export function successEnvelope<T>(data: T | WithMessage<T>, statusCode = 200): ApiEnvelope<T> {
  if (hasMessage<T>(data)) {
    return { success: true, message: data.message, payload: data.payload, statusCode };
  }
  return { success: true, message: 'OK', payload: data as T, statusCode };
}

export function errorEnvelope(statusCode: number, message: string, details: unknown = null): ApiEnvelope<unknown> {
  return { success: false, message, payload: details ?? null, statusCode };
}
