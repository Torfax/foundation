export type CriteriaFilterOperator =
  | "eq"        // equal
  | "neq"       // not equal
  | "gt"        // >
  | "lt"        // <
  | "gte"       // >=
  | "lte"       // <=
  | "contains"  // like %x%
  | "startsWith"
  | "endsWith"
  | "in"
  | "between"
  | "isNull"
  | "notNull"
  | "like"
  | "notLike";
