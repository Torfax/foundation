import { CriteriaFilterOperator } from "./CriteriaFilterOperator";
import { FilterCriteria } from "./FilterCriteria";

export type CriteriaLogicalOp = "and" | "or";

/** Leaf node in the logical filter AST (same shape as FilterCriteria + discriminator). */
export interface CriteriaLeafNode<F extends string = string> {
  kind: "leaf";
  field: F;
  operator: CriteriaFilterOperator;
  value?: any;
}

/** Group node: AND / OR of child nodes. */
export interface CriteriaGroupNode<F extends string = string> {
  kind: "group";
  op: CriteriaLogicalOp;
  nodes: CriteriaNode<F>[];
}

export type CriteriaNode<F extends string = string> =
  | CriteriaLeafNode<F>
  | CriteriaGroupNode<F>;

export function isCriteriaLeaf<F extends string>(
  n: CriteriaNode<F>
): n is CriteriaLeafNode<F> {
  return n.kind === "leaf";
}

export function isCriteriaGroup<F extends string>(
  n: CriteriaNode<F>
): n is CriteriaGroupNode<F> {
  return n.kind === "group";
}

/** Legacy flat filters => implicit AND of leaves. */
export function filtersToFilterTree<F extends string>(
  filters: FilterCriteria<F>[]
): CriteriaNode<F> {
  return {
    kind: "group",
    op: "and",
    nodes: filters.map((f) => ({
      kind: "leaf" as const,
      field: f.field,
      operator: f.operator,
      value: f.value,
    })),
  };
}

export function leafNodeToFilterCriteria<F extends string>(
  leaf: CriteriaLeafNode<F>
): FilterCriteria<F> {
  return {
    field: leaf.field,
    operator: leaf.operator,
    value: leaf.value,
  };
}

/** All leaf nodes in pre-order (for relation inference, etc.). */
export function collectLeavesFromFilterTree<F extends string>(
  root: CriteriaNode<F>
): CriteriaLeafNode<F>[] {
  const out: CriteriaLeafNode<F>[] = [];
  function walk(n: CriteriaNode<F>) {
    if (isCriteriaLeaf(n)) {
      out.push(n);
    } else {
      for (const c of n.nodes) {
        walk(c);
      }
    }
  }
  walk(root);
  return out;
}
