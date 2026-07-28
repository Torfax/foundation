import { BadRequestException } from "@src/core/exceptions/HttpException";

import { CriteriaFilterOperator } from "./CriteriaFilterOperator";
import { FilterCriteria } from "./FilterCriteria";

const CONFLICT = (field: string) =>
  `Conflicting filter constraints for field "${field}"`;

type FieldState<F extends string> =
  | { tag: "eq"; value: any }
  | { tag: "in"; values: Set<any> }
  | { tag: "notIn"; values: Set<any> }
  | { tag: "between"; lo: any; hi: any }
  | {
      tag: "interval";
      lo: any | null;
      loExclusive: boolean;
      hi: any | null;
      hiExclusive: boolean;
    }
  | { tag: "isNull" }
  | { tag: "notNull" }
  | {
      tag: "pattern";
      op: CriteriaFilterOperator;
      value: string;
    };

/**
 * Merges all leaf filters on the same field within one AND conjunction.
 * Throws BadRequestException on unsatisfiable combinations.
 */
export function mergeLeavesForSameField<F extends string>(
  field: F,
  leaves: FilterCriteria<F>[]
): FilterCriteria<F> {
  if (leaves.length === 0) {
    throw new BadRequestException(`Empty conjunction for field "${field}"`);
  }
  if (leaves.length === 1) {
    return leaves[0];
  }

  let state = leafToState(field, leaves[0]);
  for (let i = 1; i < leaves.length; i++) {
    state = mergeTwoStates(field, state, leafToState(field, leaves[i]));
  }
  return stateToFilterCriteria(field, state);
}

export function groupLeavesByField<F extends string>(
  leaves: FilterCriteria<F>[]
): Map<F, FilterCriteria<F>[]> {
  const map = new Map<F, FilterCriteria<F>[]>();
  for (const leaf of leaves) {
    const list = map.get(leaf.field) ?? [];
    list.push(leaf);
    map.set(leaf.field, list);
  }
  return map;
}

/** Merge duplicate fields inside one AND conjunction. */
export function mergeConjunctionLeaves<F extends string>(
  leaves: FilterCriteria<F>[]
): FilterCriteria<F>[] {
  const map = groupLeavesByField(leaves);
  const out: FilterCriteria<F>[] = [];
  for (const [field, list] of map) {
    out.push(mergeLeavesForSameField(field, list));
  }
  return out;
}

function leafToState<F extends string>(
  field: F,
  leaf: FilterCriteria<F>
): FieldState<F> {
  if (leaf.field !== field) {
    throw new BadRequestException(CONFLICT(field));
  }

  switch (leaf.operator) {
    case "eq":
      return { tag: "eq", value: leaf.value };
    case "neq":
      return { tag: "notIn", values: new Set([leaf.value]) };
    case "in": {
      const arr = Array.isArray(leaf.value) ? leaf.value : [leaf.value];
      return { tag: "in", values: new Set(arr) };
    }
    case "notIn": {
      const arr = Array.isArray(leaf.value) ? leaf.value : [leaf.value];
      return { tag: "notIn", values: new Set(arr) };
    }
    case "between":
      return {
        tag: "between",
        lo: leaf.value[0],
        hi: leaf.value[1],
      };
    case "gt":
      return {
        tag: "interval",
        lo: leaf.value,
        loExclusive: true,
        hi: null,
        hiExclusive: true,
      };
    case "gte":
      return {
        tag: "interval",
        lo: leaf.value,
        loExclusive: false,
        hi: null,
        hiExclusive: true,
      };
    case "lt":
      return {
        tag: "interval",
        lo: null,
        loExclusive: true,
        hi: leaf.value,
        hiExclusive: true,
      };
    case "lte":
      return {
        tag: "interval",
        lo: null,
        loExclusive: true,
        hi: leaf.value,
        hiExclusive: false,
      };
    case "isNull":
      return { tag: "isNull" };
    case "notNull":
      return { tag: "notNull" };
    case "contains":
    case "startsWith":
    case "endsWith":
    case "like":
    case "notLike":
      return {
        tag: "pattern",
        op: leaf.operator,
        value: String(leaf.value ?? ""),
      };
    default:
      return { tag: "eq", value: leaf.value };
  }
}

