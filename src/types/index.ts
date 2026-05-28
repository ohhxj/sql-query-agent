export interface Database {
  name: string;
  comment: string;
  tables: Table[];
}

export interface Table {
  name: string;
  comment: string;
  fields: Field[];
}

export interface Field {
  name: string;
  type: string;
  comment: string;
}

export interface FieldMapping {
  tableId: string;  // "dbName.tableName"
  fieldName: string;
  mappings: Record<string, string>;  // { "1": "待合作", "2": "已合作" }
}

export type AggregateType =
  | 'none'
  | 'SUM'
  | 'AVG'
  | 'COUNT'
  | 'MAX'
  | 'MIN'
  | 'DATE'
  | 'DATETIME';

export type MetricScopePreset =
  | 'ALL'
  | 'VALID_ORDER'
  | 'PAY_SUCCESS'
  | 'SETTLED'
  | 'ENTERED'
  | 'REFUND'
  | 'INSTITUTION_ORDER'
  | 'ONLINE_SETTLE'
  | 'OFFLINE_SETTLE';

export type NumericTransformType =
  | 'NONE'
  | 'DIVIDE_100'
  | 'DIVIDE_1000'
  | 'PERCENT_100'
  | 'PERCENT_10000';

export interface SelectedField {
  id: string;
  tableId?: string;
  tableName: string;
  tableComment: string;
  sourceAlias?: string;
  fieldName: string;
  fieldComment: string;
  fieldType: string;
  aggregate: AggregateType;
  metricScope?: MetricScopePreset;
  numericTransform?: NumericTransformType;
  valueMappings?: Record<string, string>;
  orderBy?: 'ASC' | 'DESC' | null;
  alias?: string;
}

export type WhereOperator =
  | '=' | '!=' | '>' | '<' | '>=' | '<='
  | 'LIKE' | 'IN' | 'NOT_IN' | 'IS_NULL' | 'IS_NOT_NULL' | 'BETWEEN';

export type WhereConnector = 'AND' | 'OR';

export interface WhereCondition {
  id: string;
  tableName: string;
  fieldName: string;
  operator: WhereOperator;
  value: string | string[];
  connector: WhereConnector | null;
}

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT';

export interface JoinConfig {
  id: string;
  alias: string;
  joinedDbName: string;
  joinedTableName: string;
  joinedTableComment: string;
  joinType: JoinType;
  leftField: { tableName: string; fieldName: string };
  rightField: { tableName: string; fieldName: string };
}

export interface SQLDraft {
  selectedFields: SelectedField[];
  mainTable: string;
  mainTableComment: string;
  joinConfigs: JoinConfig[];
  whereConditions: WhereCondition[];
  groupByFields: string[];
  orderByFields: { field: SelectedField; direction: 'ASC' | 'DESC' | null }[];
  limit: number | null;
}

export interface QueryHistorySnapshot {
  selectedDatabase: string | null;
  mainTable: Table | null;
  selectedFields: SelectedField[];
  joinConfigs: JoinConfig[];
  joinSelectedFields: SelectedField[];
  whereConditions: WhereCondition[];
  groupByFields: string[];
  orderByFields: { field: SelectedField; direction: 'ASC' | 'DESC' | null }[];
  limit: number | null;
}

export interface QueryHistoryItem {
  id: string;
  title: string;
  sql: string;
  createdAt: string;
  snapshot: QueryHistorySnapshot;
}

export interface AIValidationResult {
  valid: boolean;
  issues: {
    type: 'syntax' | 'logic' | 'performance' | 'security';
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestion?: string;
  }[];
}

export interface RiskItem {
  id: string;
  level: 'high' | 'medium' | 'low';
  rule: string;
  message: string;
  suggestion?: string;
}

export interface RiskResult {
  high: RiskItem[];
  medium: RiskItem[];
  low: RiskItem[];
}

export interface ImportedJSON {
  databases: Database[];
}
