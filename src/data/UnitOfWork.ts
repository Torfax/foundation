/**
 * Transaction boundary. Everything enlisted inside `run()` — reads, writes, `query()` —
 * shares one atomic transaction; it commits when the work resolves and rolls back if it
 * throws. Nesting joins the active transaction (JOIN_EXISTING). See ADR-0002.
 *
 * Caveat: await every important promise inside `run()`; a detached task would escape the
 * ambient transaction.
 */
export interface UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T>;
}
