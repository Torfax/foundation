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

  // --- Sobrecarga 1: claves conocidas (autocompletado + tipo fuerte)
  get<K extends keyof T>(key: K, defaultValue?: T[K]): T[K];

  // --- Sobrecarga 2: claves no tipadas (retorna string | any)
  get(key: string, defaultValue?: any): any;

  // --- Implementación real (una sola)
  get(key: string, ...maybeDefault: any[]): any {
    const hasDefault = maybeDefault.length > 0;
    const defaultValue = hasDefault ? maybeDefault[0] : undefined;

    const value = this.env[key];

    if (value === undefined || value === null || value === "") {
      if (hasDefault) return defaultValue;
      throw new Error(`Config Error: missing environment variable "${String(key)}"`);
    }

    return this.autoConvert(value);
  }


  /**
   * Convierte automáticamente valores string a boolean, number o JSON.
   */
  private autoConvert(value: string): any {
    const lower = value.toLowerCase();

    // Boolean
    if (lower === "true" || lower === "false") return lower === "true";

    // Number
    if (!isNaN(Number(value)) && value.trim() !== "") return Number(value);

    // JSON
    if ((value.startsWith("{") && value.endsWith("}")) ||
      (value.startsWith("[") && value.endsWith("]"))) {
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

/* const configService = new ConfigService<BaseEnv>();
export default configService; */