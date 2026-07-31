import { CriteriaTranslatorPort } from "../reader/criteria/CriteriaTranslatorPort";
import { ReadDataSourcePort } from "../reader/ReadDataSourcePort";
import { EntityConstructor } from "../EntityConstructor";
import { WriteDataSourcePort } from "../writer/WriteDataSourcePort";

/**
 * A Connector attaches foundation to an external relational data source (SQL via TypeORM
 * today). It provides the datasource-specific pieces the agnostic Reader/Writer need:
 *   1. a CriteriaTranslator (Criteria -> the source's native query type `Q`);
 *   2. read/write ports that execute `Q` against the source;
 *   3. `query()` — an executor-bound raw escape hatch for things Criteria can't express
 *      (aggregations, `FOR UPDATE SKIP LOCKED`, read models), returning rows (never a
 *      TypeORM Repository). See ADR-0002.
 *
 * Read/write ports and `query()` all resolve the current executor, so they participate in
 * the active transaction automatically.
 */
export interface Connector<Q = any> {
  createCriteriaTranslator(): CriteriaTranslatorPort<Q>;

  createReadAdapter<E extends object>(
    entity: EntityConstructor<E>
  ): ReadDataSourcePort<Q, E>;

  createWriteAdapter<E extends object>(
    entity: EntityConstructor<E>
  ): WriteDataSourcePort<Q, E>;

  query<R = unknown>(
    sql: string,
    parameters?: readonly unknown[]
  ): Promise<R[]>;
}
