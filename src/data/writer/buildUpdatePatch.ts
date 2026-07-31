import { BadRequestException } from "../../exceptions/HttpException";
import { UpdateConfig } from "./UpdateConfig";
import {
  BuildUpdatePatchOptions,
  ConsolidatedUpdate,
  DirectUpdateResult,
} from "./WriteTypes";

function hasOwn(input: object, field: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(input, field);
}

function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

function areValuesEqual<E extends object>(
  field: keyof E,
  currentValue: unknown,
  nextValue: unknown,
  comparators?: BuildUpdatePatchOptions<
    E,
    UpdateConfig<E, readonly (keyof E & string)[]>
  >["comparators"]
): boolean {
  const comparator = comparators?.[field];
  if (comparator) {
    return comparator(currentValue as E[keyof E], nextValue as E[keyof E]);
  }

  if (isDate(currentValue) && isDate(nextValue)) {
    return currentValue.getTime() === nextValue.getTime();
  }

  return Object.is(currentValue, nextValue);
}

function ensureConfigFields<E extends object>(
  config: UpdateConfig<E, readonly (keyof E & string)[]>
): void {
  if (!config.fields.length) {
    throw new BadRequestException(
      "Update config must define at least one allowed field."
    );
  }
}

function ensurePatchObject(input: unknown): asserts input is Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new BadRequestException("Update patch must be a valid object.");
  }
}

export function filterUpdatePatch<
  E extends object,
  C extends UpdateConfig<E, readonly (keyof E & string)[]>
>(
  input: Partial<E>,
  options: {
    config: C;
    strict?: boolean;
  }
): DirectUpdateResult<E> {
  ensurePatchObject(input);
  ensureConfigFields(options.config);

  const strict = options.strict ?? true;
  const allowedFields = new Set<string>(options.config.fields);
  const updateData: Partial<E> = {};

  for (const [field, value] of Object.entries(input)) {
    if (!allowedFields.has(field)) {
      if (strict) {
        throw new BadRequestException(
          `Field "${field}" is not allowed for this update operation.`
        );
      }
      continue;
    }

    if (value === undefined) {
      continue;
    }

    (updateData as Record<string, unknown>)[field] = value;
  }

  return {
    updateData,
    affected: Object.keys(updateData).length ? undefined : 0,
    updated: false,
  };
}

export function buildUpdatePatch<
  E extends object,
  C extends UpdateConfig<E, readonly (keyof E & string)[]>
>(
  current: E,
  input: Partial<E>,
  config: C,
  options?: Omit<BuildUpdatePatchOptions<E, C>, "config">
): ConsolidatedUpdate<E> {
  ensurePatchObject(input);
  ensureConfigFields(config);

  const strict = options?.strict ?? true;
  const allowedFields = new Set<string>(config.fields);
  const updateData: Partial<E> = {};
  const changes: ConsolidatedUpdate<E>["changes"] = {};
  const unchangedFields: (keyof E)[] = [];

  for (const [field, value] of Object.entries(input)) {
    if (!allowedFields.has(field)) {
      if (strict) {
        throw new BadRequestException(
          `Field "${field}" is not allowed for this update operation.`
        );
      }
    }
  }

  for (const field of config.fields) {
    if (!hasOwn(input, field)) {
      continue;
    }

    const nextValue = (input as Record<string, unknown>)[field];
    if (nextValue === undefined) {
      continue;
    }

    const entityField = field as keyof E;
    const currentValue = current[entityField];

    if (areValuesEqual(entityField, currentValue, nextValue, options?.comparators)) {
      unchangedFields.push(entityField);
      continue;
    }

    updateData[entityField] = nextValue as E[keyof E];
    changes[entityField] = [currentValue, nextValue];
  }

  return {
    updateData,
    changes,
    hasChanges: Object.keys(updateData).length > 0,
    unchangedFields,
  };
}
