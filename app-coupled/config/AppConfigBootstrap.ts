import { ConfigService } from "./ConfigService";
import BaseEnv from "./types/BaseEnv";
import { resolveEmailDriverMode } from "@src/modules/email/config/EmailDriverMode";

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value: string | undefined): boolean {
  if (!hasValue(value)) return false;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
}

function isValidUrl(value: string | undefined): boolean {
  if (!hasValue(value)) return false;

  try {
    new URL(String(value));
    return true;
  } catch {
    return false;
  }
}

function isValidTimezone(value: string | undefined): boolean {
  if (!hasValue(value)) return false;

  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export class AppConfigBootstrap {
  static validateOrThrow(configService: ConfigService<BaseEnv>): void {
    const env = configService.dump();
    const missing = new Set<string>();
    const invalid = new Set<string>();

    const requireKey = (key: string): void => {
      if (!hasValue(env[key])) {
        missing.add(key);
      }
    };

    const validatePositiveInteger = (key: string, message: string): void => {
      if (hasValue(env[key]) && !isPositiveInteger(env[key])) {
        invalid.add(`${key} ${message}`);
      }
    };

    requireKey("NODE_ENV");
    requireKey("PORT");
    requireKey("DB_TYPE");
    requireKey("JWT_SECRET");
    requireKey("FRONTEND_URL");
    requireKey("APP_TIMEZONE");
    requireKey("PAYWAY_BUTTON_URL");
    requireKey("PAYWAY_TOKEN");
    requireKey("PAYWAY_RETAILER_OWNER");
    requireKey("PAYWAY_USER_OPERATION");
    requireKey("PAYWAY_ENCRYPTION_KEY");
    requireKey("PAYWAY_QUOTE_TOKEN_SECRET");
    requireKey("PAYWAY_CALLBACK_TOKEN_SECRET");

    if (hasValue(env.NODE_ENV)) {
      const normalizedNodeEnv = String(env.NODE_ENV).trim().toLowerCase();
      const normalizedEmailDriver = String(env.EMAIL_DRIVER || "").trim().toLowerCase();
      const hasSmtpConfig =
        hasValue(env.SMTP_HOST) &&
        hasValue(env.SMTP_PORT) &&
        hasValue(env.SMTP_USER) &&
        hasValue(env.SMTP_PASSWORD) &&
        hasValue(env.EMAIL_FROM);
      const allowedNodeEnvs = new Set([
        "development",
        "dev",
        "test",
        "testing",
        "production",
      ]);

      if (!allowedNodeEnvs.has(normalizedNodeEnv)) {
        invalid.add(
          'NODE_ENV must be one of: development, dev, test, testing, production',
        );
      }

      if (
        normalizedEmailDriver.length > 0 &&
        normalizedEmailDriver !== "smtp" &&
        normalizedEmailDriver !== "console"
      ) {
        invalid.add('EMAIL_DRIVER must be either "smtp" or "console"');
      }

      const emailDriverMode = resolveEmailDriverMode({
        nodeEnv: normalizedNodeEnv,
        configuredDriver: env.EMAIL_DRIVER,
        hasSmtpConfig,
      });

      if (normalizedNodeEnv === "production" && emailDriverMode !== "smtp") {
        invalid.add('EMAIL_DRIVER must resolve to "smtp" in production');
      }

      if (emailDriverMode === "smtp") {
        requireKey("SMTP_HOST");
        requireKey("SMTP_PORT");
        requireKey("SMTP_USER");
        requireKey("SMTP_PASSWORD");
        requireKey("EMAIL_FROM");
      }
    }

    if (hasValue(env.PORT) && !isPositiveInteger(env.PORT)) {
      invalid.add("PORT must be a positive integer");
    }

    if (hasValue(env.PASSWORD_ACCESS_TOKEN_TTL_MINUTES) && !isPositiveInteger(env.PASSWORD_ACCESS_TOKEN_TTL_MINUTES)) {
      invalid.add("PASSWORD_ACCESS_TOKEN_TTL_MINUTES must be a positive integer");
    }

    if (hasValue(env.JWT_SECRET) && String(env.JWT_SECRET).trim().length < 16) {
      invalid.add("JWT_SECRET must be at least 16 characters long");
    }

    if (hasValue(env.FRONTEND_URL) && !isValidUrl(env.FRONTEND_URL)) {
      invalid.add("FRONTEND_URL must be a valid URL");
    }

    if (hasValue(env.APP_TIMEZONE) && !isValidTimezone(env.APP_TIMEZONE)) {
      invalid.add("APP_TIMEZONE must be a valid IANA timezone");
    }

    if (hasValue(env.PAYWAY_BUTTON_URL) && !isValidUrl(env.PAYWAY_BUTTON_URL)) {
      invalid.add("PAYWAY_BUTTON_URL must be a valid URL");
    }

    if (hasValue(env.DB_TYPE)) {
      const normalizedDbType = String(env.DB_TYPE).trim().toLowerCase();
      const allowedDbTypes = new Set(["mysql", "postgres", "sqlite", "mariadb"]);

      if (!allowedDbTypes.has(normalizedDbType)) {
        invalid.add('DB_TYPE must be one of: mysql, postgres, sqlite, mariadb');
      } else if (normalizedDbType === "sqlite") {
        requireKey("DATABASE_PATH");
      } else {
        requireKey("DB_HOST");
        requireKey("DB_PORT");
        requireKey("DB_USER");
        requireKey("DB_NAME");
        requireKey("DB_PASSWORD");
        validatePositiveInteger("DB_PORT", "must be a positive integer");
      }
    }

    validatePositiveInteger("SMTP_PORT", "must be a positive integer");

    if (missing.size === 0 && invalid.size === 0) {
      return;
    }

    const parts: string[] = [];

    if (missing.size > 0) {
      parts.push(
        [
          "Missing required environment variables:",
          ...Array.from(missing).map((key) => `- ${key}`),
        ].join("\n"),
      );
    }

    if (invalid.size > 0) {
      parts.push(
        [
          "Invalid environment variables:",
          ...Array.from(invalid).map((message) => `- ${message}`),
        ].join("\n"),
      );
    }

    throw new Error(parts.join("\n\n"));
  }
}
