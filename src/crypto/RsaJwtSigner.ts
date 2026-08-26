import { createPublicKey, createHash, KeyObject } from "node:crypto";
import { sign as jwtSign, verify as jwtVerify } from "jsonwebtoken";
import { JwtSigner } from "./JwtSigner";

/** A public key in JWK form, as served by a JWKS document. */
export interface JsonWebKey {
  kty: string;
  use: string;
  alg: string;
  kid: string;
  n: string;
  e: string;
}

/**
 * A signer whose public half can be published, so a relying party can verify a token
 * it did not receive from us directly.
 */
export interface PublishableJwtSigner extends JwtSigner {
  /** The public keys, for a `/.well-known/jwks.json` document. */
  jwks(): { keys: JsonWebKey[] };
  /** The `kid` of the key currently used to sign. */
  activeKeyId(): string;
}

/**
 * RS256 (asymmetric) JWT signer.
 *
 * Why asymmetric and not the HS256 signer next door: an `id_token` is meant to be
 * verified by someone who is NOT the issuer. With a shared secret, every relying
 * party that can verify a token can also mint one — so ParaVos could forge a Torfax
 * identity. With RS256 the relying party only ever holds the public half, and the
 * authority to say "this human is who they say" stays with Torfax alone.
 *
 * That is also what makes a JWKS endpoint possible: publishing a signing secret is
 * unthinkable; publishing a public key is the whole point.
 *
 * Access tokens can keep using HS256 while this signs identity — they are verified
 * by Torfax itself, so there is no third party to protect against. Both live behind
 * the same `JwtSigner` port (ADR-0004), so callers do not know the difference.
 */
export class RsaJwtSigner implements PublishableJwtSigner {
  private readonly publicKey: KeyObject;
  private readonly kid: string;

  /**
   * @param privateKeyPem PKCS#8 or PKCS#1 private key.
   * @param issuer        The `iss` claim. A relying party rejects anything else.
   * @param keyId         Optional stable `kid`. Derived from the key when omitted, so
   *                      the same key always yields the same id across restarts.
   */
  constructor(
    private readonly privateKeyPem: string,
    private readonly issuer?: string,
    keyId?: string
  ) {
    this.publicKey = createPublicKey(privateKeyPem);
    this.kid = keyId ?? RsaJwtSigner.thumbprint(this.publicKey);
  }

  sign(
    payload: Record<string, unknown>,
    options: { expiresInSeconds: number; subject?: string; audience?: string }
  ): string {
    return jwtSign(payload, this.privateKeyPem, {
      algorithm: "RS256",
      expiresIn: options.expiresInSeconds,
      keyid: this.kid,
      ...(options.subject ? { subject: options.subject } : {}),
      ...(options.audience ? { audience: options.audience } : {}),
      ...(this.issuer ? { issuer: this.issuer } : {}),
    });
  }

  verify<T extends object = Record<string, unknown>>(token: string): T {
    return jwtVerify(token, this.publicKey, {
      algorithms: ["RS256"],
      ...(this.issuer ? { issuer: this.issuer } : {}),
    }) as T;
  }

  activeKeyId(): string {
    return this.kid;
  }

  jwks(): { keys: JsonWebKey[] } {
    const jwk = this.publicKey.export({ format: "jwk" }) as {
      kty?: string;
      n?: string;
      e?: string;
    };

    if (jwk.kty !== "RSA" || !jwk.n || !jwk.e) {
      throw new Error("RsaJwtSigner: the configured key is not an RSA key.");
    }

    return {
      keys: [
        {
          kty: "RSA",
          use: "sig",
          alg: "RS256",
          kid: this.kid,
          n: jwk.n,
          e: jwk.e,
        },
      ],
    };
  }

  /**
   * RFC 7638 JWK thumbprint: the SHA-256 of the canonical JWK, base64url.
   *
   * Deriving the `kid` from the key itself — instead of generating one — means a
   * restart, a redeploy or a second instance all advertise the same id for the same
   * key. A random `kid` would make every relying party's cached JWKS go stale for no
   * reason.
   */
  private static thumbprint(key: KeyObject): string {
    const jwk = key.export({ format: "jwk" }) as { e?: string; kty?: string; n?: string };
    const canonical = JSON.stringify({ e: jwk.e, kty: jwk.kty, n: jwk.n });

    return createHash("sha256").update(canonical).digest("base64url");
  }
}
