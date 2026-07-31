import { DataSource, EntityManager } from "typeorm";
import { Connector } from "../Connector";
import { AsyncLocalStorageExecutorContext } from "../node/AsyncLocalStorageExecutorContext";
import { TypeOrmConnector } from "./TypeOrmConnector";

/**
 * Builds a Connector with its own (non-shared) executor context — fine for read/write
 * against the pool without transactions.
 *
 * @deprecated Prefer {@link createTypeOrmRuntime}, which returns a Connector *and* a
 * UnitOfWork sharing one executor context, so transactions actually span your repositories.
 */
export function createTypeOrmConnector(dataSource: DataSource): Connector {
  const context = new AsyncLocalStorageExecutorContext<EntityManager>(
    () => dataSource.manager
  );
  return new TypeOrmConnector(context);
}
