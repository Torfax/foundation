import { CriteriaTranslatorPort } from "../reader/criteria/CriteriaTranslatorPort";
import { ReadDataSourcePort } from "../reader/ReadDataSourcePort";
import { EntityConstructor } from "../EntityConstructor";
import { UpdateDataSourcePort } from "../update/UpdateDataSourcePort";





export interface DataSourceDriver<Q = any> {
  createCriteriaTranslator(): CriteriaTranslatorPort<Q>;

  createReadAdapter<E extends object>(
    entity: EntityConstructor<E>
  ): ReadDataSourcePort<Q, E>;

  createUpdateAdapter<E extends object>(
    entity: EntityConstructor<E>
  ): UpdateDataSourcePort<Q, E>;

  raw<E extends object, R>(
    entity: EntityConstructor<E>,
    operation: (repository: any) => Promise<R>
  ): Promise<R>;


  
  /* 
    Para los siguientes adapter (de Write, Update, Delete) se sigue el patron:

    createWriteAdapter(repo: any): WriteDataSourceAdapter<any>;
  */
}
