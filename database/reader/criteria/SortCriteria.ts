export interface SortCriteria<F extends string = string> {
  field: F;
  direction: "ASC" | "DESC";
}
