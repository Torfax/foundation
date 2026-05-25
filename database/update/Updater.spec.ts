import { describe, expect, it, vi } from "vitest";
import { createUpdateConfig } from "./UpdateConfig";
import { Updater } from "./Updater";
import { CriteriaTranslatorPort } from "../reader/criteria/CriteriaTranslatorPort";
import { ReadCriteria } from "../reader/criteria/ReadCriteria";
import { ReadDataSourcePort } from "../reader/ReadDataSourcePort";
import { UpdateDataSourcePort } from "./UpdateDataSourcePort";

type TestEntity = {
  id: number;
  name: string;
  isActive: boolean;
  amount: number;
};

type TestQuery = {
  where?: Record<string, unknown>;
};

const updateConfig = createUpdateConfig<TestEntity>()([
  "name",
  "isActive",
  "amount",
] as const);

function createUpdaterFixture(current?: TestEntity) {
  const translator: CriteriaTranslatorPort<TestQuery> = {
    translate: vi.fn((criteria: ReadCriteria) => ({
      where: { criteria },
    })),
  };

  const reader: ReadDataSourcePort<TestQuery, TestEntity> = {
    find: vi.fn(async () => []),
    findOne: vi.fn(async () => current ?? null),
    findAndCount: vi.fn(async () => [[], 0]),
    count: vi.fn(async () => 0),
    exists: vi.fn(async () => true),
  };

  const updaterPort: UpdateDataSourcePort<TestQuery, TestEntity> = {
    updateById: vi.fn(async () => ({ affected: 1 })),
    updateByCriteria: vi.fn(async () => ({ affected: 2 })),
    updateMany: vi.fn(async () => ({ affected: 3 })),
  };

  return {
    translator,
    reader,
    updaterPort,
    updater: new Updater(translator, reader, updaterPort),
  };
}

describe("Updater", () => {
  it("applies a direct patch by id", async () => {
    const fixture = createUpdaterFixture();

    const result = await fixture.updater.updateById(1, { name: "Beta" }, {
      config: updateConfig,
    });

    expect(fixture.updaterPort.updateById).toHaveBeenCalledWith(
      1,
      { name: "Beta" },
      { manager: undefined }
    );
    expect(result).toEqual({
      updateData: { name: "Beta" },
      affected: 1,
      updated: true,
    });
  });

  it("does not execute direct update when patch becomes empty", async () => {
    const fixture = createUpdaterFixture();

    const result = await fixture.updater.updateById(
      1,
      { name: undefined },
      { config: updateConfig }
    );

    expect(fixture.updaterPort.updateById).not.toHaveBeenCalled();
    expect(result).toEqual({
      updateData: {},
      affected: 0,
      updated: false,
    });
  });

  it("uses the translator for updateByCriteria", async () => {
    const fixture = createUpdaterFixture();
    const criteria: ReadCriteria<keyof TestEntity & string> = {
      filters: [{ field: "name", operator: "eq", value: "Alpha" }],
    };

    const result = await fixture.updater.updateByCriteria(
      criteria,
      { isActive: false },
      { config: updateConfig }
    );

    expect(fixture.translator.translate).toHaveBeenCalledWith(criteria);
    expect(fixture.updaterPort.updateByCriteria).toHaveBeenCalledWith(
      { where: { criteria } },
      { isActive: false },
      { manager: undefined }
    );
    expect(result.affected).toBe(2);
  });

  it("uses the translator for updateMany", async () => {
    const fixture = createUpdaterFixture();
    const criteria: ReadCriteria<keyof TestEntity & string> = {
      filters: [{ field: "amount", operator: "gt", value: 0 }],
    };

    const result = await fixture.updater.updateMany(criteria, { amount: 0 }, {
      config: updateConfig,
    });

    expect(fixture.translator.translate).toHaveBeenCalledWith(criteria);
    expect(fixture.updaterPort.updateMany).toHaveBeenCalledWith(
      { where: { criteria } },
      { amount: 0 },
      { manager: undefined }
    );
    expect(result.affected).toBe(3);
  });

  it("reads the entity before compared update", async () => {
    const current = { id: 1, name: "Alpha", isActive: true, amount: 5 };
    const fixture = createUpdaterFixture(current);

    await fixture.updater.updateByIdCompared(1, { name: "Beta" }, {
      config: updateConfig,
    });

    expect(fixture.reader.findOne).toHaveBeenCalled();
  });

  it("does not update when compared patch has no changes", async () => {
    const current = { id: 1, name: "Alpha", isActive: true, amount: 5 };
    const fixture = createUpdaterFixture(current);

    const result = await fixture.updater.updateByIdCompared(1, { name: "Alpha" }, {
      config: updateConfig,
    });

    expect(fixture.updaterPort.updateById).not.toHaveBeenCalled();
    expect(result).toEqual({
      entityBefore: current,
      updateData: {},
      changes: {},
      hasChanges: false,
      updated: false,
      affected: 0,
      skippedReason: "NO_CHANGES",
    });
  });

  it("updates only fields that really changed in compared mode", async () => {
    const current = { id: 1, name: "Alpha", isActive: true, amount: 5 };
    const fixture = createUpdaterFixture(current);

    const result = await fixture.updater.updateByIdCompared(
      1,
      { name: "Alpha", amount: 8 },
      { config: updateConfig }
    );

    expect(fixture.updaterPort.updateById).toHaveBeenCalledWith(
      1,
      { amount: 8 },
      { manager: undefined }
    );
    expect(result.updateData).toEqual({ amount: 8 });
    expect(result.changes).toEqual({ amount: [5, 8] });
    expect(result.hasChanges).toBe(true);
    expect(result.updated).toBe(true);
  });

  it("returns compared changes in [before, after] format", async () => {
    const current = { id: 1, name: "Alpha", isActive: true, amount: 5 };
    const fixture = createUpdaterFixture(current);

    const result = await fixture.updater.updateByIdCompared(
      1,
      { name: "Beta", isActive: false },
      { config: updateConfig }
    );

    expect(result.changes).toEqual({
      name: ["Alpha", "Beta"],
      isActive: [true, false],
    });
  });
});
