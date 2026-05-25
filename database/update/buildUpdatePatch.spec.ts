import { describe, expect, expectTypeOf, it } from "vitest";
import {
  createUpdateConfig,
  UpdateDtoFromConfig,
} from "./UpdateConfig";
import { buildUpdatePatch, filterUpdatePatch } from "./buildUpdatePatch";

type TestEntity = {
  id: number;
  name: string;
  status: string | null;
  isActive: boolean;
  amount: number;
  note: string;
  startsAt: Date;
};

const updateConfig = createUpdateConfig<TestEntity>()([
  "name",
  "status",
  "isActive",
  "amount",
  "note",
  "startsAt",
] as const);

describe("buildUpdatePatch", () => {
  const current: TestEntity = {
    id: 1,
    name: "Alpha",
    status: "open",
    isActive: true,
    amount: 5,
    note: "hello",
    startsAt: new Date("2026-01-01T10:00:00.000Z"),
  };

  it("detects real changes", () => {
    const result = buildUpdatePatch(current, { name: "Beta" }, updateConfig);

    expect(result.updateData).toEqual({ name: "Beta" });
    expect(result.changes).toEqual({ name: ["Alpha", "Beta"] });
    expect(result.hasChanges).toBe(true);
    expect(result.unchangedFields).toEqual([]);
  });

  it("does not detect changes when values are equal", () => {
    const result = buildUpdatePatch(current, { name: "Alpha" }, updateConfig);

    expect(result.updateData).toEqual({});
    expect(result.changes).toEqual({});
    expect(result.hasChanges).toBe(false);
    expect(result.unchangedFields).toEqual(["name"]);
  });

  it("skips fields that were not sent", () => {
    const result = buildUpdatePatch(current, {}, updateConfig);

    expect(result.updateData).toEqual({});
    expect(result.hasChanges).toBe(false);
  });

  it("skips fields explicitly sent as undefined", () => {
    const result = buildUpdatePatch(current, { name: undefined }, updateConfig);

    expect(result.updateData).toEqual({});
    expect(result.hasChanges).toBe(false);
  });

  it("updates fields explicitly sent as null", () => {
    const result = buildUpdatePatch(current, { status: null }, updateConfig);

    expect(result.updateData).toEqual({ status: null });
    expect(result.changes).toEqual({ status: ["open", null] });
    expect(result.hasChanges).toBe(true);
  });

  it("accepts false as a valid value", () => {
    const result = buildUpdatePatch(current, { isActive: false }, updateConfig);

    expect(result.updateData).toEqual({ isActive: false });
    expect(result.changes).toEqual({ isActive: [true, false] });
  });

  it("accepts 0 as a valid value", () => {
    const result = buildUpdatePatch(current, { amount: 0 }, updateConfig);

    expect(result.updateData).toEqual({ amount: 0 });
    expect(result.changes).toEqual({ amount: [5, 0] });
  });

  it("accepts empty string as a valid value", () => {
    const result = buildUpdatePatch(current, { note: "" }, updateConfig);

    expect(result.updateData).toEqual({ note: "" });
    expect(result.changes).toEqual({ note: ["hello", ""] });
  });

  it("compares Date values by time", () => {
    const result = buildUpdatePatch(
      current,
      { startsAt: new Date("2026-01-01T10:00:00.000Z") },
      updateConfig
    );

    expect(result.updateData).toEqual({});
    expect(result.hasChanges).toBe(false);
    expect(result.unchangedFields).toEqual(["startsAt"]);
  });

  it("rejects non-allowed fields in strict mode", () => {
    expect(() =>
      buildUpdatePatch(current, { id: 2 } as Partial<TestEntity>, updateConfig)
    ).toThrow('Field "id" is not allowed for this update operation.');
  });

  it("ignores non-allowed fields when strict is false", () => {
    const result = buildUpdatePatch(
      current,
      { id: 2, name: "Beta" } as Partial<TestEntity>,
      updateConfig,
      { strict: false }
    );

    expect(result.updateData).toEqual({ name: "Beta" });
    expect(result.changes).toEqual({ name: ["Alpha", "Beta"] });
  });
});

describe("filterUpdatePatch", () => {
  it("filters direct update patches", () => {
    const result = filterUpdatePatch<TestEntity, typeof updateConfig>(
      { name: "Beta", note: undefined },
      { config: updateConfig }
    );

    expect(result.updateData).toEqual({ name: "Beta" });
  });
});

describe("createUpdateConfig", () => {
  it("derives a typed DTO from config", () => {
    type TestUpdateDto = UpdateDtoFromConfig<TestEntity, typeof updateConfig>;

    expectTypeOf<TestUpdateDto>().toEqualTypeOf<{
      name?: string;
      status?: string | null;
      isActive?: boolean;
      amount?: number;
      note?: string;
      startsAt?: Date;
    }>();
  });
});
