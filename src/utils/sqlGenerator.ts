import type {
  JoinConfig,
  SelectedField,
  WhereCondition,
  WhereOperator,
  SQLDraft,
  AggregateType,
} from '@/types';

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

function formatFieldAlias(comment: string): string {
  if (!comment) return '';
  // 去除冒号及其后面的内容，只保留冒号前的部分
  const cleanComment = comment.split('：')[0].split(':')[0].trim();
  if (!cleanComment) return '';
  return `AS "${cleanComment}"`;
}

export function cleanComment(comment: string): string {
  if (!comment) return '';
  return comment.split('：')[0].split(':')[0].trim();
}

function formatFieldName(tableName: string, fieldName: string): string {
  return `\`${tableName}\`.\`${fieldName}\``;
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

export function generateSelectClause(fields: SelectedField[]): string {
  if (fields.length === 0) {
    return 'SELECT';
  }

  const selectParts = fields.map((f) => {
    const fieldRef = formatFieldName(f.tableName, f.fieldName);
    const alias = f.fieldComment || f.alias || '';

    if (f.aggregate === 'none') {
      return `  ${fieldRef} ${formatFieldAlias(alias)}`.trim();
    }

    const aggFunc = getAggregateFunction(f.aggregate);
    return `  ${aggFunc}(${fieldRef}) ${formatFieldAlias(alias)}`.trim();
  });

  return `SELECT\n${selectParts.join(',\n')}`;
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
    const rightField = formatFieldName(config.rightField.tableName, config.rightField.fieldName);

    return `${joinType} JOIN ${joinedTable} ON ${leftField} = ${rightField}`;
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
    const fieldRef =
      field.aggregate === 'none'
        ? formatFieldName(field.tableName, field.fieldName)
        : `${getAggregateFunction(field.aggregate)}(${formatFieldName(field.tableName, field.fieldName)})`;

    return `${fieldRef} ${direction}`;
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

  const selectClause = generateSelectClause(draft.selectedFields);
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
