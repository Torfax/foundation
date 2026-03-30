import { CriteriaNode } from "./CriteriaFilterTree";
import { FilterCriteria } from "./FilterCriteria";
import { PaginationCriteria } from "./PaginationCriteria";
import { SortCriteria } from "./SortCriteria";

export type ReadRelations =
  | string[]
  | Record<string, any>;

/** Default cap for OR clauses after DNF expansion. */
export const DEFAULT_MAX_DNF_CLAUSES = 100;

export interface ReadCriteria<F extends string = string> {
  /** @deprecated Prefer filterTree for grouped logic; kept for backward compatibility (implicit AND). */
  filters?: FilterCriteria<F>[];
  /**
   * Logical filter tree (AND/OR). Takes precedence over `filters` when both are set.
   * Do not confuse with TypeORM `where` output.
   */
  filterTree?: CriteriaNode<F>;
  /**
   * Max number of OR clauses after DNF expansion (checked on each partial cartesian product).
   * @default DEFAULT_MAX_DNF_CLAUSES
   */
  maxDNFClauses?: number;
  sort?: SortCriteria<F>[];
  pagination?: PaginationCriteria;
  relations?: ReadRelations;
}
