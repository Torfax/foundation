import { BadRequestException } from "@src/core/exceptions/HttpException";

import {
  CriteriaNode,
  isCriteriaGroup,
  isCriteriaLeaf,
  leafNodeToFilterCriteria,
} from "./CriteriaFilterTree";
import { FilterCriteria } from "./FilterCriteria";

const DNF_ERR = "Too many OR combinations";

/**
 * Expands a logical filter tree to DNF: an array of AND-conjunctions (each conjunction is a list of leaves).
 * After each cartesian product step, checks size against maxClauses to avoid memory blow-up.
 */
export function expandFilterTreeToDnf<F extends string>(
  root: CriteriaNode<F>,
  maxClauses: number
): FilterCriteria<F>[][] {
  return expandNode(root, maxClauses);
}

function expandNode<F extends string>(
  node: CriteriaNode<F>,
  maxClauses: number
): FilterCriteria<F>[][] {
  if (isCriteriaLeaf(node)) {
    return [[leafNodeToFilterCriteria(node)]];
  }

  if (!isCriteriaGroup(node)) {
    throw new BadRequestException("Invalid filter tree node");
  }

  const { op, nodes } = node;

  if (op === "or") {
    if (nodes.length === 0) {
      throw new BadRequestException("Invalid filter tree: empty OR group");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let acc: FilterCriteria<any>[][] = [];
    for (const child of nodes) {
      const part = expandNode(child, maxClauses);
      const nextLen = acc.length + part.length;
      if (nextLen > maxClauses) {
        throw new BadRequestException(DNF_ERR);
      }
      acc = acc.concat(part);
    }
    return acc;
  }

  // AND: cartesian product of child DNFs
  if (nodes.length === 0) {
    return [[]];
  }

  let acc: FilterCriteria<F>[][] = [[]];

  for (const child of nodes) {
    const part = expandNode(child, maxClauses);
    if (part.length === 0) {
      throw new BadRequestException("Invalid filter tree: empty branch");
    }
    const next: FilterCriteria<F>[][] = [];
    for (const prefix of acc) {
      for (const clause of part) {
        next.push([...prefix, ...clause]);
        if (next.length > maxClauses) {
          throw new BadRequestException(DNF_ERR);
        }
      }
    }
    acc = next;
  }

  return acc;
}
