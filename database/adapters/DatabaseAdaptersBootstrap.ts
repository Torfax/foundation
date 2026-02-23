import { AppDataSource } from "@src/database/DataSource";
import { DatabaseDriverName } from "./DatabaseDriverName";
import { DriverRegistry } from "./DriverRegistry";
import { TypeOrmDriver } from "./typeorm/TypeOrmDriver";

export class DatabaseAdaptersBootstrap {

    static run() {
        DriverRegistry.register(
            DatabaseDriverName.TYPEORM,
            new TypeOrmDriver(AppDataSource) //TODO: Esto tambien deberia de enviarse por parametro..
        );
    }

}
