import { DataSource } from "typeorm";
import { Connector } from "../Connector";
import { TypeOrmConnector } from "./TypeOrmConnector";

/**
 * Factory for the TypeORM connector — the canonical composition entry point.
 *
 * The host builds a connector from its own TypeORM `DataSource` and injects it
 * explicitly (e.g. into a `BaseRepository` subclass). There is no global registry and
 * no hidden state: dependencies are always visible and passed from the outside.
 *
 * @example
 * const connector = createTypeOrmConnector(dataSource);
 * const repo = new ResourceRepository(connector);
 */
export function createTypeOrmConnector(dataSource: DataSource): Connector {
  return new TypeOrmConnector(dataSource);
}
