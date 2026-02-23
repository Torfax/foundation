import {
    FindManyOptions,
    ILike,
    In,
    Between,
    MoreThan,
    LessThan,
    MoreThanOrEqual,
    LessThanOrEqual,
    Not
} from "typeorm";

import { CriteriaTranslatorPort } from "../../reader/criteria/CriteriaTranslatorPort";
import { ReadCriteria } from "../../reader/criteria/ReadCriteria";
import { FilterCriteria } from "../../reader/criteria/FilterCriteria";

export class TypeOrmCriteriaTranslator<T>
    implements CriteriaTranslatorPort<FindManyOptions<T>> {

    translate(criteria: ReadCriteria<keyof T & string>): FindManyOptions<T> {
        const options: FindManyOptions<T> = {};

        if (criteria.filters?.length) {
            options.where = this.buildWhere(criteria.filters);
        }

        if (criteria.sort?.length) {
            options.order = this.buildOrder(criteria.sort);
        }

        if (criteria.pagination) {
            options.skip =
                (criteria.pagination.page - 1) *
                criteria.pagination.limit;

            options.take =
                criteria.pagination.limit;
        }

        return options;
    }

    // ------------------------

    private buildWhere(filters: FilterCriteria<keyof T & string>[]): any {
        const where: any = {};

        for (const f of filters) {
            switch (f.operator) {

                case "eq":
                    where[f.field] = f.value;
                    break;

                case "neq":
                    where[f.field] = Not(f.value);
                    break;

                case "gt":
                    where[f.field] = MoreThan(f.value);
                    break;

                case "lt":
                    where[f.field] = LessThan(f.value);
                    break;

                case "gte":
                    where[f.field] = MoreThanOrEqual(f.value);
                    break;

                case "lte":
                    where[f.field] = LessThanOrEqual(f.value);
                    break;

                case "contains":
                    where[f.field] = ILike(`%${f.value}%`);
                    break;

                case "startsWith":
                    where[f.field] = ILike(`${f.value}%`);
                    break;

                case "endsWith":
                    where[f.field] = ILike(`%${f.value}`);
                    break;

                case "like":
                    where[f.field] = ILike(f.value);
                    break;

                case "notLike":
                    where[f.field] = Not(ILike(f.value));
                    break;

                case "in":
                    where[f.field] = In(
                        Array.isArray(f.value) ? f.value : [f.value]
                    );
                    break;

                case "between":
                    where[f.field] = Between(
                        f.value[0],
                        f.value[1]
                    );
                    break;

                case "isNull":
                    where[f.field] = null;
                    break;

                case "notNull":
                    where[f.field] = Not(null);
                    break;

                default:
                    where[f.field] = f.value;
            }
        }

        return where;
    }


    private buildOrder(sort: ReadCriteria["sort"]): any {
        const order: any = {};

        for (const s of sort ?? []) {
            order[s.field] = s.direction;
        }

        return order;
    }
}
