import { FilterCriteria } from "./FilterCriteria";
import { PaginationCriteria } from "./PaginationCriteria";
import { SortCriteria } from "./SortCriteria";

export interface ReadCriteria<F extends string = string> {
  filters?: FilterCriteria<F>[];
  sort?: SortCriteria<F>[];
  pagination?: PaginationCriteria;
}
