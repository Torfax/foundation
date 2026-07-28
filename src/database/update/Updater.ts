import { CriteriaTranslatorPort } from "../reader/criteria/CriteriaTranslatorPort";
import { ReadCriteria } from "../reader/criteria/ReadCriteria";
import { Reader } from "../reader/Reader";
import { ReadDataSourcePort } from "../reader/ReadDataSourcePort";
import { UpdateConfig } from "./UpdateConfig";
import { UpdateDataSourcePort } from "./UpdateDataSourcePort";
import { buildUpdatePatch, filterUpdatePatch } from "./buildUpdatePatch";
import {
  ComparedUpdateOptions,
  ComparedUpdateResult,
  DirectUpdateOptions,
  DirectUpdateResult,
  UpdateEntityId,
} from "./UpdateTypes";

export class Updater<Q, E extends object> {
  private readonly reader: Reader<Q, E>;

  constructor(
    private readonly translator: CriteriaTranslatorPort<Q>,
    readRepository: ReadDataSourcePort<Q, E>,
    private readonly updateRepository: UpdateDataSourcePort<Q, E>
  ) {
    this.reader = new Reader(translator, readRepository);
  }

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
    id: UpdateEntityId,
    patch: Partial<E>,
    options: DirectUpdateOptions<E, C>
  ): Promise<DirectUpdateResult<E>> {
    const filtered = filterUpdatePatch(patch, options);

    if (!Object.keys(filtered.updateData).length) {
      return filtered;
    }

    const result = await this.updateRepository.updateById(id, filtered.updateData, {
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
    const result = await this.updateRepository.updateByCriteria(query, filtered.updateData, {
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
    const result = await this.updateRepository.updateMany(query, filtered.updateData, {
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
    id: UpdateEntityId,
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

    const result = await this.updateRepository.updateById(id, consolidated.updateData, {
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
}
