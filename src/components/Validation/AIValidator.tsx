import { useState, useCallback } from 'react';
import { useQueryBuilderStore } from '@/stores/useQueryBuilderStore';
import { generateSQL, createDraft } from '@/utils/sqlGenerator';

interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  optimizedSQL?: string;
}

export function AIValidator() {
  const [result, setResult] = useState<{
    valid: boolean;
    issues: ValidationIssue[];
    optimizedSQL?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    mainTable,
    selectedFields,
    joinConfigs,
    joinSelectedFields,
    whereConditions,
    groupByFields,
    orderByFields,
    limit,
  } = useQueryBuilderStore();

  const handleValidate = useCallback(async () => {
    if (!mainTable) {
      setError('请先选择主表');
      return;
    }

    const allSelectedFields = [...selectedFields, ...joinSelectedFields];
    if (allSelectedFields.length === 0) {
      setError('请至少选择一个字段');
      return;
    }

    setLoading(true);
    setError(null);

    // 模拟 AI 分析延迟
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const issues: ValidationIssue[] = [];
    let optimizedSQL = '';

    // 生成当前 SQL 用于分析
    const draft = createDraft(
      allSelectedFields,
      mainTable.name,
      mainTable.comment,
      joinConfigs,
      whereConditions,
      groupByFields,
      orderByFields,
      limit
    );
    const currentSQL = generateSQL(draft);
    optimizedSQL = currentSQL;

    // 规则检查
    const hasLimit = limit !== null && limit > 0;
    const hasSelectStar = allSelectedFields.some((f) => f.fieldName === '*');
    const hasNoWhere = whereConditions.length === 0;
    const hasDistinct = currentSQL.toLowerCase().includes('distinct');

    // 大结果集风险
    if (!hasLimit && allSelectedFields.length > 5) {
      issues.push({
        type: 'performance',
        severity: 'warning',
        message: '查询返回字段过多，且未设置 LIMIT，可能返回大量数据导致内存溢出',
        suggestion: '建议添加 LIMIT 限制返回条数，如 LIMIT 1000',
      });
      optimizedSQL = currentSQL + '\nLIMIT 1000';
    }

    // SELECT *
    if (hasSelectStar) {
      issues.push({
        type: 'performance',
        severity: 'warning',
        message: '使用了 SELECT * 会查询所有字段，增加网络传输负担',
        suggestion: '建议只选择需要的字段',
      });
    }

    // 无 WHERE 条件
    if (hasNoWhere && !hasLimit) {
      issues.push({
        type: 'warning',
        severity: 'warning',
        message: '查询没有 WHERE 条件，将返回表中所有数据',
        suggestion: '建议添加筛选条件减少返回数据量',
      });
    }

    // DISTINCT 使用
    if (hasDistinct) {
      issues.push({
        type: 'performance',
        severity: 'info',
        message: '使用了 DISTINCT 去重，数据库需要额外处理',
        suggestion: '如果数据量大，考虑在应用层去重或添加 WHERE 条件',
      });
    }

    // JOIN 过多
    if (joinConfigs.length > 3) {
      issues.push({
        type: 'performance',
        severity: 'warning',
        message: `关联了 ${joinConfigs.length} 张表，查询复杂度较高`,
        suggestion: '建议减少关联表数量或拆分查询',
      });
    }

    // 无聚合函数但有 GROUP BY
    const hasAggregate = allSelectedFields.some((f) => f.aggregate !== 'none');
    if (groupByFields.length > 0 && !hasAggregate) {
      issues.push({
        type: 'logic',
        severity: 'info',
        message: '使用了 GROUP BY 但没有聚合函数',
        suggestion: 'GROUP BY 需要配合聚合函数使用',
      });
    }

    // LIMIT 值过大
    if (limit && limit > 10000) {
      issues.push({
        type: 'performance',
        severity: 'warning',
        message: `LIMIT 设置为 ${limit}，可能返回过多数据`,
        suggestion: '建议 LIMIT 值不超过 10000',
      });
    }

    // 全部通过
    if (issues.length === 0) {
      issues.push({
        type: 'success',
        severity: 'info',
        message: 'SQL 检查通过，未发现问题',
      });
    }

    setResult({
      valid: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
      optimizedSQL: issues.some((i) => i.severity === 'warning' || i.severity === 'error') ? optimizedSQL : undefined,
    });
    setLoading(false);
  }, [mainTable, selectedFields, joinConfigs, joinSelectedFields, whereConditions, groupByFields, orderByFields, limit]);

  const handleApplyOptimized = () => {
    if (result?.optimizedSQL) {
      // 将优化后的 SQL 复制到剪贴板
      navigator.clipboard.writeText(result.optimizedSQL);
      alert('优化后的 SQL 已复制到剪贴板');
    }
  };

  return (
    <div className="border-t border-[var(--border-subtle)]">
      <div className="flex items-center justify-between p-3">
        <span className="text-sm font-medium text-[var(--text-primary)]">AI 校验</span>
        <button
          onClick={handleValidate}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {loading ? '分析中...' : '校验'}
        </button>
      </div>

      {error && (
        <div className="mx-3 mb-3 p-2 bg-risk-high-bg text-risk-high text-sm rounded-md">
          {error}
        </div>
      )}

      {loading && (
        <div className="px-3 pb-3 text-center text-sm text-[var(--text-tertiary)]">
          <span className="animate-pulse">正在分析您的 SQL...</span>
        </div>
      )}

      {result && !loading && (
        <div className="px-3 pb-3">
          {result.valid && result.issues.length === 0 && (
            <div className="p-3 bg-risk-low-bg rounded-md text-center text-sm text-risk-low">
              ✓ 校验通过 - SQL 看起来没问题！
            </div>
          )}

          {result.issues.length > 0 && (
            <div className="space-y-2">
              {result.issues.map((issue, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md text-sm ${
                    issue.severity === 'error'
                      ? 'bg-risk-high-bg text-risk-high border border-risk-high/30'
                      : issue.severity === 'warning'
                      ? 'bg-risk-medium-bg text-risk-medium border border-risk-medium/30'
                      : 'bg-risk-low-bg text-risk-low border border-risk-low/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">
                      {issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : 'ℹ'}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{issue.message}</div>
                      {issue.suggestion && (
                        <div className="mt-1 text-xs opacity-80">{issue.suggestion}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {result.optimizedSQL && (
                <div className="mt-3 p-3 bg-[var(--bg-elevated)] rounded-md border border-[var(--border-default)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">优化建议</span>
                    <button
                      onClick={handleApplyOptimized}
                      className="text-xs px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
                    >
                      复制优化 SQL
                    </button>
                  </div>
                  <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-mono bg-[var(--bg-surface)] p-2 rounded">
                    {result.optimizedSQL}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="px-3 pb-3 text-center text-sm text-[var(--text-tertiary)]">
          点击"校验"使用 AI 检查您的 SQL
        </div>
      )}
    </div>
  );
}