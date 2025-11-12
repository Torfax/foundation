// src/files/FileAccessService.ts
import jwt from "jsonwebtoken";
import FileAccessOptions from "./types/FileAccessOptions";
import FileAccessPayload from "./types/FileAccessPayload";

export class FileAccessService {
    private jwtSecret: jwt.Secret;
    private tokenExpiresIn: string | number;
    private endpoint: string;
    private host: string;

    constructor(options: FileAccessOptions) {
        this.jwtSecret = options.jwtSecret;
        this.tokenExpiresIn = options.tokenExpiresIn ?? "15m";
        this.endpoint = options.endpoint ? options.endpoint.replace(/\/+$/, "") : "/files";
        this.host = options.host ? options.host.replace(/\/+$/, "") : "";
    }

    /**
     * Construye URL base completa
     */
    private buildBaseUrl(): string {
        return this.host
            ? `${this.host}${this.endpoint}`
            : this.endpoint;
    }

    /**
     * Construye URL pública para uno o múltiples archivos
     */
    buildPublicUrl(relativePath: string | string[]): string | string[] {
        const baseUrl = this.buildBaseUrl();
        const paths = Array.isArray(relativePath) ? relativePath : [relativePath];

        if (paths.length === 1) {
            return `${baseUrl}?path=${encodeURIComponent(paths[0])}`;
        }

        // Para múltiples archivos, retornar array de URLs individuales
        return paths.map(path => `${baseUrl}?path=${encodeURIComponent(path)}`);
    }

    /**
     * Construye URL protegida con JWT para uno o múltiples archivos
     */
    buildProtectedUrl(relativePath: string | string[]): string | string[] {
        const baseUrl = this.buildBaseUrl();
        const paths = Array.isArray(relativePath) ? relativePath : [relativePath];

        // Generar un solo token para todos los archivos
        const token = this.generateAccessToken(paths);

        if (paths.length === 1) {
            return `${baseUrl}?path=${encodeURIComponent(paths[0])}&token=${token}`;
        }

        // Para múltiples archivos, crear URLs individuales con el mismo token
        return paths.map(path => `${baseUrl}?path=${encodeURIComponent(path)}&token=${token}`);
    }

    /**
     * Genera token de acceso JWT
     */
    private generateAccessToken(relativePaths: string[]): string {
        const payload: FileAccessPayload = {
            files: relativePaths
        };

        const options: jwt.SignOptions = {
            expiresIn: this.tokenExpiresIn as any,
        };

        return jwt.sign(payload, this.jwtSecret, options);
    }

    /**
     * Verifica si una o múltiples rutas están autorizadas por el token
     */
    verifyProtectedUrl(token: string, relativePath: string | string[]): boolean {
        const authorizedFiles = this.verifyAccessToken(token);
        if (!authorizedFiles) return false;

        const paths = Array.isArray(relativePath) ? relativePath : [relativePath];
        return paths.every(path => authorizedFiles.includes(path));
    }

    /**
     * Verifica token JWT y retorna las rutas autorizadas
     */
    private verifyAccessToken(token: string): string[] | null {
        try {
            const payload = jwt.verify(token, this.jwtSecret) as FileAccessPayload;
            return payload.files || [];
        } catch (error) {
            return null;
        }
    }

    /**
     * Actualiza configuración en tiempo de ejecución
     */
    setConfig(options: Partial<FileAccessOptions>): void {
        if (options.jwtSecret) {
            this.jwtSecret = options.jwtSecret;
        }
        if (options.tokenExpiresIn) {
            this.tokenExpiresIn = options.tokenExpiresIn;
        }
        if (options.endpoint) {
            this.endpoint = options.endpoint.replace(/\/+$/, "");
        }
        if (options.host !== undefined) {
            this.host = options.host ? options.host.replace(/\/+$/, "") : "";
        }
    }
}