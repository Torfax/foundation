// src/core/config/BaseEnv.ts
export default interface BaseEnv {
  /** Environment mode */
  NODE_ENV: 'development' | 'production' | 'test' | 'dev' | 'testing';

  /** Server configuration */
  PORT: number;
  ENABLE_DEBUG?: boolean;

  /** Database configuration */
  DB_TYPE: 'mysql' | 'postgres' | 'sqlite' | 'mariadb';
  DB_HOST?: string;
  DB_PORT?: number;
  DB_NAME?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DATABASE_PATH?: string;

  /** Optional full connection string */
  DATABASE_URL?: string;


  ENABLED_SWAGGER? : boolean;

  JWT_SECRET : string;

  APP_TIMEZONE: string;

  APP_DEFAULT_CHECK_IN_TIME?: string;
  APP_DEFAULT_CHECK_OUT_TIME?: string;

  STAFF_NOTIFICATION_RECIPIENTS?: string;

  FRONTEND_URL: string;
  CORS_ALLOWED_ORIGINS?: string;
  PAYWAY_TOKEN?: string;
  PAYWAY_BUTTON_URL?: string;
  PAYWAY_RETAILER_OWNER?: string;
  PAYWAY_USER_OPERATION?: string;
  PAYWAY_ENCRYPTION_KEY?: string;
  PAYWAY_QUOTE_TOKEN_SECRET?: string;
  PAYWAY_CALLBACK_TOKEN_SECRET?: string;
  PAYWAY_DEV_CLIENT_IP_OVERRIDE?: string;
  EMAIL_BRAND_LOGO_URL?: string;
  EMAIL_SUPPORT_EMAIL?: string;
  EMAIL_ADMIN_DASHBOARD_PATH?: string;
  EMAIL_LOGIN_PATH?: string;
  EMAIL_PASSWORD_SETUP_PATH?: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_NAME?: string;
  EMAIL_DRIVER?: "smtp" | "console";
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  PASSWORD_ACCESS_TOKEN_TTL_MINUTES?: number;
}
