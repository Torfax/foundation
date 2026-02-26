export class ObjectUtilService {
    /**
     * Excluye keys de un objeto
     */
    excludeKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
        const result = { ...obj };
        keys.forEach(key => {
            delete result[key];
        });
        return result;
    }

    /**
     * Incluye solo las keys especificadas
     */
    pickKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
        const result = {} as Pick<T, K>;
        keys.forEach(key => {
            if (key in obj) {
                result[key] = obj[key];
            }
        });
        return result;
    }

    /**
     * Transforma valores de un objeto
     */
    transformValues<T extends Record<string, any>, R>(
        obj: T,
        transformer: (value: any, key: keyof T) => R
    ): { [K in keyof T]: R } {
        const result = {} as { [K in keyof T]: R };
        Object.keys(obj).forEach(key => {
            result[key as keyof T] = transformer(obj[key as keyof T], key as keyof T);
        });
        return result;
    }

    /**
     * Verifica si un objeto tiene todas las keys
     */
    hasAllKeys<T extends object>(obj: T, keys: string[]): boolean {
        return keys.every(key => key in obj);
    }

    /**
     * Obtiene las keys de un objeto como array tipado
     */
    getKeys<T extends object>(obj: T): (keyof T)[] {
        return Object.keys(obj) as (keyof T)[];
    }

    /**
     * Verifica si un objeto está vacío
     */
    isEmpty<T extends object>(obj: T): boolean {
        return Object.keys(obj).length === 0;
    }

    /**
     * Versión pre-configurada para usuarios
     */
    /*  excludeUserSensitiveData(user: Users): Omit<Users, 'password' | 'refreshToken'> {
       return this.excludeKeys(user, ['password', 'refreshToken']);
     } */

    /**
     * Sanitiza un array de objetos
     */
    excludeKeysFromArray<T extends object, K extends keyof T>(
        arr: T[],
        keys: K[]
    ): Omit<T, K>[] {
        return arr.map(item => this.excludeKeys(item, keys));
    }

    /**
     * Deep clone de un objeto
     */
    deepClone<T extends object>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Merge de dos objetos
     */
    merge<T extends object, U extends object>(target: T, source: U): T & U {
        return { ...target, ...source };
    }
}