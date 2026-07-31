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

    this.reader = new Reader(this.translator, this.readAdapter);
    this.writer = new Writer(this.translator, this.readAdapter, this.writeAdapter);
  }

  /**
   * Executor-bound raw query escape hatch — runs in the current transaction and returns
   * rows (not a TypeORM Repository). Use for reads Criteria can't express, and keep it to
   * your own module's schema (cross-module reads go through public contracts). See ADR-0002.
   */
  query<R = unknown>(sql: string, parameters?: readonly unknown[]): Promise<R[]> {
    return this.connector.query<R>(sql, parameters);
  }
}
