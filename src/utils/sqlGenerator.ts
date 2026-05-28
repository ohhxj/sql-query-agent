import type {
  JoinConfig,
  MetricScopePreset,
  NumericTransformType,
  SelectedField,
  WhereCondition,
  WhereOperator,
  SQLDraft,
  AggregateType,
} from '@/types';
import { stripMappingsFromComment } from '@/utils/fieldMapping';
import { getMetricScopeShortLabel } from '@/utils/metricScope';

export function isTrueAggregate(aggregate: AggregateType): boolean {
  return ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN'].includes(aggregate);
}

function getAggregateFunction(aggregate: AggregateType): string {
  switch (aggregate) {
    case 'SUM':
      return 'SUM';
    case 'AVG':
      return 'AVG';
    case 'COUNT':
      return 'COUNT';
    case 'MAX':
      return 'MAX';
    case 'MIN':
      return 'MIN';
    default:
      return '';
  }
}

function applyNumericTransform(expression: string, transform: NumericTransformType | undefined): string {
  switch (transform || 'NONE') {
    case 'DIVIDE_100':
    case 'PERCENT_100':
      return `(${expression} / 100)`;
    case 'DIVIDE_1000':
      return `(${expression} / 1000)`;
    case 'PERCENT_10000':
      return `(${expression} / 10000)`;
    case 'NONE':
    default:
      return expression;
  }
}

export function formatSelectedFieldExpression(field: SelectedField): string {
  const fieldRef = formatFieldName(field.tableName, field.fieldName, field.sourceAlias);

  if (field.aggregate === 'DATE') {
    return `DATE_FORMAT(FROM_UNIXTIME(${fieldRef}), '%Y-%m-%d')`;
  }

  if (field.aggregate === 'DATETIME') {
    return `DATE_FORMAT(FROM_UNIXTIME(${fieldRef}), '%Y-%m-%d %H:%i:%s')`;
  }

  if (isTrueAggregate(field.aggregate)) {
    return applyNumericTransform(`${getAggregateFunction(field.aggregate)}(${fieldRef})`, field.numericTransform);
  }

  return applyNumericTransform(fieldRef, field.numericTransform);
}

function buildMetricScopeCondition(scope: MetricScopePreset | undefined, mainTable: string): string | null {
  const flowPointRef = formatFieldName(mainTable, 'flow_point');
  const enterStatusRef = formatFieldName(mainTable, 'enter_status');
  const institutionOrderRef = formatFieldName(mainTable, 'has_institution_order');
  const settleTypeRef = formatFieldName(mainTable, 'order_settle_type');

  switch (scope || 'ALL') {
    case 'VALID_ORDER':
      return `${flowPointRef} IN ('PAY_SUCC', 'SETTLE', 'CONFIRM')`;
    case 'PAY_SUCCESS':
      return `${flowPointRef} = 'PAY_SUCC'`;
    case 'SETTLED':
      return `${flowPointRef} = 'SETTLE'`;
    case 'ENTERED':
      return `${enterStatusRef} = '1'`;
    case 'REFUND':
      return `${flowPointRef} = 'REFUND'`;
    case 'INSTITUTION_ORDER':
      return `${institutionOrderRef} = '1'`;
    case 'ONLINE_SETTLE':
      return `${settleTypeRef} = '2'`;
    case 'OFFLINE_SETTLE':
      return `${settleTypeRef} = '1'`;
    case 'ALL':
    default:
      return null;
  }
}

function formatFieldAlias(comment: string): string {
  if (!comment) return '';
  const cleanComment = stripMappingsFromComment(comment)
    .split('：')[0]
    .split(':')[0]
    .trim();
  if (!cleanComment) return '';
  return `AS "${cleanComment}"`;
}

export function cleanComment(comment: string): string {
  if (!comment) return '';
  return stripMappingsFromComment(comment)
    .split('：')[0]
    .split(':')[0]
    .trim();
}

function formatFieldName(tableName: string, fieldName: string, sourceAlias?: string): string {
  const source = sourceAlias || tableName;
  return `\`${source}\`.\`${fieldName}\``;
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "\\'");
}

function buildMappingAlias(field: SelectedField): string {
  const baseLabel = cleanComment(field.fieldComment) || field.alias || field.fieldName;
  return `${baseLabel}名称`;
}

