import {
  EntityManager,
  FindManyOptions,
  ObjectLiteral,
} from "typeorm";

import { Connector } from "../Connector";
import { ExecutorContext } from "../../ExecutorContext";
import { TypeOrmCriteriaTranslator } from "./TypeOrmCriteriaTranslator";
import { TypeOrmReadAdapter } from "./TypeOrmReadAdapter";
import { ReadDataSourcePort } from "../../reader/ReadDataSourcePort";
import { EntityConstructor } from "../../EntityConstructor";
import { WriteDataSourcePort } from "../../writer/WriteDataSourcePort";
import { TypeOrmWriteAdapter } from "./TypeOrmWriteAdapter";

export class TypeOrmConnector implements Connector<FindManyOptions<any>> {
  constructor(private readonly executor: ExecutorContext<EntityManager>) {}

  createCriteriaTranslator() {
    return new TypeOrmCriteriaTranslator<any>();
  }

  createReadAdapter<E extends ObjectLiteral>(
    entity: EntityConstructor<E>
  ): ReadDataSourcePort<FindManyOptions<any>, E> {
    return new TypeOrmReadAdapter(this.executor, entity) as unknown as ReadDataSourcePort<
      FindManyOptions<any>,
      E
    >;
  }

  createWriteAdapter<E extends ObjectLiteral>(
    entity: EntityConstructor<E>
  ): WriteDataSourcePort<FindManyOptions<any>, E> {
    return new TypeOrmWriteAdapter(this.executor, entity) as unknown as WriteDataSourcePort<
      FindManyOptions<any>,
      E
    >;
  }

  query<R = unknown>(
    sql: string,
    parameters?: readonly unknown[]
  ): Promise<R[]> {
    return this.executor.current().query(sql, parameters as any[]);
  }
}
