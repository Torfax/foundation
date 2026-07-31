/**
 * Generates public identifiers (uids). Injected into use cases so the domain never depends
 * on a concrete UUID library, and tests can supply a deterministic generator. See ADR-0001.
 */
export interface UidGenerator {
  generate(): string;
}
