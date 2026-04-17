import {
  Between,
  FindManyOptions,
  ILike,
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
} from "typeorm";
import { inspect } from "util";

import { CriteriaTranslatorPort } from "../../reader/criteria/CriteriaTranslatorPort";
import {
  collectLeavesFromFilterTree,
  CriteriaNode,
  filtersToFilterTree,
  leafNodeToFilterCriteria,
} from "../../reader/criteria/CriteriaFilterTree";
import { expandFilterTreeToDnf } from "../../reader/criteria/criteriaDnf";
import { mergeConjunctionLeaves } from "../../reader/criteria/criteriaFieldMerge";
import {
  DEFAULT_MAX_DNF_CLAUSES,
  ReadCriteria,
  ReadRelations,
} from "../../reader/criteria/ReadCriteria";
import { FilterCriteria } from "../../reader/criteria/FilterCriteria";

export class TypeOrmCriteriaTranslator<T> implements CriteriaTranslatorPort<
  FindManyOptions<T>
> {
  private isSearchDebugEnabled(): boolean {
    return process.env.SEARCH_DEBUG === "1";
  }

  translate(criteria: ReadCriteria<keyof T & string>): FindManyOptions<T> {
    const options: FindManyOptions<T> = {};

    const maxDnf = criteria.maxDNFClauses ?? DEFAULT_MAX_DNF_CLAUSES;

    let ast: CriteriaNode<keyof T & string> | undefined;
    if (criteria.filterTree) {
      ast = criteria.filterTree;
    } else if (criteria.filters?.length) {
      ast = filtersToFilterTree(criteria.filters);
    }

    const leaves = ast
      ? collectLeavesFromFilterTree(ast).map(leafNodeToFilterCriteria)
      : [];

    const inferredRelationsFromFilters = ast
      ? this.inferRelationsFromFilters(leaves)
      : undefined;

    const shouldDebugSearchCriteria =
      this.isSearchDebugEnabled() &&
      leaves.some((leaf) => {
        const field = String(leaf.field);
        return (
          field === "capacityPolicy" ||
          field === "capacityMax" ||
          field === "resourceType.code"
        );
      });

    if (shouldDebugSearchCriteria) {
      console.log(
        "[search.debug] translator criteria",
        inspect(criteria, { depth: 8 }),
      );
      console.log(
        "[search.debug] translator leaves",
        inspect(leaves, { depth: 8 }),
      );
    }

    const normalizedExplicitRelations = criteria.relations
      ? this.normalizeRelations(criteria.relations)
      : undefined;

    const mergedRelations = this.deepMerge(
      this.deepClone(normalizedExplicitRelations),
      inferredRelationsFromFilters,
    );

    if (mergedRelations && Object.keys(mergedRelations).length) {
      (options as any).relations = mergedRelations;
    }

    if (ast) {
      const dnf = expandFilterTreeToDnf(ast, maxDnf);
      if (!dnf.some((conj) => conj.length === 0)) {
        const mergedClauses = dnf.map((conj) => mergeConjunctionLeaves(conj));
        const wheres = mergedClauses.map((leaves) =>
          this.buildWhereFromLeaves(leaves),
        );
        options.where = wheres.length === 1 ? wheres[0] : wheres;
      }
    }

    if (criteria.sort?.length) {
      options.order = this.buildOrder(criteria.sort);
    }

    if (criteria.pagination) {
      options.skip = (criteria.pagination.page - 1) * criteria.pagination.limit;

      options.take = criteria.pagination.limit;
    }

    if (shouldDebugSearchCriteria) {
      console.log(
        "[search.debug] translator options.where",
        inspect(options.where, { depth: 8 }),
      );
      console.log(
        "[search.debug] translator options.order",
        inspect(options.order, { depth: 8 }),
      );
      console.log("[search.debug] translator options.pagination", {
        skip: options.skip,
        take: options.take,
      });
    }

    return options;
  }

  private buildWhereFromLeaves(
    filters: FilterCriteria<keyof T & string>[],
  ): any {
    const where: any = {};

    for (const f of filters) {
      const leafValue = this.buildLeafValue(f);

      const field = String(f.field);
      if (field.includes(".")) {
        const path = field.split(".").filter(Boolean);
        if (path.length >= 2) {
          const nested = this.buildNestedObject(path, leafValue);
          this.deepMerge(where, nested);
          continue;
        }
      }

      switch (f.operator) {
        case "eq":
          where[f.field] = f.value;
          break;

        case "neq":
          where[f.field] = Not(f.value);
          break;

        case "gt":
          where[f.field] = MoreThan(f.value);
          break;

        case "lt":
          where[f.field] = LessThan(f.value);
          break;

        case "gte":
          where[f.field] = MoreThanOrEqual(f.value);
          break;

        case "lte":
          where[f.field] = LessThanOrEqual(f.value);
          break;

        case "contains":
          where[f.field] = ILike(`%${f.value}%`);
          break;

        case "startsWith":
          where[f.field] = ILike(`${f.value}%`);
          break;

        case "endsWith":
          where[f.field] = ILike(`%${f.value}`);
          break;

        case "like":
          where[f.field] = ILike(f.value);
          break;

        case "notLike":
          where[f.field] = Not(ILike(f.value));
          break;

        case "in":
          where[f.field] = In(Array.isArray(f.value) ? f.value : [f.value]);
          break;

        case "notIn":
          where[f.field] = Not(
            In(Array.isArray(f.value) ? f.value : [f.value]),
          );
          break;

        case "between":
          where[f.field] = Between(f.value[0], f.value[1]);
          break;

        case "isNull":
          where[f.field] = IsNull();
          break;

        case "notNull":
          where[f.field] = Not(IsNull());
          break;

        default:
          where[f.field] = f.value;
      }
    }

    return where;
  }

  private buildLeafValue(f: FilterCriteria<keyof T & string>): any {
    switch (f.operator) {
      case "eq":
        return f.value;
      case "neq":
        return Not(f.value);
      case "gt":
        return MoreThan(f.value);
      case "lt":
        return LessThan(f.value);
      case "gte":
        return MoreThanOrEqual(f.value);
      case "lte":
        return LessThanOrEqual(f.value);
      case "contains":
        return ILike(`%${f.value}%`);
      case "startsWith":
        return ILike(`${f.value}%`);
      case "endsWith":
        return ILike(`%${f.value}`);
      case "like":
        return ILike(f.value);
      case "notLike":
        return Not(ILike(f.value));
      case "in":
        return In(Array.isArray(f.value) ? f.value : [f.value]);
      case "notIn":
        return Not(In(Array.isArray(f.value) ? f.value : [f.value]));
      case "between":
        return Between(f.value[0], f.value[1]);
      case "isNull":
        return IsNull();
      case "notNull":
        return Not(IsNull());
      default:
        return f.value;
    }
  }

  private inferRelationsFromFilters(
    filters: FilterCriteria<keyof T & string>[],
  ): Record<string, any> | undefined {
    let result: Record<string, any> | undefined = undefined;

    for (const f of filters) {
      const field = String(f.field);
      if (!field.includes(".")) continue;

      const parts = field.split(".").filter(Boolean);
      if (parts.length < 2) continue;

      const relationParts = parts.slice(0, -1);
      const relObj = this.buildRelationsObject(relationParts);

      result = result ? this.deepMerge(result, relObj) : relObj;
    }

    return result;
  }

  private normalizeRelations(relations: ReadRelations): Record<string, any> {
    if (Array.isArray(relations)) {
      let out: Record<string, any> = {};
      for (const r of relations) {
        const parts = String(r).split(".").filter(Boolean);
        if (!parts.length) continue;
        out = this.deepMerge(out, this.buildRelationsObject(parts));
      }
      return out;
    }

    return relations ?? {};
  }

  private buildRelationsObject(parts: string[]): Record<string, any> {
    if (!parts.length) return {};
    return this.buildNestedObject(parts, true);
  }

  private buildNestedObject(
    parts: string[],
    leafValue: any,
  ): Record<string, any> {
    const root: Record<string, any> = {};
    let cursor: any = root;

    for (let i = 0; i < parts.length; i++) {
      const key = parts[i];
      const isLeaf = i === parts.length - 1;

      if (isLeaf) {
        cursor[key] = leafValue;
      } else {
        if (!cursor[key] || typeof cursor[key] !== "object") {
          cursor[key] = {};
        }
        cursor = cursor[key];
      }
    }

    return root;
  }

  private deepMerge(target: any, source: any): any {
    if (!source || typeof source !== "object") return target;
    if (!target || typeof target !== "object") return source;

    for (const key of Object.keys(source)) {
      const srcVal = source[key];
      const tgtVal = target[key];

      if (
        srcVal &&
        typeof srcVal === "object" &&
        !Array.isArray(srcVal) &&
        tgtVal &&
        typeof tgtVal === "object" &&
        !Array.isArray(tgtVal)
      ) {
        target[key] = this.deepMerge(tgtVal, srcVal);
      } else {
        target[key] = srcVal;
      }
    }

    return target;
  }

  private deepClone<TVal>(val: TVal): TVal {
    if (!val || typeof val !== "object") return val;
    if (Array.isArray(val)) return val.map((v) => this.deepClone(v)) as any;
    const out: any = {};
    for (const k of Object.keys(val as any)) {
      out[k] = this.deepClone((val as any)[k]);
    }
    return out;
  }

  private buildOrder(sort: ReadCriteria["sort"]): any {
    const order: any = {};

    for (const s of sort ?? []) {
      order[s.field] = s.direction;
    }

    return order;
  }
}
