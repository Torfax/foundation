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
  | "notIn"     // Not(In(...)) — uso interno tras merge de neq / exclusiones
  | "between"
  | "isNull"
  | "notNull"
  | "like"
  | "notLike";
