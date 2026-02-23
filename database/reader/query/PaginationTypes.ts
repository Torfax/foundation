

export interface PaginationMeta {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginatedResult<T> {
    data: T[] | null;
    pagination: PaginationMeta;
}

export interface ListConfig {
    maxLimit?: number;
    defaultLimit?: number;
    defaultSort?: string;
    defaultOrder?: "ASC" | "DESC";
}