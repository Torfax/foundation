import {
  DeleteResult,
  EntityManager,
  FindManyOptions,
  ObjectLiteral,
  Repository,
  UpdateResult,
} from "typeorm";
import { ExecutorContext } from "../../ExecutorContext";
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
    private readonly executor: ExecutorContext<EntityManager>,
    private readonly entity: EntityConstructor<E>
  ) {}

  private repository(): Repository<E> {
    return this.executor.current().getRepository(this.entity as any);
  }

  async create(data: Partial<E>, _options?: WriteExecutionOptions): Promise<E> {
    const repository = this.repository();
    const entity = repository.create(data as any);
    const saved = await repository.save(entity as any);
    return saved as unknown as E;
  }

  async createMany(data: Partial<E>[], _options?: WriteExecutionOptions): Promise<E[]> {
    const repository = this.repository();
    const entities = repository.create(data as any[]);
    const saved = await repository.save(entities as any[]);
    return saved as unknown as E[];
  }

  async updateById(
    id: WriteEntityId,
    patch: Partial<E>,
    _options?: WriteExecutionOptions
  ): Promise<WriteOperationResult> {
    const result = await this.repository().update(id as any, patch as any);
    return this.mapResult(result);
  }

  async updateByCriteria(
    query: FindManyOptions<E>,
    patch: Partial<E>,
    _options?: WriteExecutionOptions
  ): Promise<WriteOperationResult> {
    return this.executeWhereUpdate(query, patch);
  }

  async updateMany(
    query: FindManyOptions<E>,
    patch: Partial<E>,
    _options?: WriteExecutionOptions
  ): Promise<WriteOperationResult> {
    return this.executeWhereUpdate(query, patch);
  }

  async deleteById(
    id: WriteEntityId,
    _options?: WriteExecutionOptions
  ): Promise<WriteOperationResult> {
    const result = await this.repository().delete(id as any);
    return this.mapDeleteResult(result);
  }

  async deleteByCriteria(
    query: FindManyOptions<E>,
    _options?: WriteExecutionOptions
  ): Promise<WriteOperationResult> {
    if (!query.where) {
      throw new Error("Delete criteria must include a where clause.");
    }
    const result = await this.repository().delete(query.where as any);
    return this.mapDeleteResult(result);
  }

  private async executeWhereUpdate(
    query: FindManyOptions<E>,
    patch: Partial<E>
  ): Promise<WriteOperationResult> {
    if (!query.where) {
      throw new Error("Update criteria must include a where clause.");
    }
    const result = await this.repository().update(query.where as any, patch as any);
    return this.mapResult(result);
  }

  private mapResult(result: UpdateResult): WriteOperationResult {
    return { affected: result.affected ?? undefined };
  }

  private mapDeleteResult(result: DeleteResult): WriteOperationResult {
    return { affected: result.affected ?? undefined };
  }
}
