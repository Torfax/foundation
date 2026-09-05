/**
 * RFC 7519 §4.1.3 audience check, shared by every signer.
 *
 * A token that names no audience is accepted as it always was: it predates audiences
 * (a human session token) and the caller, not this port, decides whether that is still
 * acceptable. A token that DOES name one must include the expected value — an access
 * token minted for another resource server is exactly what RFC 8707 exists to refuse.
 */
export function assertAudience(claims: unknown, expected: string | undefined): void {
  if (!expected) return;
  const aud = (claims as { aud?: unknown })?.aud;
  if (aud === undefined || aud === null) return;

  const audiences = Array.isArray(aud) ? aud : [aud];
  if (!audiences.includes(expected)) {
    throw new Error(`jwt audience invalid. expected: ${expected}`);
  }
}
