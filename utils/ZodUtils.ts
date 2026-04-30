import z from "zod";

function parseLocalDateOnly(input: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);

  if (!match) {
    return new Date(input);
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export const utcDateOnly = z
  .union([z.string(), z.date()])
  .transform((val) => {
    const date = val instanceof Date ? val : new Date(val);
    return new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    ));
  });

export const localDateOnly = z
  .union([z.string(), z.date()])
  .transform((val) => {
    const date = val instanceof Date ? val : parseLocalDateOnly(val);

    if (Number.isNaN(date.getTime())) {
      return date;
    }

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
  });
