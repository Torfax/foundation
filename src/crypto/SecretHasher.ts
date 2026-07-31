/**
 * Hashes high-entropy secrets (refresh tokens, API secrets) for at-rest storage and does a
 * constant-time comparison on verify. Unlike PasswordHasher this is a FAST hash with no salt
 * — appropriate because the input is already cryptographically random, not a low-entropy
 * password. Never use this for passwords. See ADR-0004.
 */
export interface SecretHasher {
  hash(secret: string): Buffer;
  verify(secret: string, expected: Buffer): boolean;
}
