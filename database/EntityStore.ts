import { Repository } from "typeorm";
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

    /* 
      Notice/Warn/TODO:

      El tipo Repository realmente no se deberia de
      ocupar aca.. ya que este objeto pertenece 
      a typeorm y se supone que el core debe
      de ser agnostico al orm

      sin embargo actualmente solo se esta trabajando
      con typeorm, por eso funcionara asi por el momento
    */
    operation: (repo: Repository<E>) => Promise<R>
  ): Promise<R> {
    return this.driver.raw<E, R>(this.entity, operation);
  }
}

