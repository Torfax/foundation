/**
 * Resolves the executor (connection / entity manager) in effect for the current async
 * scope: the base pool by default, or a transactional manager while inside a UnitOfWork.
 *
 * This is the seam that lets Reader/Writer/query all share one transaction without any
 * caller threading a manager by hand. It is an *injected instance* (fakeable in tests),
 * not a static global — see ADR-0002.
 */
export interface ExecutorContext<E = unknown> {
  current(): E;
}
