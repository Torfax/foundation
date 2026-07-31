/**
 * Hashes and verifies user passwords. Deliberately narrow and purpose-specific — not a
 * general "hash()" — because password hashing must be slow and salted (Argon2id), unlike
 * token/secret or content hashing. See ADR-0004.
 */
export interface PasswordHasher {
  /** Returns an encoded hash (PHC string) that embeds the algorithm, salt and parameters. */
  hash(password: string): Promise<string>;
  /** Constant-time verification of a plaintext password against an encoded hash. */
  verify(password: string, encodedHash: string): Promise<boolean>;
}
