import { ReadCriteria } from "./ReadCriteria";

export interface CriteriaTranslatorPort<Q> {
  translate(criteria: ReadCriteria): Q;
}
