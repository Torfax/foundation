import { WriteEntityId, WriteExecutionOptions, WriteOperationResult } from "./WriteTypes";

/**
 * The write contract a datasource connector must satisfy: create / update / delete.
 * `Q` is the connector's native query type (e.g. TypeORM `FindManyOptions`); the
 * where-clause of update/delete arrives already translated from Criteria.
 */
export interface WriteDataSourcePort<Q, E extends object = any> {
  create(
    data: Partial<E>,
    options?: WriteExecutionOptions
  ): Promise<E>;

  createMany(
    data: Partial<E>[],
    options?: WriteExecutionOptions
  ): Promise<E[]>;

  updateById(
    id: WriteEntityId,
    patch: Partial<E>,
    options?: WriteExecutionOptions
  ): Promise<WriteOperationResult>;

  updateByCriteria(
    query: Q,
    patch: Partial<E>,
    options?: WriteExecutionOptions
  ): Promise<WriteOperationResult>;

  updateMany(
    query: Q,
    patch: Partial<E>,
    options?: WriteExecutionOptions
  ): Promise<WriteOperationResult>;

  deleteById(
    id: WriteEntityId,
    options?: WriteExecutionOptions
  ): Promise<WriteOperationResult>;

  deleteByCriteria(
    query: Q,
    options?: WriteExecutionOptions
  ): Promise<WriteOperationResult>;
}
