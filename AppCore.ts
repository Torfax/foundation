import { ConfigService } from "@src/core/config/ConfigService";
import { UtilsModule } from "./utils";
import { FilesModule, FilesModuleOptions } from "./files";

export interface AppCoreOptions {
    files?: FilesModuleOptions;
}


export class AppCore {

    public readonly configService: ConfigService;
    public readonly utilsModule: UtilsModule;
    public readonly filesModule: FilesModule;

    constructor(options: AppCoreOptions = {}) {
        this.configService = new ConfigService();
        this.utilsModule = new UtilsModule();
        this.filesModule = new FilesModule(options.files)
    }


    get utils() {
        return this.utilsModule.api;
    }

    get files() {
        return this.filesModule.api;
    }

}