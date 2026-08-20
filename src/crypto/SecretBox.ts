/**
 * Seals small secrets (API credentials, signing material) for at-rest storage and opens them
 * on demand. Unlike SecretHasher this is REVERSIBLE by design — the stored value must be
 * recovered and handed to an authorized caller. The sealed string is self-describing
 * (scheme-prefixed), so the storage column can later hold values sealed by a different
 * mechanism (e.g. a KMS reference) without a migration. See ADR-0004 (crypto by purpose).
 */
export interface SecretBox {
  /** Returns a self-describing sealed string, safe to persist. */
  seal(plaintext: string): string;
  /** Recovers the plaintext, or throws if the value is tampered or the scheme is unknown. */
  open(sealed: string): string;
}
