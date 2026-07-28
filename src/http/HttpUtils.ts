import { Request } from 'express';

export class HttpUtil {

    /**
     * Obtiene el host base desde la request considerando proxies
     */
    static getHost(req: Request): string {
        const protocol = req.headers['x-forwarded-proto']?.toString() || req.protocol;
        const host = req.headers['x-forwarded-host']?.toString() || req.get('host');

        if (!host) {
            throw new Error('No se pudo determinar el host desde la request');
        }

        return `${protocol}://${host}`;
    }

    /**
     * Obtiene la URL completa incluyendo path y query parameters
     */
    static getFullUrl(req: Request): string {
        const baseUrl = this.getHost(req);
        return `${baseUrl}${req.originalUrl}`;
    }

    /**
     * Obtiene solo el path base (sin query parameters)
     */
    static getBasePath(req: Request): string {
        return req.baseUrl + req.path;
    }
}