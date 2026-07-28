import { CriteriaFilterOperator } from "./CriteriaFilterOperator";

export interface FilterCriteria<F extends string = string> {
  field: F;
  operator: CriteriaFilterOperator;
  value: any;
}
