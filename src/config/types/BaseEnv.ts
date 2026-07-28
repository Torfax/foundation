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

  /** Días de gracia tras start_datetime para permitir reprogramar (default 3). */
  RESERVATION_RESCHEDULE_GRACE_DAYS?: number;
  /** Máximo de reprogramaciones reales por reserva (default 2). */
  RESERVATION_MAX_RESCHEDULES?: number;

  /** Integration Jobs: segundos de vigencia de un claim antes de poder reciclarse (default 120). */
  INTEGRATION_CLAIM_TTL_SECONDS?: number;
  /** Integration Jobs: base de backoff (segundos) para reintentos tras fallo (default 30). */
  INTEGRATION_RETRY_BACKOFF_SECONDS?: number;
  /** Integration Jobs: timeout por defecto de callAndWait en ms (default 8000). */
  INTEGRATION_CALLANDWAIT_DEFAULT_TIMEOUT_MS?: number;
  /** Integration Jobs: intervalo de sondeo a DB de callAndWait en ms (default 250). */
  INTEGRATION_CALLANDWAIT_POLL_INTERVAL_MS?: number;
  /** Integration Jobs: throttle de actualización de last_seen_at del agente en segundos (default 30). */
  INTEGRATION_AGENT_LAST_SEEN_THROTTLE_SECONDS?: number;
}