function mergeTwoStates<F extends string>(
  field: F,
  a: FieldState<F>,
  b: FieldState<F>
): FieldState<F> {
  if (a.tag === "isNull" || b.tag === "isNull") {
    return mergeIsNull(field, a, b);
  }
  if (a.tag === "notNull" || b.tag === "notNull") {
    return mergeNotNull(field, a, b);
  }
  if (a.tag === "eq" || b.tag === "eq") {
    const eqSide = a.tag === "eq" ? a : (b as { tag: "eq"; value: any });
    const other = a.tag === "eq" ? b : a;
    return applyEq(field, eqSide.value, other);
  }
  if (a.tag === "in" || b.tag === "in") {
    const inSide = a.tag === "in" ? a : (b as { tag: "in"; values: Set<any> });
    const other = a.tag === "in" ? b : a;
    return applyIn(field, inSide, other);
  }
  if (a.tag === "notIn" || b.tag === "notIn") {
    const ninSide = a.tag === "notIn" ? a : (b as { tag: "notIn"; values: Set<any> });
    const other = a.tag === "notIn" ? b : a;
    return applyNotIn(field, ninSide, other);
  }
  if (a.tag === "pattern" || b.tag === "pattern") {
    return mergePatterns(field, a, b);
  }
  if (a.tag === "between" || b.tag === "between") {
    const bet = a.tag === "between" ? a : (b as { tag: "between"; lo: any; hi: any });
    const other = a.tag === "between" ? b : a;
    return applyBetween(field, bet, other);
  }
  if (a.tag === "interval" && b.tag === "interval") {
    return mergeIntervals(field, a, b);
  }
  throw new BadRequestException(CONFLICT(field));
}

function mergeIsNull<F extends string>(
  field: F,
  a: FieldState<F>,
  b: FieldState<F>
): FieldState<F> {
  const x = a.tag === "isNull" ? a : b;
  const y = a.tag === "isNull" ? b : a;
  if (y.tag === "isNull") {
    return { tag: "isNull" };
  }
  if (y.tag === "notNull") {
    throw new BadRequestException(CONFLICT(field));
  }
  if (y.tag === "eq") {
    if (y.value != null && y.value !== undefined) {
      throw new BadRequestException(CONFLICT(field));
    }
    return { tag: "isNull" };
  }
  if (y.tag === "in") {
    const ok = [...y.values].every((v) => v == null);
    if (!ok) {
      throw new BadRequestException(CONFLICT(field));
    }
    return { tag: "isNull" };
  }
  throw new BadRequestException(CONFLICT(field));
}

function mergeNotNull<F extends string>(
  field: F,
  a: FieldState<F>,
  b: FieldState<F>
): FieldState<F> {
  const x = a.tag === "notNull" ? a : b;
  const y = a.tag === "notNull" ? b : a;
  if (y.tag === "notNull") {
    return { tag: "notNull" };
  }
  if (y.tag === "eq") {
    return y;
  }
  if (y.tag === "in") {
    const filtered = new Set([...y.values].filter((v) => v != null));
    if (filtered.size === 0) {
      throw new BadRequestException(CONFLICT(field));
    }
    if (filtered.size === 1) {
      return { tag: "eq", value: [...filtered][0] };
    }
    return { tag: "in", values: filtered };
  }
  if (y.tag === "notIn") {
    return y;
  }
  if (
    y.tag === "between" ||
    y.tag === "interval" ||
    y.tag === "pattern"
  ) {
    return y;
  }
  throw new BadRequestException(CONFLICT(field));
}

function applyEq<F extends string>(
  field: F,
  v: any,
  other: FieldState<F>
): FieldState<F> {
  switch (other.tag) {
    case "eq":
      if (!sameValue(v, other.value)) {
        throw new BadRequestException(CONFLICT(field));
      }
      return { tag: "eq", value: v };
    case "in":
      if (!other.values.has(v)) {
        throw new BadRequestException(CONFLICT(field));
      }
      return { tag: "eq", value: v };
    case "notIn":
      if (other.values.has(v)) {
        throw new BadRequestException(CONFLICT(field));
      }
      return { tag: "eq", value: v };
    case "between":
      if (
        compareValues(v, other.lo) < 0 ||
        compareValues(v, other.hi) > 0
      ) {
        throw new BadRequestException(CONFLICT(field));
      }
      return { tag: "eq", value: v };
    case "interval":
      if (!valueSatisfiesInterval(v, other)) {
        throw new BadRequestException(CONFLICT(field));
      }
      return { tag: "eq", value: v };
    case "pattern":
      throw new BadRequestException(CONFLICT(field));
    default:
      throw new BadRequestException(CONFLICT(field));
  }
}

