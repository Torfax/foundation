import { DataSource } from "typeorm";
import { DataSourceDriver } from "../DataSourceDriver";
import { TypeOrmDriver } from "./TypeOrmDriver";

/**
 * Factory for the TypeORM data-source driver — the canonical composition entry point.
 *
 * The host application builds a driver from its own TypeORM `DataSource` and injects
 * it explicitly (e.g. into a `BaseRepository` subclass). There is no global registry
 * and no hidden state: dependencies are always visible and passed from the outside.
 *
 * @example
 * const driver = createTypeOrmDriver(dataSource);
 * const repo = new ResourceRepository(driver);
 */
export function createTypeOrmDriver(dataSource: DataSource): DataSourceDriver {
  return new TypeOrmDriver(dataSource);
}
