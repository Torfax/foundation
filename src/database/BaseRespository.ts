import { DatabaseDriverName } from "./adapters/DatabaseDriverName";
import { EntityConstructor } from "./EntityConstructor";
import { EntityStore } from "./EntityStore";
import { DriverRegistry } from "./adapters/DriverRegistry";

export abstract class BaseRepository {

  protected createStore<E extends object>(
    driverName: DatabaseDriverName,
    entity: EntityConstructor<E>
  ): EntityStore<E> {

    const driver = DriverRegistry.get(driverName);

    return new EntityStore<E>(driver, entity);
  }
}
