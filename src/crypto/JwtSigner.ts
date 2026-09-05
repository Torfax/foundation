/**
 * Signs and verifies compact JWTs. The payload shape is the caller's concern; this port only
 * cares about signing/verifying and expiry. Kept behind an interface so the algorithm (HS256
 * today, RS256/JWKS later) can be swapped without touching callers. See ADR-0004.
 */
export interface JwtVerifyOptions {
  /** The resource server verifying the token; a token with `aud` must include it. */
  expectedAudience?: string;
}

export interface JwtSigner {
  sign(
    payload: Record<string, unknown>,
    options: {
      expiresInSeconds: number;
      subject?: string;
      /**
       * `aud`. An id_token names the client it was minted for; an access token names the
       * resource servers it may be presented to (RFC 8707), one or several.
       */
      audience?: string | string[];
    }
  ): string;

  /**
   * Returns the decoded claims, or throws if the token is invalid/expired.
   *
   * `expectedAudience` rejects a token that names an audience the caller is not part of.
   * A token with no `aud` at all still passes: whether that is acceptable is the caller's
   * decision, not the signer's.
   */
  verify<T extends object = Record<string, unknown>>(
    token: string,
    options?: JwtVerifyOptions
  ): T;
}
