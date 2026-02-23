export type EntityConstructor<E extends object = any> =
  new (...args: any[]) => E;



/* export type EntityConstructor<E> = {
  new (...args: any[]): E;
};
 */