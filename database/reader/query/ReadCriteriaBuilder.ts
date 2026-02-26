import { ReadCriteria } from "../criteria/ReadCriteria";
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

        return {
            filters: this.buildFilters<T>(dto),
            sort: this.buildSort<T>(dto),
            pagination: this.buildPagination(dto)
        };
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
