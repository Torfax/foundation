import type { ConfigService } from '../../../config/ConfigService';

/** The settings every service reads its database from. */
export interface PostgresEnv {
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  DB_LOGGING: boolean;
}

/**
 * TypeORM's PostgreSQL options, said by shape: a service passes them to ITS `DataSource`, and
 * its copy of TypeORM and Foundation's never share nominal types.
 */
export interface PostgresDataSourceOptions {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  entities: Function[];
  synchronize: false;
  logging: Array<'query' | 'error' | 'schema'>;
}

/**
 * The PostgreSQL options of a service, from `DB_*`.
 *
 * `synchronize` is off and stays off: migrations are the source of truth (plain SQL applied
 * in order); entities describe an existing schema, never create it. The password is read as a
 * string on purpose — an all-digit password would otherwise be coerced to a number.
 */
export function postgresDataSourceOptions(config: ConfigService, entities: Function[]): PostgresDataSourceOptions {
  const logging: boolean = config.get('DB_LOGGING', false);
  return {
    type: 'postgres',
    host: config.getRequired('DB_HOST'),
    port: config.get('DB_PORT', 5432),
    username: config.getRequired('DB_USERNAME'),
    password: String(config.getRequired('DB_PASSWORD')),
    database: config.getRequired('DB_DATABASE'),
    entities,
    synchronize: false,
    logging: logging ? ['query', 'error', 'schema'] : ['error'],
  };
}
