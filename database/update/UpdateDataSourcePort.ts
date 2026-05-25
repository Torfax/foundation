import { UpdateEntityId, UpdateExecutionOptions, UpdateOperationResult } from "./UpdateTypes";

export interface UpdateDataSourcePort<Q, E extends object = any> {
  updateById(
    id: UpdateEntityId,
    patch: Partial<E>,
    options?: UpdateExecutionOptions
  ): Promise<UpdateOperationResult>;

  updateByCriteria(
    query: Q,
    patch: Partial<E>,
    options?: UpdateExecutionOptions
  ): Promise<UpdateOperationResult>;

  updateMany(
    query: Q,
    patch: Partial<E>,
    options?: UpdateExecutionOptions
  ): Promise<UpdateOperationResult>;
}
