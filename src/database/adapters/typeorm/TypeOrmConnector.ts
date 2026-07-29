import {
  DataSource,
  FindManyOptions,
  ObjectLiteral,
  Repository,
} from "typeorm";

import { Connector } from "../Connector";
import { TypeOrmCriteriaTranslator } from "./TypeOrmCriteriaTranslator";
import { TypeOrmReadAdapter } from "./TypeOrmReadAdapter";
import { ReadDataSourcePort } from "../../reader/ReadDataSourcePort";
import { EntityConstructor } from "../../EntityConstructor";
import { WriteDataSourcePort } from "../../writer/WriteDataSourcePort";
import { TypeOrmWriteAdapter } from "./TypeOrmWriteAdapter";

export class TypeOrmConnector
  implements Connector<FindManyOptions<any>> {

  constructor(private readonly dataSource: DataSource) {}

  createCriteriaTranslator() {
    return new TypeOrmCriteriaTranslator<any>();
  }

  createReadAdapter<E extends ObjectLiteral>(
    entity: EntityConstructor<E>
  ): ReadDataSourcePort<FindManyOptions<any>, E> {

    const repository = this.dataSource.getRepository(entity);

    return new TypeOrmReadAdapter(repository) as unknown as ReadDataSourcePort<
        FindManyOptions<any>,
        E
      >;
  }

  createWriteAdapter<E extends ObjectLiteral>(
    entity: EntityConstructor<E>
  ): WriteDataSourcePort<FindManyOptions<any>, E> {

    const repository = this.dataSource.getRepository(entity);

    return new TypeOrmWriteAdapter(repository, entity) as unknown as WriteDataSourcePort<
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
