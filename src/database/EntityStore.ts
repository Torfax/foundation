import { Repository } from "typeorm";
import { DataSourceDriver } from "./adapters/DataSourceDriver";
import { EntityConstructor } from "./EntityConstructor";
import { Reader } from "./reader/Reader";
import { ReadDataSourcePort } from "./reader/ReadDataSourcePort";
import { CriteriaTranslatorPort } from "./reader/criteria/CriteriaTranslatorPort";
import { Updater } from "./update/Updater";
import { UpdateDataSourcePort } from "./update/UpdateDataSourcePort";

export class EntityStore<E extends object> {

  readonly reader: Reader<any, E>;
  readonly updater: Updater<any, E>;
  private readonly translator: CriteriaTranslatorPort<any>;
  private readonly readAdapter: ReadDataSourcePort<any, E>;
  private readonly updateAdapter: UpdateDataSourcePort<any, E>;

  constructor(
    private readonly driver: DataSourceDriver<any>,
    private readonly entity: EntityConstructor<E>
  ) {

    this.translator = this.driver.createCriteriaTranslator();
    this.readAdapter = this.driver.createReadAdapter(this.entity);
    this.updateAdapter = this.driver.createUpdateAdapter(this.entity);

    this.reader = this.createReader();
    this.updater = this.createUpdater();
  }

  private createReader(): Reader<any, E> {
    return new Reader(this.translator, this.readAdapter);
  }

  private createUpdater(): Updater<any, E> {
    return new Updater(this.translator, this.readAdapter, this.updateAdapter);
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

