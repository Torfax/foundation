import dotenv from "dotenv";
import BaseEnv from "./types/BaseEnv";

dotenv.config();

export class ConfigService<T extends Record<string, any> = BaseEnv> {
  private readonly env: Record<string, string | undefined>;

  constructor(extraSchema?: Partial<T>) {
    this.env = {
      ...process.env,
      ...(extraSchema || {}),
    };
  }

  get<K extends keyof T>(key: K): T[K] | undefined;
  get<K extends keyof T>(key: K, defaultValue: T[K]): T[K];
  get(key: string): any;
  get(key: string, defaultValue: any): any;
  get(key: string, ...maybeDefault: any[]): any {
    const hasDefault = maybeDefault.length > 0;
    const defaultValue = hasDefault ? maybeDefault[0] : undefined;

    const value = this.env[key];

    if (value === undefined || value === null || value === "") {
      return hasDefault ? defaultValue : undefined;
    }

    return this.autoConvert(value);
  }

  getRequired<K extends keyof T>(key: K): T[K];
  getRequired(key: string): any;
  getRequired(key: string): any {
    const value = this.env[key];

    if (value === undefined || value === null || value === "") {
      throw new Error(`Config Error: missing environment variable "${String(key)}"`);
    }

    return this.autoConvert(value);
  }

  getStringArray(key: string, defaultValue?: string[]): string[] {
    const value = this.env[key];

    if (value === undefined || value === null || value === "") {
      if (defaultValue) return [...defaultValue];
      throw new Error(`Config Error: missing environment variable "${String(key)}"`);
    }

    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private autoConvert(value: string): any {
    const lower = value.toLowerCase();

    if (lower === "true" || lower === "false") return lower === "true";

    if (!isNaN(Number(value)) && value.trim() !== "") return Number(value);

    if (
      (value.startsWith("{") && value.endsWith("}")) ||
      (value.startsWith("[") && value.endsWith("]"))
    ) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    return value;
  }

  dump(): Record<string, string | undefined> {
    return this.env;
  }
}