function buildFieldAlias(field: SelectedField): string {
  const baseLabel = cleanComment(field.fieldComment) || field.alias || field.fieldName;
  const scope = field.metricScope || 'ALL';
  let nextLabel = baseLabel;
  if (scope !== 'ALL') {
    nextLabel = `${nextLabel}${getMetricScopeShortLabel(scope)}`;
  }
  return nextLabel;
}

function formatMappedField(field: SelectedField, fieldRef: string): string | null {
  if (!field.valueMappings || Object.keys(field.valueMappings).length === 0) {
    return null;
  }

  const whenClauses = Object.entries(field.valueMappings).map(
    ([key, value]) => `WHEN '${escapeSqlString(key)}' THEN '${escapeSqlString(value)}'`
  );

  if (whenClauses.length === 0) {
    return null;
  }

  return `CASE ${fieldRef} ${whenClauses.join(' ')} ELSE '' END AS "${escapeSqlString(buildMappingAlias(field))}"`;
}

function formatValue(value: string | string[], operator: WhereOperator): string {
  if (operator === 'IS_NULL' || operator === 'IS_NOT_NULL') {
    return '';
  }

  if (Array.isArray(value)) {
    if (operator === 'BETWEEN' && value.length === 2) {
      return `'${value[0]}' AND '${value[1]}'`;
    }
    return value.map((v) => `'${v}'`).join(', ');
  }

  if (operator === 'IN' || operator === 'NOT_IN') {
    const values = value.split(',').map((v) => `'${v.trim()}'`).join(', ');
    return values;
  }

  return `'${value}'`;
}

function formatWhereOperator(operator: WhereOperator): string {
  switch (operator) {
    case 'NOT_IN':
      return 'NOT IN';
    case 'IS_NULL':
      return 'IS NULL';
    case 'IS_NOT_NULL':
      return 'IS NOT NULL';
    default:
      return operator;
  }
}

export function generateSelectClause(fields: SelectedField[], mainTable: string): string {
  if (fields.length === 0) {
    return 'SELECT';
  }

  const selectParts = fields.map((f) => {
    const fieldRef = formatFieldName(f.tableName, f.fieldName, f.sourceAlias);
    if (f.aggregate === 'none' && f.valueMappings && Object.keys(f.valueMappings).length > 0) {
      return `  ${formatMappedField(f, fieldRef)}`.trim();
    }

    const alias = f.fieldComment || f.alias || '';
    if (f.aggregate === 'none') {
      return `  ${applyNumericTransform(fieldRef, f.numericTransform)} ${formatFieldAlias(buildFieldAlias(f) || alias)}`.trim();
    }

    if (f.aggregate === 'DATE' || f.aggregate === 'DATETIME') {
      return `  ${formatSelectedFieldExpression(f)} ${formatFieldAlias(alias)}`.trim();
    }

    return formatAggregateSelectField(f, mainTable);
  });

  return `SELECT\n${selectParts.join(',\n')}`;
}

function formatAggregateSelectField(field: SelectedField, mainTable: string): string {
  const fieldRef = formatFieldName(field.tableName, field.fieldName, field.sourceAlias);
  const alias = buildFieldAlias(field);
  const metricCondition = buildMetricScopeCondition(field.metricScope, mainTable);

  if (!metricCondition) {
    return `  ${applyNumericTransform(`${getAggregateFunction(field.aggregate)}(${fieldRef})`, field.numericTransform)} ${formatFieldAlias(alias)}`.trim();
  }

  switch (field.aggregate) {
    case 'COUNT':
      return `  COUNT(CASE WHEN ${metricCondition} THEN ${fieldRef} END) ${formatFieldAlias(alias)}`.trim();
    case 'SUM':
      return `  ${applyNumericTransform(`SUM(CASE WHEN ${metricCondition} THEN ${fieldRef} ELSE 0 END)`, field.numericTransform)} ${formatFieldAlias(alias)}`.trim();
    case 'AVG':
      return `  ${applyNumericTransform(`AVG(CASE WHEN ${metricCondition} THEN ${fieldRef} END)`, field.numericTransform)} ${formatFieldAlias(alias)}`.trim();
    case 'MAX':
      return `  ${applyNumericTransform(`MAX(CASE WHEN ${metricCondition} THEN ${fieldRef} END)`, field.numericTransform)} ${formatFieldAlias(alias)}`.trim();
    case 'MIN':
      return `  ${applyNumericTransform(`MIN(CASE WHEN ${metricCondition} THEN ${fieldRef} END)`, field.numericTransform)} ${formatFieldAlias(alias)}`.trim();
    default:
      return `  ${applyNumericTransform(`${getAggregateFunction(field.aggregate)}(${fieldRef})`, field.numericTransform)} ${formatFieldAlias(alias)}`.trim();
  }
}

