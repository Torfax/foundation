import { randomBytes } from "crypto";

/**
 * Genera un string aleatorio alfanumérico
 */
export function generateRandomString(length = 3): string {
  return randomBytes(length)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, length)
    .toLowerCase();
}