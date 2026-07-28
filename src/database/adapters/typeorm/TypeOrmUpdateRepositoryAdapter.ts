import {
  EntityManager,
  FindManyOptions,
  ObjectLiteral,
  Repository,
  UpdateResult,
} from "typeorm";
import { EntityConstructor } from "../../EntityConstructor";
import { UpdateDataSourcePort } from "../../update/UpdateDataSourcePort";
import {
  UpdateEntityId,
  UpdateExecutionOptions,
  UpdateOperationResult,
} from "../../update/UpdateTypes";

export class TypeOrmUpdateRepositoryAdapter<E extends ObjectLiteral>
  implements UpdateDataSourcePort<FindManyOptions<E>, E> {
  constructor(
    private readonly repository: Repository<E>,
    private readonly entity: EntityConstructor<E>
  ) {}

  async updateById(
    id: UpdateEntityId,
    patch: Partial<E>,
    options?: UpdateExecutionOptions
  ): Promise<UpdateOperationResult> {
    const result = await this.getRepository(options?.manager).update(id as any, patch);
    return this.mapResult(result);
  }

  async updateByCriteria(
    query: FindManyOptions<E>,
    patch: Partial<E>,
    options?: UpdateExecutionOptions
  ): Promise<UpdateOperationResult> {
    return this.executeWhereUpdate(query, patch, options);
  }

  async updateMany(
    query: FindManyOptions<E>,
    patch: Partial<E>,
    options?: UpdateExecutionOptions
  ): Promise<UpdateOperationResult> {
    return this.executeWhereUpdate(query, patch, options);
  }

  private getRepository(manager?: EntityManager): Repository<E> {
    return manager ? manager.getRepository(this.entity) : this.repository;
  }

  private async executeWhereUpdate(
    query: FindManyOptions<E>,
    patch: Partial<E>,
    options?: UpdateExecutionOptions
  ): Promise<UpdateOperationResult> {
    if (!query.where) {
      throw new Error("Update criteria must include a where clause.");
    }

    const result = await this.getRepository(options?.manager).update(query.where as any, patch);
    return this.mapResult(result);
  }

  private mapResult(result: UpdateResult): UpdateOperationResult {
    return {
      affected: result.affected ?? undefined,
    };
  }
}
