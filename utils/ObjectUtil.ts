/**
 * Excluye keys de un objeto
 */
export function excludeKeys<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete (result as any)[key];
  });
  return result;
}

/**
 * Incluye solo las keys especificadas
 */
export function pickKeys<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Transforma valores de un objeto
 */
export function transformValues<
  T extends Record<string, any>,
  R
>(
  obj: T,
  transformer: (value: T[keyof T], key: keyof T) => R
): { [K in keyof T]: R } {
  const result = {} as { [K in keyof T]: R };

  (Object.keys(obj) as (keyof T)[]).forEach((key) => {
    result[key] = transformer(obj[key], key);
  });

  return result;
}

/**
 * Verifica si un objeto tiene todas las keys
 */
export function hasAllKeys<T extends object>(
  obj: T,
  keys: (keyof T)[]
): boolean {
  return keys.every((key) => key in obj);
}

/**
 * Obtiene las keys de un objeto como array tipado
 */
export function getKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Verifica si un objeto está vacío
 */
export function isEmpty<T extends object>(obj: T): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Sanitiza un array de objetos
 */
export function excludeKeysFromArray<
  T extends object,
  K extends keyof T
>(
  arr: T[],
  keys: K[]
): Omit<T, K>[] {
  return arr.map((item) => excludeKeys(item, keys));
}

/**
 * Deep clone de un objeto
 * (nota: solo funciona bien con datos serializables)
 */
export function deepClone<T extends object>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge superficial de dos objetos
 */
export function merge<
  T extends object,
  U extends object
>(target: T, source: U): T & U {
  return { ...target, ...source };
}