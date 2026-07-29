import {
  DeleteResult,
  EntityManager,
  FindManyOptions,
  ObjectLiteral,
  Repository,
  UpdateResult,
} from "typeorm";
import { EntityConstructor } from "../../EntityConstructor";
import { WriteDataSourcePort } from "../../writer/WriteDataSourcePort";
import {
  WriteEntityId,
  WriteExecutionOptions,
  WriteOperationResult,
} from "../../writer/WriteTypes";

export class TypeOrmWriteAdapter<E extends ObjectLiteral>
  implements WriteDataSourcePort<FindManyOptions<E>, E> {
  constructor(
    private readonly repository: Repository<E>,
    private readonly entity: EntityConstructor<E>
  ) {}

  async create(
    data: Partial<E>,
    options?: WriteExecutionOptions
  ): Promise<E> {
    const repository = this.getRepository(options?.manager);
    const entity = repository.create(data as any);
    const saved = await repository.save(entity as any);
    return saved as unknown as E;
  }

  async createMany(
    data: Partial<E>[],
    options?: WriteExecutionOptions
  ): Promise<E[]> {
    const repository = this.getRepository(options?.manager);
    const entities = repository.create(data as any[]);
    const saved = await repository.save(entities as any[]);
    return saved as unknown as E[];
  }

  async updateById(
    id: WriteEntityId,
    patch: Partial<E>,
    options?: WriteExecutionOptions
  ): Promise<WriteOperationResult> {
    const result = await this.getRepository(options?.manager).update(id as any, patch);
    return this.mapResult(result);
  }

  async updateByCriteria(
    query: FindManyOptions<E>,
    patch: Partial<E>,
    options?: WriteExecutionOptions
  ): Promise<WriteOperationResult> {
    return this.executeWhereUpdate(query, patch, options);
  }

  async updateMany(
    query: FindManyOptions<E>,
    patch: Partial<E>,
    options?: WriteExecutionOptions
  ): Promise<WriteOperationResult> {
    return this.executeWhereUpdate(query, patch, options);
  }

  async deleteById(
    id: WriteEntityId,
    options?: WriteExecutionOptions
  ): Promise<WriteOperationResult> {
    const result = await this.getRepository(options?.manager).delete(id as any);
    return this.mapDeleteResult(result);
  }

  async deleteByCriteria(
    query: FindManyOptions<E>,
    options?: WriteExecutionOptions
  ): Promise<WriteOperationResult> {
    if (!query.where) {
      throw new Error("Delete criteria must include a where clause.");
    }

    const result = await this.getRepository(options?.manager).delete(query.where as any);
    return this.mapDeleteResult(result);
  }

  private getRepository(manager?: EntityManager): Repository<E> {
    return manager ? manager.getRepository(this.entity) : this.repository;
  }

  private async executeWhereUpdate(
    query: FindManyOptions<E>,
    patch: Partial<E>,
    options?: WriteExecutionOptions
  ): Promise<WriteOperationResult> {
    if (!query.where) {
      throw new Error("Update criteria must include a where clause.");
    }

    const result = await this.getRepository(options?.manager).update(query.where as any, patch);
    return this.mapResult(result);
  }

  private mapResult(result: UpdateResult): WriteOperationResult {
    return {
      affected: result.affected ?? undefined,
    };
  }

  private mapDeleteResult(result: DeleteResult): WriteOperationResult {
    return {
      affected: result.affected ?? undefined,
    };
  }
}
