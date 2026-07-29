import { DataSourceDriver } from "./adapters/DataSourceDriver";
import { EntityConstructor } from "./EntityConstructor";
import { EntityStore } from "./EntityStore";

export abstract class BaseRepository {

  constructor(protected readonly driver: DataSourceDriver) {}

  protected createStore<E extends object>(
    entity: EntityConstructor<E>
  ): EntityStore<E> {
    return new EntityStore<E>(this.driver, entity);
  }
}
