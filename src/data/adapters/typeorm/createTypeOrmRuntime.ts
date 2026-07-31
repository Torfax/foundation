import { DataSource, EntityManager } from "typeorm";
import { Connector } from "../Connector";
import { UnitOfWork } from "../../UnitOfWork";
import { AsyncLocalStorageExecutorContext } from "../node/AsyncLocalStorageExecutorContext";
import { TypeOrmConnector } from "./TypeOrmConnector";
import { TypeOrmUnitOfWork } from "./TypeOrmUnitOfWork";

export interface RelationalRuntime {
  connector: Connector;
  unitOfWork: UnitOfWork;
}

/**
 * Canonical composition entry point for the relational (TypeORM) datasource.
 *
 * One shared ExecutorContext is bound to both the Connector and the UnitOfWork, so a
 * transaction opened by `unitOfWork.run(...)` is transparently seen by every repository
 * built from `connector`. No global registry, no hidden state — the host injects the
 * DataSource and owns its lifecycle. See ADR-0002.
 */
export function createTypeOrmRuntime(dataSource: DataSource): RelationalRuntime {
  const context = new AsyncLocalStorageExecutorContext<EntityManager>(
    () => dataSource.manager
  );

  return {
    connector: new TypeOrmConnector(context),
    unitOfWork: new TypeOrmUnitOfWork(dataSource, context),
  };
}
