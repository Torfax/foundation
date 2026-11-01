import { randomBytes, randomUUID } from 'node:crypto';

/** The two ids every request carries, and every row and audit event it writes. */
export interface RequestIds {
  readonly requestId: string;
  readonly correlationId: string;
}

/** A UUID in canonical form, or the 32 hex digits of a W3C trace id given dashes; else null. */
export function asUuid(value: string | undefined): string | null {
  if (!value) return null;
  const hex = value.trim().toLowerCase().replace(/-/g, '');
  if (!/^[0-9a-f]{32}$/.test(hex)) return null;
  const canonical = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  // With dashes only in their places: 32 hex digits split anywhere is not a UUID.
  return value.includes('-') && value.trim().toLowerCase() !== canonical ? null : canonical;
}

/** W3C Trace Context `traceparent` (version 00), or null when absent or malformed. */
export function parseTraceParent(value: string | undefined): { traceId: string; flags: string } | null {
  if (!value) return null;
  const match = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/.exec(value.toLowerCase());
  if (!match || /^0+$/.test(match[1]) || /^0+$/.test(match[2])) return null;
  return { traceId: match[1], flags: match[3] };
}

/**
 * The ids of an incoming request, from its headers.
 *
 * `x-correlation-id` may come from the caller: it is what lets someone reconstruct the whole
 * trail afterwards, across services. Both ids land in UUID columns, so a header that is not a
 * UUID — a proxy that appends a suffix, say — is ignored and a fresh one is named, instead of
 * failing every row the request writes. A `traceparent` lends its trace id as the correlation
 * when nothing else does, and the answer continues that trace with a span of its own.
 */
export function resolveRequestIds(header: (name: string) => string | undefined): RequestIds & {
  /** The `traceparent` to answer with, when the request came inside a trace. */
  traceparent?: string;
} {
  const requestId = asUuid(header('x-request-id')) ?? randomUUID();
  const trace = parseTraceParent(header('traceparent'));
  const correlationId = asUuid(header('x-correlation-id')) ?? (trace ? asUuid(trace.traceId) : null) ?? requestId;
  return {
    requestId,
    correlationId,
    ...(trace ? { traceparent: `00-${trace.traceId}-${randomBytes(8).toString('hex')}-${trace.flags}` } : {}),
  };
}
