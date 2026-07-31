import { EntityManager, FindManyOptions, ObjectLiteral, Repository } from "typeorm";
import { ExecutorContext } from "../../ExecutorContext";
import { EntityConstructor } from "../../EntityConstructor";
import { ReadDataSourcePort } from "../../reader/ReadDataSourcePort";

export class TypeOrmReadAdapter<E extends ObjectLiteral>
  implements ReadDataSourcePort<FindManyOptions<E>, E> {

  constructor(
    private readonly executor: ExecutorContext<EntityManager>,
    private readonly entity: EntityConstructor<E>
  ) {}

  private repository(): Repository<E> {
    return this.executor.current().getRepository(this.entity as any);
  }

  async find(options: FindManyOptions<E>): Promise<E[]> {
    return this.repository().find(options);
  }

  async findOne(options: FindManyOptions<E>): Promise<E | null> {
    return this.repository().findOne(options);
  }

  async findAndCount(options: FindManyOptions<E>): Promise<[E[], number]> {
    return this.repository().findAndCount(options);
  }

  async count(options: FindManyOptions<E>): Promise<number> {
    return this.repository().count(options);
  }

  async exists(options: FindManyOptions<E>): Promise<boolean> {
    return this.repository().exists(options);
  }
}