function applyIn<F extends string>(
  field: F,
  inn: { tag: "in"; values: Set<any> },
  other: FieldState<F>
): FieldState<F> {
  switch (other.tag) {
    case "in": {
      const inter = intersectSets(inn.values, other.values);
      if (inter.size === 0) {
        throw new BadRequestException(CONFLICT(field));
      }
      if (inter.size === 1) {
        return { tag: "eq", value: [...inter][0] };
      }
      return { tag: "in", values: inter };
    }
    case "notIn": {
      const next = new Set(
        [...inn.values].filter((x) => !other.values.has(x))
      );
      if (next.size === 0) {
        throw new BadRequestException(CONFLICT(field));
      }
      if (next.size === 1) {
        return { tag: "eq", value: [...next][0] };
      }
      return { tag: "in", values: next };
    }
    case "between": {
      const next = new Set(
        [...inn.values].filter(
          (x) =>
            compareValues(x, other.lo) >= 0 &&
            compareValues(x, other.hi) <= 0
        )
      );
      if (next.size === 0) {
        throw new BadRequestException(CONFLICT(field));
      }
      if (next.size === 1) {
        return { tag: "eq", value: [...next][0] };
      }
      return { tag: "in", values: next };
    }
    case "interval": {
      const next = new Set(
        [...inn.values].filter((x) => valueSatisfiesInterval(x, other))
      );
      if (next.size === 0) {
        throw new BadRequestException(CONFLICT(field));
      }
      if (next.size === 1) {
        return { tag: "eq", value: [...next][0] };
      }
      return { tag: "in", values: next };
    }
    default:
      throw new BadRequestException(CONFLICT(field));
  }
}

function applyNotIn<F extends string>(
  field: F,
  nin: { tag: "notIn"; values: Set<any> },
  other: FieldState<F>
): FieldState<F> {
  switch (other.tag) {
    case "notIn": {
      return {
        tag: "notIn",
        values: unionSets(nin.values, other.values),
      };
    }
    case "between":
    case "interval":
    case "pattern":
      throw new BadRequestException(CONFLICT(field));
    default:
      throw new BadRequestException(CONFLICT(field));
  }
}

function applyBetween<F extends string>(
  field: F,
  bet: { tag: "between"; lo: any; hi: any },
  other: FieldState<F>
): FieldState<F> {
  switch (other.tag) {
    case "between": {
      const lo = maxOf(bet.lo, other.lo);
      const hi = minOf(bet.hi, other.hi);
      if (compareValues(lo, hi) > 0) {
        throw new BadRequestException(CONFLICT(field));
      }
      return { tag: "between", lo, hi };
    }
    case "interval": {
      return intersectBetweenWithInterval(field, bet, other);
    }
    default:
      throw new BadRequestException(CONFLICT(field));
  }
}

function intersectBetweenWithInterval<F extends string>(
  field: F,
  bet: { tag: "between"; lo: any; hi: any },
  iv: {
    tag: "interval";
    lo: any | null;
    loExclusive: boolean;
    hi: any | null;
    hiExclusive: boolean;
  }
): FieldState<F> {
  let lo = bet.lo;
  let hi = bet.hi;
  if (iv.lo != null) {
    if (compareValues(iv.lo, lo) > 0) {
      lo = iv.lo;
    }
  }
  if (iv.hi != null) {
    if (compareValues(iv.hi, hi) < 0) {
      hi = iv.hi;
    }
  }
  if (compareValues(lo, hi) > 0) {
    throw new BadRequestException(CONFLICT(field));
  }
  return { tag: "between", lo, hi };
}

function pickStrongerLower(
  x: { v: any; ex: boolean },
  y: { v: any; ex: boolean }
): { v: any; ex: boolean } {
  const cmp = compareValues(x.v, y.v);
  if (cmp > 0) {
    return x;
  }
  if (cmp < 0) {
    return y;
  }
  return { v: x.v, ex: x.ex || y.ex };
}

function pickStrongerUpper(
  x: { v: any; ex: boolean },
  y: { v: any; ex: boolean }
): { v: any; ex: boolean } {
  const cmp = compareValues(x.v, y.v);
  if (cmp < 0) {
    return x;
  }
  if (cmp > 0) {
    return y;
  }
  return { v: x.v, ex: x.ex || y.ex };
}

