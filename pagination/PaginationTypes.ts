// src/core/pagination/services/PaginationTypes.ts
export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
}

export interface PaginationMeta {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: PaginationMeta;
}

export interface PaginationConfig {
    maxLimit?: number;
    defaultLimit?: number;
    defaultSort?: string;
    defaultOrder?: "ASC" | "DESC";
}