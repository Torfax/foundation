// src/core/config/BaseEnv.ts
export default interface BaseEnv {
  /** Environment mode */
  NODE_ENV: 'development' | 'production' | 'test';

  /** Server configuration */
  PORT: number;
  ENABLE_DEBUG?: boolean;

  /** Database configuration */
  DB_TYPE: 'mysql' | 'postgres' | 'sqlite' | 'mariadb';
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;

  /** Optional full connection string */
  DATABASE_URL?: string;


  ENABLED_SWAGGER? : boolean;

  JWT_SECRET : string;

  APP_TIMEZONE: string;

  STAFF_NOTIFICATION_RECIPIENTS?: string;
}
