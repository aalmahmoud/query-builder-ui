export type QueryOperation =
  | 'EQUALS' | 'NOT_EQUALS'
  | 'CONTAINS' | 'NOT_CONTAINS'
  | 'CONTAINS_IGNORE_CASE' | 'NOT_CONTAINS_IGNORE_CASE'
  | 'STARTS_WITH' | 'STARTS_WITH_IGNORE_CASE'
  | 'ENDS_WITH' | 'ENDS_WITH_IGNORE_CASE'
  | 'BETWEEN' | 'NOT_BETWEEN'
  | 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN' | 'LESS_THAN_OR_EQUAL'
  | 'IN' | 'NOT_IN'
  | 'IS_NULL' | 'IS_NOT_NULL'
  | 'IS_TRUE' | 'IS_FALSE';

export interface QueryCondition {
  field: string;
  operation?: QueryOperation;
  value?: unknown;
  values?: unknown[];
  startValue?: unknown;
  endValue?: unknown;
}

export interface SortField {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface QueryRequest {
  conditions: QueryCondition[];
  sortFields?: SortField[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
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

export const QUERY_OPERATIONS: { value: QueryOperation; label: string; category: string }[] = [
  { value: 'EQUALS', label: 'Equals', category: 'Equality' },
  { value: 'NOT_EQUALS', label: 'Not Equals', category: 'Equality' },
  { value: 'CONTAINS_IGNORE_CASE', label: 'Contains', category: 'String' },
  { value: 'STARTS_WITH_IGNORE_CASE', label: 'Starts With', category: 'String' },
  { value: 'ENDS_WITH_IGNORE_CASE', label: 'Ends With', category: 'String' },
  { value: 'BETWEEN', label: 'Between', category: 'Range' },
  { value: 'GREATER_THAN', label: 'Greater Than', category: 'Range' },
  { value: 'GREATER_THAN_OR_EQUAL', label: 'Greater or Equal', category: 'Range' },
  { value: 'LESS_THAN', label: 'Less Than', category: 'Range' },
  { value: 'LESS_THAN_OR_EQUAL', label: 'Less or Equal', category: 'Range' },
  { value: 'IN', label: 'In List', category: 'Collection' },
  { value: 'NOT_IN', label: 'Not In List', category: 'Collection' },
  { value: 'IS_NULL', label: 'Is Empty', category: 'Null' },
  { value: 'IS_NOT_NULL', label: 'Is Not Empty', category: 'Null' },
  { value: 'IS_TRUE', label: 'Is True', category: 'Boolean' },
  { value: 'IS_FALSE', label: 'Is False', category: 'Boolean' },
];
