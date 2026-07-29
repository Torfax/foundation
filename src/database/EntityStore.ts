import { Repository } from "typeorm";
import { Connector } from "./adapters/Connector";
import { EntityConstructor } from "./EntityConstructor";
import { Reader } from "./reader/Reader";
import { ReadDataSourcePort } from "./reader/ReadDataSourcePort";
import { CriteriaTranslatorPort } from "./reader/criteria/CriteriaTranslatorPort";
import { Writer } from "./writer/Writer";
import { WriteDataSourcePort } from "./writer/WriteDataSourcePort";

export class EntityStore<E extends object> {

  readonly reader: Reader<any, E>;
  readonly writer: Writer<any, E>;
  private readonly translator: CriteriaTranslatorPort<any>;
  private readonly readAdapter: ReadDataSourcePort<any, E>;
  private readonly writeAdapter: WriteDataSourcePort<any, E>;

  constructor(
    private readonly connector: Connector<any>,
    private readonly entity: EntityConstructor<E>
  ) {

    this.translator = this.connector.createCriteriaTranslator();
    this.readAdapter = this.connector.createReadAdapter(this.entity);
    this.writeAdapter = this.connector.createWriteAdapter(this.entity);

    this.reader = this.createReader();
    this.writer = this.createWriter();
  }

  private createReader(): Reader<any, E> {
    return new Reader(this.translator, this.readAdapter);
  }

  private createWriter(): Writer<any, E> {
    return new Writer(this.translator, this.readAdapter, this.writeAdapter);
  }

  async raw<R>(

    /*
      Notice/Warn/TODO:

      El tipo Repository realmente no se deberia de
      ocupar aca.. ya que este objeto pertenece
      a typeorm y se supone que foundation debe
      de ser agnostico al orm

      sin embargo actualmente solo se esta trabajando
      con typeorm, por eso funcionara asi por el momento
    */
    operation: (repo: Repository<E>) => Promise<R>
  ): Promise<R> {
    return this.connector.raw<E, R>(this.entity, operation);
  }
}
