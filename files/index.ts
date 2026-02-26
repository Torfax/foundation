import { FileAccessService } from "./FileAccessService";
import { MulterFileUploadService } from "./MulterFileUploadService";
import FileAccessOptions from "./types/FileAccessOptions";
import UploadOptions from "./types/UploadOptions";

export interface FilesModuleOptions {
    upload?: UploadOptions;
    access?: FileAccessOptions;
}

/**
 * FilesModule
 *
 * Note/Todo:
 *
 * Este módulo es el primer caso donde servicios internos requieren
 * configuraciones externas definidas por la aplicación.
 *
 * El patrón adoptado es:
 *
 * 1. Los módulos pueden recibir opciones de configuración desde el constructor.
 * 2. El Core permanece agnóstico (no define configuraciones concretas).
 * 3. La aplicación (AppContainer / bootstrap) es responsable de proporcionar
 *    dichas configuraciones.
 *
 * Escenario futuro:
 * Si un módulo necesita múltiples configuraciones simultáneas
 * (por ejemplo: múltiples destinos de archivos, múltiples secretos, etc.),
 * la estrategia recomendada es exponer factories en el API del módulo
 * para crear nuevas instancias bajo demanda.
 *
 * Ejemplo:
 *   files.createUpload({ destination: "uploads/invoices" })
 *
 * Este patrón deberá aplicarse también a cualquier módulo futuro
 * que tenga servicios con configuraciones internas.
 */
export class FilesModule {

    private readonly multerFileUploadService: MulterFileUploadService;
    private readonly fileAccessService: FileAccessService;

    constructor(options?: FilesModuleOptions) {

        this.multerFileUploadService =
            new MulterFileUploadService(options?.upload);

        this.fileAccessService =
            new FileAccessService(
                options?.access ?? {
                    jwtSecret: "change_me"
                }
            );
    }

    get api() {
        return {
            upload: this.multerFileUploadService,
            access: this.fileAccessService,
            createUpload: (options: UploadOptions) =>
                new MulterFileUploadService(options),

            createAccess: (options: FileAccessOptions) =>
                new FileAccessService(options),
        };
    }

}