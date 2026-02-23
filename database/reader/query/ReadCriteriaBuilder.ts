import { ReadCriteria } from "../criteria/ReadCriteria";
import { FilterCriteria } from "../criteria/FilterCriteria";
import { PaginationCriteria } from "../criteria/PaginationCriteria";
import { SortCriteria } from "../criteria/SortCriteria";
import { ListQueryDto } from "@src/core/database/reader/query/ListQueryDto";

export class ReadCriteriaBuilder {

    static fromDto(dto: ListQueryDto): ReadCriteria {
        return {
            filters: this.buildFilters(dto),
            sort: this.buildSort(dto),
            pagination: this.buildPagination(dto)
        };
    }

    private static buildFilters(
        dto: ListQueryDto
    ): FilterCriteria[] | undefined {

        if (!dto.filters?.length) return undefined;

        return dto.filters.map((f) => ({
            field: f.field,
            operator: f.op,
            value: f.value
        }));
    }

    private static buildSort(
        dto: ListQueryDto
    ): SortCriteria[] | undefined {

        if (!dto.sort) return undefined;

        return [{
            field: dto.sort.field,
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
