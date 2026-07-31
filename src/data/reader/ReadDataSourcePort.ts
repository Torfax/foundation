export interface ReadDataSourcePort<Q, R = any> {

  find(query: Q): Promise<R[]>;

  findOne(query: Q): Promise<R | null>;

  findAndCount(query: Q): Promise<[R[], number]>;

  count(query: Q): Promise<number>;

  exists(query: Q): Promise<boolean>;
}
