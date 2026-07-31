/**
 * Signs and verifies compact JWTs. The payload shape is the caller's concern; this port only
 * cares about signing/verifying and expiry. Kept behind an interface so the algorithm (HS256
 * today, RS256/JWKS later) can be swapped without touching callers. See ADR-0004.
 */
export interface JwtSigner {
  sign(
    payload: Record<string, unknown>,
    options: { expiresInSeconds: number; subject?: string }
  ): string;

  /** Returns the decoded claims, or throws if the token is invalid/expired. */
  verify<T extends object = Record<string, unknown>>(token: string): T;
}
