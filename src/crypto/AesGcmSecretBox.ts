import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { SecretBox } from "./SecretBox";

const SCHEME = "aesgcm.v1";
const IV_BYTES = 12;
const KEY_BYTES = 32;

/**
 * AES-256-GCM SecretBox under a single master key from the environment. The boring
 * application-level answer to per-tenant secrets for a handful of customers: same trust
 * model as the JWT secret (whoever reads the .env could already do worse). Sealed format:
 *
 *   aesgcm.v1:<base64 iv>:<base64 auth tag>:<base64 ciphertext>
 *
 * A real KMS arrives as a different scheme prefix, not a schema migration.
 */
export class AesGcmSecretBox implements SecretBox {
  private readonly key: Buffer;

  /** @param masterKeyBase64 32 bytes, base64-encoded (e.g. `openssl rand -base64 32`). */
  constructor(masterKeyBase64: string) {
    this.key = Buffer.from(masterKeyBase64, "base64");
    if (this.key.length !== KEY_BYTES) {
      throw new Error(`AesGcmSecretBox requires a ${KEY_BYTES}-byte base64 master key`);
    }
  }

  seal(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      SCHEME,
      iv.toString("base64"),
      tag.toString("base64"),
      ciphertext.toString("base64"),
    ].join(":");
  }

  open(sealed: string): string {
    const [scheme, ivB64, tagB64, ciphertextB64] = sealed.split(":");
    if (scheme !== SCHEME || !ivB64 || !tagB64 || !ciphertextB64) {
      throw new Error("Unknown sealed-secret scheme");
    }
    const decipher = createDecipheriv("aes-256-gcm", this.key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  }
}
