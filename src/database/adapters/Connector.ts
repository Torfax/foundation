import { CriteriaTranslatorPort } from "../reader/criteria/CriteriaTranslatorPort";
import { ReadDataSourcePort } from "../reader/ReadDataSourcePort";
import { EntityConstructor } from "../EntityConstructor";
import { WriteDataSourcePort } from "../writer/WriteDataSourcePort";

/**
 * A Connector attaches foundation to an external data source — a SQL database via
 * TypeORM today, potentially a REST API tomorrow.
 *
 * It provides the only two datasource-specific things the agnostic Reader/Writer need:
 *   1. a CriteriaTranslator: lowers the standard Criteria into the source's native
 *      query type `Q` (for TypeORM, `FindManyOptions`);
 *   2. read/write ports that execute `Q` against the source.
 *
 * Everything above the Connector (Criteria, Reader, Writer, pagination, DNF) is
 * agnostic; swapping the Connector swaps the datasource.
 */
export interface Connector<Q = any> {
  createCriteriaTranslator(): CriteriaTranslatorPort<Q>;

  createReadAdapter<E extends object>(
    entity: EntityConstructor<E>
  ): ReadDataSourcePort<Q, E>;

  createWriteAdapter<E extends object>(
    entity: EntityConstructor<E>
  ): WriteDataSourcePort<Q, E>;

  raw<E extends object, R>(
    entity: EntityConstructor<E>,
    operation: (repository: any) => Promise<R>
  ): Promise<R>;
}
