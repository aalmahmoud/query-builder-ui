export type QueryOperation =
  | 'EQUALS' | 'NOT_EQUALS'
  | 'CONTAINS' | 'NOT_CONTAINS'
  | 'CONTAINS_IGNORE_CASE' | 'NOT_CONTAINS_IGNORE_CASE'
  | 'STARTS_WITH' | 'NOT_STARTS_WITH'
  | 'STARTS_WITH_IGNORE_CASE' | 'NOT_STARTS_WITH_IGNORE_CASE'
  | 'ENDS_WITH' | 'NOT_ENDS_WITH'
  | 'ENDS_WITH_IGNORE_CASE' | 'NOT_ENDS_WITH_IGNORE_CASE'
  | 'BETWEEN' | 'NOT_BETWEEN'
  | 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN' | 'LESS_THAN_OR_EQUAL'
  | 'IN' | 'NOT_IN'
  | 'IS_NULL' | 'IS_NOT_NULL'
  | 'IS_TRUE' | 'IS_FALSE';

export type LogicOperator = 'AND' | 'OR';

export interface QueryCondition {
  field: string;
  operation?: QueryOperation;
  value?: unknown;
  values?: unknown[];
  startValue?: unknown;
  endValue?: unknown;
}

/** Recursive boolean group: conditions and nested groups combined by `logic`. */
export interface QueryGroup {
  logic: LogicOperator;
  conditions: QueryCondition[];
  groups: QueryGroup[];
}

export interface SortField {
  field: string;
  direction: 'ASC' | 'DESC';
}

/** v2 request — itself the top-level boolean group, plus sort/projection hints. */
export interface QueryRequest {
  logic?: LogicOperator;
  conditions?: QueryCondition[];
  groups?: QueryGroup[];
  sortFields?: SortField[];
  select?: string[];
}

/** Stable pagination envelope (matches backend PageResponse<T>). */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
/** @deprecated alias kept so existing imports of `Page<T>` keep compiling. */
export type Page<T> = PageResponse<T>;

// ---- self-describing metadata (GET /{entity}/metadata) ----

export interface FieldMeta {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum' | 'uuid';
  operations: QueryOperation[];
  sortable: boolean;
  filterable: boolean;
  computed: boolean;
  enumValues?: string[];
}

export interface EntityMetadata {
  entity: string;
  fields: FieldMeta[];
}

export interface ExportRequest {
  queryRequest: QueryRequest;
  selectedColumns: string[];
  format: 'EXCEL' | 'PDF';
  friendlyHeaders: Record<string, string>;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  rejectedValue: unknown;
}

/** Human labels for operations (used when metadata doesn't supply its own). */
export const OPERATION_LABELS: Record<QueryOperation, string> = {
  EQUALS: 'Equals', NOT_EQUALS: 'Not Equals',
  CONTAINS: 'Contains', NOT_CONTAINS: 'Not Contains',
  CONTAINS_IGNORE_CASE: 'Contains', NOT_CONTAINS_IGNORE_CASE: 'Not Contains',
  STARTS_WITH: 'Starts With', NOT_STARTS_WITH: 'Not Starts With',
  STARTS_WITH_IGNORE_CASE: 'Starts With', NOT_STARTS_WITH_IGNORE_CASE: 'Not Starts With',
  ENDS_WITH: 'Ends With', NOT_ENDS_WITH: 'Not Ends With',
  ENDS_WITH_IGNORE_CASE: 'Ends With', NOT_ENDS_WITH_IGNORE_CASE: 'Not Ends With',
  BETWEEN: 'Between', NOT_BETWEEN: 'Not Between',
  GREATER_THAN: 'Greater Than', GREATER_THAN_OR_EQUAL: 'Greater or Equal',
  LESS_THAN: 'Less Than', LESS_THAN_OR_EQUAL: 'Less or Equal',
  IN: 'In List', NOT_IN: 'Not In List',
  IS_NULL: 'Is Empty', IS_NOT_NULL: 'Is Not Empty',
  IS_TRUE: 'Is True', IS_FALSE: 'Is False',
};

export function operationLabel(op: QueryOperation): string {
  return OPERATION_LABELS[op] ?? op;
}
