import { ConfigService } from "@src/core/config/ConfigService";
import { FilesModule, FilesModuleOptions } from "./files";

export interface AppCoreOptions {
    files?: FilesModuleOptions;
}


export class AppCore {

    public readonly configService: ConfigService;
    public readonly filesModule: FilesModule;

    constructor(options: AppCoreOptions = {}) {
        this.configService = new ConfigService();
        this.filesModule = new FilesModule(options.files)
    }

    get files() {
        return this.filesModule.api;
    }

}