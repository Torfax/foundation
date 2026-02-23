import { DataSourceDriver } from "./adapters/DataSourceDriver";
import { EntityConstructor } from "./EntityConstructor";
import { Reader } from "./reader/Reader";

export class EntityStore<E extends object> {

  readonly reader: Reader<any, E>;

  constructor(
    private readonly driver: DataSourceDriver<any>,
    private readonly entity: EntityConstructor<E>
  ) {

    this.reader = this.createReader();
  }

  private createReader(): Reader<any, E> {
    const translator = this.driver.createCriteriaTranslator();
    const adapter = this.driver.createReadAdapter(this.entity);

    return new Reader(translator, adapter);
  }

  async raw<R>(
    operation: (repo: any) => Promise<R>
  ): Promise<R> {
    return this.driver.raw(this.entity, operation);
  }
}

