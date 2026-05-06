import z from "zod";

const dateOnlyRegex = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidDateOnlyString(value: string): boolean {
  const match = dateOnlyRegex.exec(value);

  if (!match) return false;

  const [, yearRaw, monthRaw, dayRaw] = match;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const dateOnlyStringSchema = z
  .string()
  .regex(dateOnlyRegex, "Formato de fecha inválido (YYYY-MM-DD)")
  .refine(isValidDateOnlyString, "Fecha calendario inválida");
