// src/core/pagination/services/pagination.service.ts
import { Repository, FindManyOptions, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import {
    PaginatedResult,
    PaginationMeta,
    PaginationOptions,
    PaginationConfig
} from './PaginationTypes';

export class PaginationService {
    private defaultConfig: Required<PaginationConfig> = {
        maxLimit: 100,
        defaultLimit: 10,
        defaultSort: 'createdAt',
        defaultOrder: 'DESC'
    };

    private config: Required<PaginationConfig>;

    constructor(config: PaginationConfig = {}) {
        this.config = { ...this.defaultConfig, ...config };
    }

    /**
     * Paginación genérica para cualquier repositorio TypeORM
     */
    async paginate<T extends ObjectLiteral>(
        repository: Repository<T>,
        options: PaginationOptions,
        findOptions: FindManyOptions<T> = {},
        countOnly: boolean = false
    ): Promise<PaginatedResult<T>> {
        const validatedOptions = this.validateAndNormalizeOptions(options);
        const { page, limit, sortBy, sortOrder } = validatedOptions;
        const skip = (page - 1) * limit;

        // Aplicar ordenamiento seguro
        if (sortBy) {
            findOptions.order = this.buildSafeOrder(
                findOptions.order,
                sortBy,
                sortOrder
            );
        }

        findOptions.skip = skip;
        findOptions.take = limit;

        try {
            let totalItems: number;
            let data: T[] | null = null;

            if (countOnly) {
                totalItems = await repository.count(findOptions);
            } else {
                const [a, b] = await repository.findAndCount(findOptions);
                data = a;
                totalItems = b;
            }

            const meta = this.calculatePaginationMeta(page, limit, totalItems);

            return { data, pagination: meta };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Pagination failed: ${errorMessage}`);
        }
    }

    /**
     * Paginación con QueryBuilder para casos más complejos
     */
    async paginateQueryBuilder<T extends ObjectLiteral>(
        queryBuilder: SelectQueryBuilder<T>,
        options: PaginationOptions
    ): Promise<PaginatedResult<T>> {
        const validatedOptions = this.validateAndNormalizeOptions(options);
        const { page, limit, sortBy, sortOrder } = validatedOptions;
        const skip = (page - 1) * limit;

        if (sortBy && this.isValidFieldForSorting(queryBuilder, sortBy)) {
            const alias = queryBuilder.expressionMap.mainAlias!.name;
            queryBuilder.orderBy(`${alias}.${sortBy}`, sortOrder);
        }

        const [data, totalItems] = await queryBuilder
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        const meta = this.calculatePaginationMeta(page, limit, totalItems);

        return { data, pagination: meta };
    }

    /**
     * Construye opciones de ordenamiento de forma segura
     */
    private buildSafeOrder(
        existingOrder: any,
        sortBy: string,
        sortOrder: "ASC" | "DESC"
    ): any {
        const newOrder: any = {};
        newOrder[sortBy] = sortOrder;

        if (existingOrder && typeof existingOrder === 'object') {
            return {
                ...existingOrder,
                ...newOrder
            };
        }

        return newOrder;
    }

    /**
     * Valida nombres de campos para prevenir inyección SQL básica
     */
    private isValidFieldName(field: string): boolean {
        // Solo permite letras, números, guiones bajos
        // Esto previene inyecciones como: "field; DROP TABLE users"
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field);
    }

    /**
     * Valida que el campo sea válido para ordenamiento en QueryBuilder
     */
    private isValidFieldForSorting<T extends ObjectLiteral>(
        queryBuilder: SelectQueryBuilder<T>,
        field: string
    ): boolean {
        return this.isValidFieldName(field);
    }

    /**
     * Valida y normaliza las opciones de paginación
     */
    validateAndNormalizeOptions(options: PaginationOptions): Required<PaginationOptions> {
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(this.config.maxLimit, Math.max(1, options.limit || this.config.defaultLimit));
        const sortBy = options.sortBy && this.isValidFieldName(options.sortBy)
            ? options.sortBy
            : this.config.defaultSort;
        const sortOrder = options.sortOrder && ['ASC', 'DESC'].includes(options.sortOrder)
            ? options.sortOrder
            : this.config.defaultOrder;

        return { page, limit, sortBy, sortOrder };
    }

    /**
     * Valida parámetros de query crudos desde la request
     */
    validatePaginationParams(query: any): Required<PaginationOptions> {
        const page = Math.max(1, parseInt(query.page) || 1);
        const limit = Math.min(
            this.config.maxLimit,
            Math.max(1, parseInt(query.limit) || this.config.defaultLimit)
        );

        const sortBy = query.sortBy && this.isValidFieldName(query.sortBy)
            ? query.sortBy
            : this.config.defaultSort;

        const rawSortOrder = query.sortOrder || this.config.defaultOrder;
        const sortOrder = ['ASC', 'DESC'].includes(rawSortOrder?.toUpperCase())
            ? rawSortOrder.toUpperCase() as "ASC" | "DESC"
            : this.config.defaultOrder;

        return {
            page,
            limit,
            sortBy,
            sortOrder
        };
    }

    /**
     * Calcula los metadatos de paginación
     */
    private calculatePaginationMeta(
        page: number,
        limit: number,
        totalItems: number
    ): PaginationMeta {
        const totalPages = Math.ceil(totalItems / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit,
            hasNext,
            hasPrev
        };
    }

    /**
     * Crea una respuesta de paginación vacía
     */
    createEmptyResult<T>(): PaginatedResult<T> {
        return {
            data: [],
            pagination: {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: this.config.defaultLimit,
                hasNext: false,
                hasPrev: false
            }
        };
    }
}

// Instancia por defecto
export const paginationService = new PaginationService();