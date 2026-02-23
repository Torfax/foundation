import { CriteriaTranslatorPort } from "../reader/criteria/CriteriaTranslatorPort";
import { ReadDataSourcePort } from "../reader/ReadDataSourcePort";
import { EntityConstructor } from "../EntityConstructor";





export interface DataSourceDriver<Q = any> {
  createCriteriaTranslator(): CriteriaTranslatorPort<Q>;

  createReadAdapter<E extends object>(
    entity: EntityConstructor<E>
  ): ReadDataSourcePort<Q, E>;

  raw<E extends object, R>(
    entity: EntityConstructor<E>,
    operation: (repository: any) => Promise<R>
  ): Promise<R>;


  
  /* 
    Para los siguientes adapter (de Write, Update, Delete) se sigue el patron:

    createWriteAdapter(repo: any): WriteDataSourceAdapter<any>;
  */
}
