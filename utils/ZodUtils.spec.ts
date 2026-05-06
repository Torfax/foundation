import { describe, expect, it } from "vitest";
import { dateOnlyStringSchema } from "./ZodUtils";

describe("dateOnlyStringSchema", () => {
  it("accepts valid date-only strings", () => {
    expect(dateOnlyStringSchema.parse("2026-06-15")).toBe("2026-06-15");
    expect(dateOnlyStringSchema.parse("2028-02-29")).toBe("2028-02-29");
  });

  it("rejects invalid calendar dates without rollover", () => {
    expect(() => dateOnlyStringSchema.parse("2026-06-31")).toThrow();
    expect(() => dateOnlyStringSchema.parse("2026-02-29")).toThrow();
  });
});
