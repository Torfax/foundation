import z from "zod";


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