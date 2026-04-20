export interface Database {
  name: string;
  comment: string;
  tables: Table[];
}

export interface Table {
  name: string;
  comment: string;
  tags: string[];
  fields: Field[];
}

export interface Field {
  name: string;
  type: string;
  comment: string;
}

export interface Tag {
  id: string;
  name: string;
}

export type AggregateType = 'none' | 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN';

export interface SelectedField {
  tableName: string;
  tableComment: string;
  fieldName: string;
  fieldComment: string;
  fieldType: string;
  aggregate: AggregateType;
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
  tags?: Tag[];
}
