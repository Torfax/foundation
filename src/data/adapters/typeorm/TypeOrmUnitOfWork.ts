import { DataSource, EntityManager } from "typeorm";
import { UnitOfWork } from "../../UnitOfWork";
import { AsyncLocalStorageExecutorContext } from "../node/AsyncLocalStorageExecutorContext";

/**
 * TypeORM UnitOfWork. Opens a transaction via the DataSource and binds its EntityManager
 * to the shared ExecutorContext for the duration of `work`, so every Reader/Writer/query
 * inside uses that transactional manager. Nested runs join the active transaction.
 */
export class TypeOrmUnitOfWork implements UnitOfWork {
  constructor(
    private readonly dataSource: DataSource,
    private readonly context: AsyncLocalStorageExecutorContext<EntityManager>
  ) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.context.hasActive()) {
      return work(); // JOIN_EXISTING
    }
    return this.dataSource.transaction((manager) => this.context.bind(manager, work));
  }
}