function mergeIntervals<F extends string>(
  field: F,
  a: {
    tag: "interval";
    lo: any | null;
    loExclusive: boolean;
    hi: any | null;
    hiExclusive: boolean;
  },
  b: {
    tag: "interval";
    lo: any | null;
    loExclusive: boolean;
    hi: any | null;
    hiExclusive: boolean;
  }
): FieldState<F> {
  let lo: any | null = null;
  let loEx = false;
  let hi: any | null = null;
  let hiEx = false;

  const lows: { v: any; ex: boolean }[] = [];
  if (a.lo != null) {
    lows.push({ v: a.lo, ex: a.loExclusive });
  }
  if (b.lo != null) {
    lows.push({ v: b.lo, ex: b.loExclusive });
  }
  if (lows.length) {
    const best = lows.reduce((p, c) => pickStrongerLower(p, c));
    lo = best.v;
    loEx = best.ex;
  }

  const highs: { v: any; ex: boolean }[] = [];
  if (a.hi != null) {
    highs.push({ v: a.hi, ex: a.hiExclusive });
  }
  if (b.hi != null) {
    highs.push({ v: b.hi, ex: b.hiExclusive });
  }
  if (highs.length) {
    const best = highs.reduce((p, c) => pickStrongerUpper(p, c));
    hi = best.v;
    hiEx = best.ex;
  }

  if (lo != null && hi != null) {
    const c = compareValues(lo, hi);
    if (c > 0 || (c === 0 && (loEx || hiEx))) {
      throw new BadRequestException(CONFLICT(field));
    }
    if (c === 0 && !loEx && !hiEx) {
      return { tag: "eq", value: lo };
    }
    if (!loEx && !hiEx) {
      return { tag: "between", lo, hi };
    }
  }

  return {
    tag: "interval",
    lo,
    loExclusive: loEx,
    hi,
    hiExclusive: hiEx,
  };
}

function mergePatterns<F extends string>(
  field: F,
  a: FieldState<F>,
  b: FieldState<F>
): FieldState<F> {
  if (a.tag !== "pattern" || b.tag !== "pattern") {
    throw new BadRequestException(CONFLICT(field));
  }
  if (a.op !== b.op || a.value !== b.value) {
    throw new BadRequestException(CONFLICT(field));
  }
  return a;
}

function valueSatisfiesInterval(
  v: any,
  iv: {
    lo: any | null;
    loExclusive: boolean;
    hi: any | null;
    hiExclusive: boolean;
  }
): boolean {
  if (iv.lo != null) {
    const c = compareValues(v, iv.lo);
    if (c < 0 || (c === 0 && iv.loExclusive)) {
      return false;
    }
  }
  if (iv.hi != null) {
    const c = compareValues(v, iv.hi);
    if (c > 0 || (c === 0 && iv.hiExclusive)) {
      return false;
    }
  }
  return true;
}

function stateToFilterCriteria<F extends string>(
  field: F,
  s: FieldState<F>
): FilterCriteria<F> {
  switch (s.tag) {
    case "eq":
      return { field, operator: "eq", value: s.value };
    case "in":
      if (s.values.size === 1) {
        return {
          field,
          operator: "eq",
          value: [...s.values][0],
        };
      }
      return {
        field,
        operator: "in",
        value: [...s.values],
      };
    case "notIn":
      return {
        field,
        operator: "notIn",
        value: [...s.values],
      };
    case "between":
      return {
        field,
        operator: "between",
        value: [s.lo, s.hi],
      };
    case "interval": {
      // TypeORM allows only one key per field: collapse to inclusive Between when possible
      if (s.lo != null && s.hi != null && !s.loExclusive && !s.hiExclusive) {
        return {
          field,
          operator: "between",
          value: [s.lo, s.hi],
        };
      }
      if (s.lo != null && s.hi != null) {
        // Plan: gt 10 + lt 50 => between(10,50) inclusive as approximation
        return {
          field,
          operator: "between",
          value: [s.lo, s.hi],
        };
      }
      if (s.lo != null) {
        return {
          field,
          operator: s.loExclusive ? "gt" : "gte",
          value: s.lo,
        };
      }
      if (s.hi != null) {
        return {
          field,
          operator: s.hiExclusive ? "lt" : "lte",
          value: s.hi,
        };
      }
      throw new BadRequestException(CONFLICT(field));
    }
    case "isNull":
      return { field, operator: "isNull", value: undefined };
    case "notNull":
      return { field, operator: "notNull", value: undefined };
    case "pattern":
      return {
        field,
        operator: s.op,
        value: s.value,
      };
    default:
      throw new BadRequestException(CONFLICT(field));
  }
}

function sameValue(a: any, b: any): boolean {
  return a === b;
}

function compareValues(a: any, b: any): number {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

function intersectSets(a: Set<any>, b: Set<any>): Set<any> {
  const out = new Set<any>();
  for (const v of a) {
    if (b.has(v)) {
      out.add(v);
    }
  }
  return out;
}

function unionSets(a: Set<any>, b: Set<any>): Set<any> {
  return new Set([...a, ...b]);
}

function maxOf(a: any, b: any): any {
  return compareValues(a, b) >= 0 ? a : b;
}

function minOf(a: any, b: any): any {
  return compareValues(a, b) <= 0 ? a : b;
}
