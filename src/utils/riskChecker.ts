import type { RiskItem, RiskResult } from '@/types';

interface RiskRule {
  id: string;
  level: 'high' | 'medium' | 'low';
  name: string;
  message: string;
  suggestion?: string;
  check: (sql: string) => boolean;
}

const riskRules: RiskRule[] = [
  {
    id: 'RR-001',
    level: 'high',
    name: 'SELECT *',
    message: '检测到 SELECT *，建议明确指定字段',
    suggestion: '使用明确的字段列表替代 SELECT *，避免返回不必要的数据列',
    check: (sql) => /\bSELECT\s+\*/i.test(sql),
  },
  {
    id: 'RR-002',
    level: 'high',
    name: 'No LIMIT',
    message: '查询缺少 LIMIT 子句，可能返回大量数据',
    suggestion: '添加 LIMIT 限制返回结果数量，或使用分页查询',
    check: (sql) => {
      const hasSelect = /\bSELECT\b/i.test(sql);
      const hasWhere = /\bWHERE\b/i.test(sql);
      const hasLimit = /\bLIMIT\b/i.test(sql);
      return hasSelect && hasWhere && !hasLimit;
    },
  },
  {
    id: 'RR-003',
    level: 'high',
    name: 'Function on Indexed Field',
    message: 'WHERE 子句对索引字段使用函数或运算，可能导致全表扫描',
    suggestion: '将函数操作移到比较值一侧，如 WHERE created_at >= "2024-01-01" 而非 WHERE YEAR(created_at) = 2024',
    check: (sql) => {
      const functionPattern = /\bWHERE\b[\s\S]*?\b(YEAR|MONTH|DAY|HOUR|MINUTE|SECOND|LOWER|UPPER|TRIM|LENGTH|ABS)\s*\([^)]+\)\s*[=<>!]/i;
      const operationPattern = /\bWHERE\b[\s\S]*?[`"\w]+\s*\*\s*[\d.]+\s*[><=!]/i;
      return functionPattern.test(sql) || operationPattern.test(sql);
    },
  },
  {
    id: 'RR-004',
    level: 'high',
    name: 'Leading Wildcard in LIKE',
    message: 'LIKE 使用前导通配符（%xxx），无法使用索引',
    suggestion: '将通配符移到字符串末尾，如 LIKE "xxx%" 而非 LIKE "%xxx"，或使用全文索引',
    check: (sql) => {
      const leadingWildcardPattern = /\bLIKE\b\s*['"]%[^%]+['"]/i;
      return leadingWildcardPattern.test(sql);
    },
  },
  {
    id: 'RR-005',
    level: 'high',
    name: 'OR Without Index',
    message: 'WHERE 子句使用 OR 连接多个条件，可能导致全表扫描',
    suggestion: '考虑使用 UNION 替代 OR，或确保 OR 连接的所有字段都有索引',
    check: (sql) => {
      const orPattern = /\bWHERE\b[\s\S]*?\bOR\b[\s\S]*?\bWHERE\b/i;
      return orPattern.test(sql) && !/\bINDEX\b/i.test(sql) && !/\bUSE\s+INDEX\b/i.test(sql);
    },
  },
  {
    id: 'RR-006',
    level: 'medium',
    name: 'Large OFFSET',
    message: 'OFFSET 值较大（>1000），深分页查询性能较差',
    suggestion: '使用基于主键或上次查询结果的游标分页（keyset pagination）替代 OFFSET',
    check: (sql) => {
      const offsetPattern = /\bOFFSET\s+(\d+)/i;
      const match = sql.match(offsetPattern);
      if (match) {
        const offset = parseInt(match[1], 10);
        return offset > 1000;
      }
      return false;
    },
  },
  {
    id: 'RR-007',
    level: 'medium',
    name: 'Multiple JOINs Without Proper ON',
    message: '多表联查（≥3表）但可能缺少合适的 ON 条件',
    suggestion: '确保每个 JOIN 都有明确的 ON 条件，避免产生笛卡尔积',
    check: (sql) => {
      const joinCount = (sql.match(/\bJOIN\b/gi) || []).length;
      const onCount = (sql.match(/\bON\b/gi) || []).length;
      return joinCount >= 2 && onCount < joinCount;
    },
  },
  {
    id: 'RR-008',
    level: 'medium',
    name: 'Large IN Clause',
    message: 'IN 子句包含大量值（>100），可能导致性能问题',
    suggestion: '考虑使用临时表、JOIN 或其他优化方式替代大量 IN 值',
    check: (sql) => {
      const inClausePattern = /\bIN\s*\(\s*['"]?[\w]+['"]?\s*(,\s*['"]?[\w]+['"]?\s*){100,}\)/gi;
      return inClausePattern.test(sql);
    },
  },
  {
    id: 'RR-009',
    level: 'low',
    name: 'No ORDER BY',
    message: '未指定排序方式，大结果集每次返回顺序可能不一致',
    suggestion: '添加明确的 ORDER BY 子句确保结果顺序稳定',
    check: (sql) => {
      const hasSelect = /\bSELECT\b/i.test(sql);
      const hasOrderBy = /\bORDER\s+BY\b/i.test(sql);
      const hasGroupBy = /\bGROUP\s+BY\b/i.test(sql);
      return hasSelect && !hasOrderBy && !hasGroupBy;
    },
  },
  {
    id: 'RR-010',
    level: 'low',
    name: 'Deprecated SQL_CALC_FOUND_ROWS',
    message: '使用了 SQL_CALC_FOUND_ROWS，该特性已废弃',
    suggestion: '使用 COUNT(*) 和分页查询替代，或使用窗口函数',
    check: (sql) => /\bSQL_CALC_FOUND_ROWS\b/i.test(sql),
  },
];

function createRiskItem(rule: RiskRule): RiskItem {
  return {
    id: rule.id,
    level: rule.level,
    rule: rule.name,
    message: rule.message,
    suggestion: rule.suggestion,
  };
}

export function checkAllRisks(sql: string): RiskResult {
  const result: RiskResult = {
    high: [],
    medium: [],
    low: [],
  };

  if (!sql || sql.trim() === '') {
    return result;
  }

  for (const rule of riskRules) {
    if (rule.check(sql)) {
      const riskItem = createRiskItem(rule);
      switch (rule.level) {
        case 'high':
          result.high.push(riskItem);
          break;
        case 'medium':
          result.medium.push(riskItem);
          break;
        case 'low':
          result.low.push(riskItem);
          break;
      }
    }
  }

  return result;
}

export function getRiskSummary(result: RiskResult): { total: number; high: number; medium: number; low: number } {
  return {
    total: result.high.length + result.medium.length + result.low.length,
    high: result.high.length,
    medium: result.medium.length,
    low: result.low.length,
  };
}

export function hasHighRisk(result: RiskResult): boolean {
  return result.high.length > 0;
}