export function generateFromClause(mainTable: string): string {
  return `FROM \`${mainTable}\``;
}

export function generateJoinClause(configs: JoinConfig[]): string {
  if (configs.length === 0) {
    return '';
  }

  const joinParts = configs.map((config) => {
    const joinType = config.joinType;
    const joinedTable = config.joinedDbName
      ? `\`${config.joinedDbName}\`.\`${config.joinedTableName}\``
      : `\`${config.joinedTableName}\``;
    const leftField = formatFieldName(config.leftField.tableName, config.leftField.fieldName);
    const rightField = formatFieldName(config.rightField.tableName, config.rightField.fieldName, config.alias);

    return `${joinType} JOIN ${joinedTable} AS \`${config.alias}\` ON ${leftField} = ${rightField}`;
  });

  return joinParts.join('\n');
}

export function generateWhereClause(conditions: WhereCondition[]): string {
  if (conditions.length === 0) {
    return '';
  }

  const whereParts = conditions.map((condition) => {
    const field = formatFieldName(condition.tableName, condition.fieldName);
    const operator = formatWhereOperator(condition.operator);
    const value = formatValue(condition.value, condition.operator);
    const connector = condition.connector ? ` ${condition.connector}` : '';

    if (condition.operator === 'IS_NULL' || condition.operator === 'IS_NOT_NULL') {
      return `${field} ${operator}${connector}`;
    }

    return `${field} ${operator} ${value}${connector}`;
  });

  return `WHERE\n  ${whereParts.join('\n    ')}`;
}

export function generateGroupByClause(groupByFields: string[]): string {
  if (groupByFields.length === 0) {
    return '';
  }

  return `GROUP BY\n  ${groupByFields.join(',\n  ')}`;
}

export function generateOrderByClause(
  orderByFields: { field: SelectedField; direction: 'ASC' | 'DESC' | null }[]
): string {
  const orderedFields = orderByFields.filter((o) => o.direction !== null);

  if (orderedFields.length === 0) {
    return '';
  }

  const orderParts = orderedFields.map(({ field, direction }) => {
    return `${formatSelectedFieldExpression(field)} ${direction}`;
  });

  return `ORDER BY\n  ${orderParts.join(',\n  ')}`;
}

export function generateLimitClause(limit: number | null): string {
  if (limit === null) {
    return '';
  }

  return `LIMIT ${limit}`;
}

export function generateSQL(draft: SQLDraft): string {
  const parts: string[] = [];

  const selectClause = generateSelectClause(draft.selectedFields, draft.mainTable);
  parts.push(selectClause);

  const fromClause = generateFromClause(draft.mainTable);
  parts.push(fromClause);

  const joinClause = generateJoinClause(draft.joinConfigs);
  if (joinClause) {
    parts.push(joinClause);
  }

  const whereClause = generateWhereClause(draft.whereConditions);
  if (whereClause) {
    parts.push(whereClause);
  }

  const groupByClause = generateGroupByClause(draft.groupByFields);
  if (groupByClause) {
    parts.push(groupByClause);
  }

  const orderByClause = generateOrderByClause(draft.orderByFields);
  if (orderByClause) {
    parts.push(orderByClause);
  }

  const limitClause = generateLimitClause(draft.limit);
  if (limitClause) {
    parts.push(limitClause);
  }

  return parts.join('\n');
}

export function createDraft(
  selectedFields: SelectedField[],
  mainTable: string,
  mainTableComment: string,
  joinConfigs: JoinConfig[],
  whereConditions: WhereCondition[],
  groupByFields: string[],
  orderByFields: { field: SelectedField; direction: 'ASC' | 'DESC' | null }[],
  limit: number | null
): SQLDraft {
  return {
    selectedFields,
    mainTable,
    mainTableComment,
    joinConfigs,
    whereConditions,
    groupByFields,
    orderByFields,
    limit,
  };
}
