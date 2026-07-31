import { createHash, timingSafeEqual } from "node:crypto";
import { SecretHasher } from "./SecretHasher";

/** SHA-256 secret hasher — a fast digest suitable for high-entropy tokens (not passwords). */
export class Sha256SecretHasher implements SecretHasher {
  hash(secret: string): Buffer {
    return createHash("sha256").update(secret, "utf8").digest();
  }

  verify(secret: string, expected: Buffer): boolean {
    const actual = this.hash(secret);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}
