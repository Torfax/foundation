import {
    DataSource,
    FindManyOptions,
    Repository,
    ObjectLiteral,
    EntityTarget
} from "typeorm";

import { DataSourceDriver } from "../DataSourceDriver";
import { TypeOrmCriteriaTranslator } from "./TypeOrmCriteriaTranslator";
import { TypeOrmReadRepositoryAdapter } from "./TypeOrmReadRepositoryAdapter";
import { ReadDataSourcePort } from "../../reader/ReadDataSourcePort";
import { EntityConstructor } from "../../EntityConstructor";
import { UpdateDataSourcePort } from "../../update/UpdateDataSourcePort";
import { TypeOrmUpdateRepositoryAdapter } from "./TypeOrmUpdateRepositoryAdapter";

export class TypeOrmDriver
  implements DataSourceDriver<FindManyOptions<any>> {

  constructor(private readonly dataSource: DataSource) {}

  createCriteriaTranslator() {
    return new TypeOrmCriteriaTranslator<any>();
  }

  createReadAdapter<E extends ObjectLiteral>(
    entity: EntityConstructor<E>
  ): ReadDataSourcePort<FindManyOptions<any>, E> {

    const repository = this.dataSource.getRepository(entity);

    return new TypeOrmReadRepositoryAdapter(repository) as unknown as ReadDataSourcePort<
        FindManyOptions<any>,
        E
      >;
  }

  createUpdateAdapter<E extends ObjectLiteral>(
    entity: EntityConstructor<E>
  ): UpdateDataSourcePort<FindManyOptions<any>, E> {

    const repository = this.dataSource.getRepository(entity);

    return new TypeOrmUpdateRepositoryAdapter(repository, entity) as unknown as UpdateDataSourcePort<
      FindManyOptions<any>,
      E
    >;
  }

  async raw<E extends ObjectLiteral, R>(
    entity: EntityConstructor<E>,
    operation: (repository: Repository<E>) => Promise<R>
  ): Promise<R> {

    const repository = this.dataSource.getRepository(entity);

    return operation(repository);
  }
}

