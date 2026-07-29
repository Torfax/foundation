import { Connector } from "./adapters/Connector";
import { EntityConstructor } from "./EntityConstructor";
import { EntityStore } from "./EntityStore";

export abstract class BaseRepository {

  constructor(protected readonly connector: Connector) {}

  protected createStore<E extends object>(
    entity: EntityConstructor<E>
  ): EntityStore<E> {
    return new EntityStore<E>(this.connector, entity);
  }
}
