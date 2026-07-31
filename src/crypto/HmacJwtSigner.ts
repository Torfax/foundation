import { sign as jwtSign, verify as jwtVerify } from "jsonwebtoken";
import { JwtSigner } from "./JwtSigner";

/** HS256 (symmetric-secret) JWT signer. Swap for an RS256/JWKS signer for federation later. */
export class HmacJwtSigner implements JwtSigner {
  constructor(
    private readonly secret: string,
    private readonly issuer?: string
  ) {}

  sign(
    payload: Record<string, unknown>,
    options: { expiresInSeconds: number; subject?: string }
  ): string {
    return jwtSign(payload, this.secret, {
      algorithm: "HS256",
      expiresIn: options.expiresInSeconds,
      ...(options.subject ? { subject: options.subject } : {}),
      ...(this.issuer ? { issuer: this.issuer } : {}),
    });
  }

  verify<T extends object = Record<string, unknown>>(token: string): T {
    return jwtVerify(token, this.secret, {
      algorithms: ["HS256"],
      ...(this.issuer ? { issuer: this.issuer } : {}),
    }) as T;
  }
}
