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

  APP_DEFAULT_CHECK_IN_TIME?: string;
  APP_DEFAULT_CHECK_OUT_TIME?: string;

  STAFF_NOTIFICATION_RECIPIENTS?: string;

  FRONTEND_URL?: string;
  EMAIL_BRAND_LOGO_URL?: string;
  EMAIL_SUPPORT_EMAIL?: string;
  EMAIL_ADMIN_DASHBOARD_URL?: string;
  EMAIL_LOGIN_URL?: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_NAME?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
}
