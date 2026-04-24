import { CriteriaNode, filtersToFilterTree } from "./CriteriaFilterTree";
import { ReadCriteria, ReadRelations } from "./ReadCriteria";

export function criteriaToFilterTree<F extends string>(
  criteria?: Pick<ReadCriteria<F>, "filters" | "filterTree">,
): CriteriaNode<F> | undefined {
  if (criteria?.filterTree) {
    return criteria.filterTree;
  }

  if (criteria?.filters?.length) {
    return filtersToFilterTree(criteria.filters);
  }

  return undefined;
}

export function andCriteriaNodes<F extends string>(
  ...nodes: Array<CriteriaNode<F> | undefined>
): CriteriaNode<F> | undefined {
  const defined = nodes.filter((node): node is CriteriaNode<F> => Boolean(node));

  if (defined.length === 0) return undefined;
  if (defined.length === 1) return defined[0];

  return {
    kind: "group",
    op: "and",
    nodes: defined,
  };
}

function buildNestedObject(parts: string[], leafValue: any): Record<string, any> {
  const root: Record<string, any> = {};
  let cursor: any = root;

  for (let i = 0; i < parts.length; i += 1) {
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

function deepMerge(target: any, source: any): any {
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
      target[key] = deepMerge(tgtVal, srcVal);
    } else {
      target[key] = srcVal;
    }
  }

  return target;
}

export function normalizeReadRelations(
  relations?: ReadRelations,
): Record<string, any> | undefined {
  if (!relations) return undefined;

  if (Array.isArray(relations)) {
    let out: Record<string, any> = {};

    for (const relation of relations) {
      const parts = String(relation).split(".").filter(Boolean);
      if (!parts.length) continue;
      out = deepMerge(out, buildNestedObject(parts, true));
    }

    return out;
  }

  return relations;
}

export function mergeReadRelations(
  base?: ReadRelations,
  extra?: ReadRelations,
): Record<string, any> | undefined {
  const baseNormalized = normalizeReadRelations(base);
  const extraNormalized = normalizeReadRelations(extra);

  if (!baseNormalized) return extraNormalized;
  if (!extraNormalized) return baseNormalized;

  return deepMerge(baseNormalized, extraNormalized);
}

export function mergeReadCriteria<F extends string>(
  defaults?: ReadCriteria<F>,
  overrides?: ReadCriteria<F>,
): ReadCriteria<F> {
  const mergedFilterTree = andCriteriaNodes(
    criteriaToFilterTree(defaults),
    criteriaToFilterTree(overrides),
  );

  return {
    ...defaults,
    ...overrides,
    filters: undefined,
    filterTree: mergedFilterTree,
    relations: mergeReadRelations(defaults?.relations, overrides?.relations),
    select: overrides?.select ?? defaults?.select,
  };
}
