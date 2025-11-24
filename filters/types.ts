
export interface QueryPagination {
  page: number;
  limit: number;
}

// types.ts
export type FilterOperator =
  | "="          // igualdad
  | "!="         // diferente
  | ">"          // mayor que
  | "<"          // menor que
  | ">="         // mayor o igual
  | "<="         // menor o igual
  | "contains"   // LIKE %valor%
  | "startsWith" // valor%
  | "endsWith"   // %valor
  | "in"         // lista de valores
  | "between"    // rango [min, max]
  | "before"     // para fechas
  | "after";     // para fechas


export interface QueryFilter {
  field: string;              // nombre de la columna/campo
  op: FilterOperator;         // operador de comparación
  value: any;                 // valor o valores
}

export interface QuerySort {
  field: string;
  direction: "ASC" | "DESC";
}

export interface QueryRequest {
  filters?: QueryFilter[];         // 0..n filtros dinámicos
  sort?: QuerySort | null;         // opcional
  pagination?: QueryPagination;    // opcional (si no, backend define defaults)
  metadata?: boolean;
}





