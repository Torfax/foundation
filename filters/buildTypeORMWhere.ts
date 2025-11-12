// Primero, necesitamos una función que transforme QueryFilter[] a TypeORM Where
import { ILike, In, Between, MoreThan, LessThan, MoreThanOrEqual, LessThanOrEqual, Not } from "typeorm";
import { QueryFilter } from "./types";

export default function buildTypeORMWhere(filters: QueryFilter[]): any {
    const where: any = {};

    filters.forEach(filter => {
        switch (filter.op) {
            case "=":
                where[filter.field] = filter.value;
                break;
            case "!=":
                where[filter.field] = Not(filter.value);
                break;
            case "contains":
                where[filter.field] = ILike(`%${filter.value}%`);
                break;
            case "startsWith":
                where[filter.field] = ILike(`${filter.value}%`);
                break;
            case "endsWith":
                where[filter.field] = ILike(`%${filter.value}`);
                break;
            case "in":
                where[filter.field] = In(Array.isArray(filter.value) ? filter.value : [filter.value]);
                break;
            case "between":
                where[filter.field] = Between(filter.value[0], filter.value[1]);
                break;
            case ">":
                where[filter.field] = MoreThan(filter.value);
                break;
            case "<":
                where[filter.field] = LessThan(filter.value);
                break;
            case ">=":
                where[filter.field] = MoreThanOrEqual(filter.value);
                break;
            case "<=":
                where[filter.field] = LessThanOrEqual(filter.value);
                break;
            case "before":
                where[filter.field] = LessThan(filter.value);
                break;
            case "after":
                where[filter.field] = MoreThan(filter.value);
                break;
            default:
                where[filter.field] = filter.value;
        }
    });

    return where;
}