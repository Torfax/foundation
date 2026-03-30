import { ReadCriteria } from "../criteria/ReadCriteria";
import { CriteriaNode } from "../criteria/CriteriaFilterTree";
import { FilterCriteria } from "../criteria/FilterCriteria";
import { PaginationCriteria } from "../criteria/PaginationCriteria";
import { SortCriteria } from "../criteria/SortCriteria";
import { ListQueryDto } from "@src/core/database/reader/query/ListQueryDto";

export type EntityFields<T> = keyof T & string;

export class ReadCriteriaBuilder {

    static fromDto<T extends string>(
        dto?: ListQueryDto
    ): ReadCriteria<T> | undefined {

        if (!dto) return undefined;

        const filterTree = this.parseFilterTree<T>(dto);

        return {
            ...(filterTree ? { filterTree } : { filters: this.buildFilters<T>(dto) }),
            sort: this.buildSort<T>(dto),
            pagination: this.buildPagination(dto)
        };
    }

    private static parseFilterTree<T extends string>(
        dto: ListQueryDto
    ): CriteriaNode<T> | undefined {
        if (dto.filterTree == null) {
            return undefined;
        }
        const node = dto.filterTree as CriteriaNode<T>;
        if (!this.isValidFilterTreeNode(node)) {
            return undefined;
        }
        return node;
    }

    private static isValidFilterTreeNode<T extends string>(
        n: unknown
    ): n is CriteriaNode<T> {
        if (!n || typeof n !== "object") {
            return false;
        }
        const o = n as Record<string, unknown>;
        if (o.kind === "leaf") {
            return (
                typeof o.field === "string" &&
                typeof o.operator === "string"
            );
        }
        if (o.kind === "group") {
            return (
                (o.op === "and" || o.op === "or") &&
                Array.isArray(o.nodes) &&
                (o.nodes as unknown[]).every((c) =>
                    this.isValidFilterTreeNode<T>(c)
                )
            );
        }
        return false;
    }

    private static buildFilters<T extends string>(
        dto: ListQueryDto
    ): FilterCriteria<T>[] | undefined {

        if (!dto.filters?.length) return undefined;

        return dto.filters.map((f) => ({
            field: f.field as T,
            operator: f.op,
            value: f.value
        }));
    }

    private static buildSort<T extends string>(
        dto: ListQueryDto
    ): SortCriteria<T>[] | undefined {

        if (!dto.sort) return undefined;

        return [{
            field: dto.sort.field as T,
            direction: dto.sort.direction
        }];
    }

    private static buildPagination(
        dto: ListQueryDto
    ): PaginationCriteria {
        return {
            page: dto.page ?? 1,
            limit: dto.limit ?? 10
        };
    }
}
