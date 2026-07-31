import { UpdateConfig } from "./UpdateConfig";

export type WriteEntityId = string | number | Number;

export type UpdateComparator<E extends object> = Partial<{
  [K in keyof E]: (oldValue: E[K], newValue: E[K]) => boolean;
}>;

export type UpdateChanges<E extends object> = Partial<
  Record<keyof E, [unknown, unknown]>
>;

export type ConsolidatedUpdate<E extends object> = {
  updateData: Partial<E>;
  changes: UpdateChanges<E>;
  hasChanges: boolean;
  unchangedFields: (keyof E)[];
};

export type UpdateValidationOptions<
  E extends object,
  C extends UpdateConfig<E, readonly (keyof E & string)[]>
> = {
  config: C;
  strict?: boolean;
};

export type BuildUpdatePatchOptions<
  E extends object,
  C extends UpdateConfig<E, readonly (keyof E & string)[]>
> = UpdateValidationOptions<E, C> & {
  comparators?: UpdateComparator<E>;
};

export type WriteExecutionOptions = {
  // Reserved for future execution flags. The transactional manager is no longer threaded
  // here — it is resolved ambiently via ExecutorContext / UnitOfWork (see ADR-0002).
};

export type DirectUpdateOptions<
  E extends object,
  C extends UpdateConfig<E, readonly (keyof E & string)[]>
> = UpdateValidationOptions<E, C> &
  WriteExecutionOptions;

export type ComparedUpdateOptions<
  E extends object,
  C extends UpdateConfig<E, readonly (keyof E & string)[]>
> = BuildUpdatePatchOptions<E, C> &
  WriteExecutionOptions;

export type DirectUpdateResult<E extends object> = {
  updateData: Partial<E>;
  affected?: number;
  updated: boolean;
};

export type ComparedUpdateResult<E extends object> = {
  entityBefore: E;
  updateData: Partial<E>;
  changes: UpdateChanges<E>;
  hasChanges: boolean;
  updated: boolean;
  affected?: number;
  skippedReason?: "NO_CHANGES";
};

export type WriteOperationResult = {
  affected?: number;
};
