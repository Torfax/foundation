import { NotFoundException } from "@src/core/exceptions/HttpException";
import { CriteriaTranslatorPort } from "./criteria/CriteriaTranslatorPort";
import { ReadCriteria } from "./criteria/ReadCriteria";
import { mergeReadCriteria } from "./criteria/ReadCriteriaUtils";
import { ReadDataSourcePort } from "./ReadDataSourcePort";
import { ListConfig, PaginatedResult, PaginationMeta } from "./query/PaginationTypes";

export type EntityId = string | number | Number;

export class Reader<Q, R> {

  constructor(
    private readonly translator: CriteriaTranslatorPort<Q>,
    private readonly repository: ReadDataSourcePort<Q, R>
  ) { }

  // --------------------
  // Core
  // --------------------

  async find(
    criteria?: ReadCriteria<keyof R & string>
  ): Promise<R[]> {
    return this.repository.find(
      this.translator.translate(criteria ?? {})
    );
  }

  async findOne(
    criteria?: ReadCriteria<keyof R & string>
  ): Promise<R | null> {
    return this.repository.findOne(
      this.translator.translate(criteria ?? {})
    );
  }

  async getOne(
    criteria?: ReadCriteria<keyof R & string>
  ): Promise<R> {
    const entity = await this.findOne(criteria);
    if (!entity) throw new NotFoundException();
    return entity;
  }

  // --------------------
  // By ID
  // --------------------

  private buildIdCriteria(
    id: EntityId,
    criteria?: ReadCriteria<keyof R & string>
  ): ReadCriteria<keyof R & string> {
    return mergeReadCriteria(
      {
        filters: [{
          field: "id" as keyof R & string,
          operator: "eq",
          value: String(id)
        }]
      },
      criteria
    );
  }

  async findById(
    id: EntityId,
    criteria?: ReadCriteria<keyof R & string>
  ): Promise<R | null> {
    return this.findOne(this.buildIdCriteria(id, criteria));
  }

  async getById(
    id: EntityId,
    criteria?: ReadCriteria<keyof R & string>
  ): Promise<R> {
    return this.getOne(this.buildIdCriteria(id, criteria));
  }

  // --------------------
  // By Field
  // --------------------

  async findByField<K extends keyof R>(
    field: K,
    value: R[K]
  ): Promise<R | null> {
    return this.findOne({
      filters: [{
        field: field as keyof R & string,
        operator: "eq",
        value
      }]
    });
  }

  async findManyByField<K extends keyof R>(
    field: K,
    value: R[K]
  ): Promise<R[]> {
    return this.find({
      filters: [{
        field: field as keyof R & string,
        operator: "eq",
        value
      }]
    });
  }


  async paginate(
    criteria?: ReadCriteria<keyof R & string>,
    config?: ListConfig
  ): Promise<PaginatedResult<R>> {

    const page =
      criteria?.pagination?.page ??
      1;

    const limit = Math.min(
      criteria?.pagination?.limit ??
      config?.defaultLimit ??
      10,
      config?.maxLimit ?? Infinity
    );

    const normalizedCriteria: ReadCriteria<keyof R & string> = {
      ...criteria,
      pagination: { page, limit },
      sort: criteria?.sort?.length
        ? criteria.sort
        : config?.defaultSort
          ? [{
            field: config.defaultSort as keyof R & string,
            direction: config.defaultOrder ?? "ASC"
          }]
          : undefined
    };

    const [rows, totalItems] =
      await this.repository.findAndCount(
        this.translator.translate(normalizedCriteria)
      );

    const totalPages = Math.max(
      1,
      Math.ceil(totalItems / limit)
    );

    const pagination: PaginationMeta = {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return {
      data: rows.length ? rows : [],
      pagination
    };

  }
}
