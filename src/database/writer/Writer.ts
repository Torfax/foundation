import { CriteriaTranslatorPort } from "../reader/criteria/CriteriaTranslatorPort";
import { ReadCriteria } from "../reader/criteria/ReadCriteria";
import { Reader } from "../reader/Reader";
import { ReadDataSourcePort } from "../reader/ReadDataSourcePort";
import { UpdateConfig } from "./UpdateConfig";
import { WriteDataSourcePort } from "./WriteDataSourcePort";
import { buildUpdatePatch, filterUpdatePatch } from "./buildUpdatePatch";
import {
  ComparedUpdateOptions,
  ComparedUpdateResult,
  DirectUpdateOptions,
  DirectUpdateResult,
  WriteEntityId,
  WriteExecutionOptions,
  WriteOperationResult,
} from "./WriteTypes";

export class Writer<Q, E extends object> {
  private readonly reader: Reader<Q, E>;

  constructor(
    private readonly translator: CriteriaTranslatorPort<Q>,
    readRepository: ReadDataSourcePort<Q, E>,
    private readonly writeRepository: WriteDataSourcePort<Q, E>
  ) {
    this.reader = new Reader(translator, readRepository);
  }

  // --------------------
  // Create
  // --------------------

  async create(
    data: Partial<E>,
    options?: WriteExecutionOptions
  ): Promise<E> {
    return this.writeRepository.create(data, options);
  }

  async createMany(
    data: Partial<E>[],
    options?: WriteExecutionOptions
  ): Promise<E[]> {
    return this.writeRepository.createMany(data, options);
  }

  // --------------------
  // Update
  // --------------------

  buildPatch<
    C extends UpdateConfig<E, readonly (keyof E & string)[]>
  >(
    current: E,
    patch: Partial<E>,
    options: ComparedUpdateOptions<E, C>
  ) {
    return buildUpdatePatch(current, patch, options.config, options);
  }

  async updateById<
    C extends UpdateConfig<E, readonly (keyof E & string)[]>
  >(
    id: WriteEntityId,
    patch: Partial<E>,
    options: DirectUpdateOptions<E, C>
  ): Promise<DirectUpdateResult<E>> {
    const filtered = filterUpdatePatch(patch, options);

    if (!Object.keys(filtered.updateData).length) {
      return filtered;
    }

    const result = await this.writeRepository.updateById(id, filtered.updateData, {
      manager: options.manager,
    });

    return {
      updateData: filtered.updateData,
      affected: result.affected,
      updated: (result.affected ?? 0) > 0,
    };
  }

  async updateByCriteria<
    C extends UpdateConfig<E, readonly (keyof E & string)[]>
  >(
    criteria: ReadCriteria<keyof E & string>,
    patch: Partial<E>,
    options: DirectUpdateOptions<E, C>
  ): Promise<DirectUpdateResult<E>> {
    const filtered = filterUpdatePatch(patch, options);

    if (!Object.keys(filtered.updateData).length) {
      return filtered;
    }

    const query = this.translator.translate(criteria);
    const result = await this.writeRepository.updateByCriteria(query, filtered.updateData, {
      manager: options.manager,
    });

    return {
      updateData: filtered.updateData,
      affected: result.affected,
      updated: (result.affected ?? 0) > 0,
    };
  }

  async updateMany<
    C extends UpdateConfig<E, readonly (keyof E & string)[]>
  >(
    criteria: ReadCriteria<keyof E & string>,
    patch: Partial<E>,
    options: DirectUpdateOptions<E, C>
  ): Promise<DirectUpdateResult<E>> {
    const filtered = filterUpdatePatch(patch, options);

    if (!Object.keys(filtered.updateData).length) {
      return filtered;
    }

    const query = this.translator.translate(criteria);
    const result = await this.writeRepository.updateMany(query, filtered.updateData, {
      manager: options.manager,
    });

    return {
      updateData: filtered.updateData,
      affected: result.affected,
      updated: (result.affected ?? 0) > 0,
    };
  }

  async updateByIdCompared<
    C extends UpdateConfig<E, readonly (keyof E & string)[]>
  >(
    id: WriteEntityId,
    patch: Partial<E>,
    options: ComparedUpdateOptions<E, C>
  ): Promise<ComparedUpdateResult<E>> {
    const entityBefore = await this.reader.getById(id);
    const consolidated = buildUpdatePatch(entityBefore, patch, options.config, options);

    if (!consolidated.hasChanges) {
      return {
        entityBefore,
        updateData: consolidated.updateData,
        changes: consolidated.changes,
        hasChanges: false,
        updated: false,
        affected: 0,
        skippedReason: "NO_CHANGES",
      };
    }

    const result = await this.writeRepository.updateById(id, consolidated.updateData, {
      manager: options.manager,
    });

    return {
      entityBefore,
      updateData: consolidated.updateData,
      changes: consolidated.changes,
      hasChanges: true,
      updated: (result.affected ?? 0) > 0,
      affected: result.affected,
    };
  }

  // --------------------
  // Delete
  // --------------------

  async deleteById(
    id: WriteEntityId,
    options?: WriteExecutionOptions
  ): Promise<WriteOperationResult> {
    return this.writeRepository.deleteById(id, options);
  }

  async deleteByCriteria(
    criteria: ReadCriteria<keyof E & string>,
    options?: WriteExecutionOptions
  ): Promise<WriteOperationResult> {
    const query = this.translator.translate(criteria);
    return this.writeRepository.deleteByCriteria(query, options);
  }
}
