import { DataSourceDriver } from "./DataSourceDriver";
import { DatabaseDriverName } from "./DatabaseDriverName";

export class DriverRegistry {

  private static drivers = new Map<
    DatabaseDriverName,
    DataSourceDriver<any>
  >();


  static register<Q>(
    name: DatabaseDriverName,
    driver: DataSourceDriver<Q>
  ) {
    this.drivers.set(name, driver);
  }
  static get<Q>(
    name: DatabaseDriverName
  ): DataSourceDriver<Q> {
    const driver = this.drivers.get(name);
    if (!driver) {
      throw new Error(`Database driver not registered: ${name}`);
    }
    return driver as DataSourceDriver<Q>;
  }
}

