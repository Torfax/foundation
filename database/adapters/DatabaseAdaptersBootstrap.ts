import { DatabaseDriverName } from "./DatabaseDriverName";
import { DriverRegistry } from "./DriverRegistry";
import { TypeOrmDriver } from "./typeorm/TypeOrmDriver";
import { DataSource } from "typeorm";

export class DatabaseAdaptersBootstrap {

    static run(dataSource : DataSource) {
        DriverRegistry.register(
            DatabaseDriverName.TYPEORM,
            new TypeOrmDriver(dataSource)
        );
    }

}
