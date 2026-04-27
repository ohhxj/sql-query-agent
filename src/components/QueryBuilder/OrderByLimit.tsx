import { useQueryBuilderStore } from '@/stores/useQueryBuilderStore';
import { formatSelectedFieldExpression, isTrueAggregate } from '@/utils/sqlGenerator';
import type { AggregateType, SelectedField } from '@/types';

function getDisplayLabel(aggregate: string, fieldName: string): string {
  if (aggregate === 'DATE') {
    return `DATE(${fieldName})`;
  }
  if (aggregate === 'DATETIME') {
    return `DATETIME(${fieldName})`;
  }
  return `${aggregate}(${fieldName})`;
}

function supportsTimeGrouping(fieldName: string, fieldType: string): boolean {
  const lowerName = fieldName.toLowerCase();
  const lowerType = fieldType.toLowerCase();

  return (
    lowerName.endsWith('_at') ||
    lowerName.includes('time') ||
    lowerName.includes('date') ||
    lowerType.includes('timestamp') ||
    lowerType.includes('datetime') ||
    lowerType.includes('date') ||
    lowerType.includes('int') ||
    lowerType.includes('bigint')
  );
}

export function OrderByLimit() {
  const {
    mainTable,
    selectedFields,
    groupByFields,
    orderByFields,
    limit,
    addGroupByField,
    removeGroupByField,
    updateFieldAggregate,
    setOrderBy,
    setLimit,
  } = useQueryBuilderStore();

  const mainTableFields = selectedFields.filter((f) => f.tableName === mainTable?.name);
  const groupableFields = selectedFields.filter((f) => !isTrueAggregate(f.aggregate));
  const uniqueGroupableFields = Array.from(
    new Map(
      groupableFields.map((field) => [formatSelectedFieldExpression(field), field])
    ).values()
  );

  if (!mainTable || selectedFields.length === 0) {
    return null;
  }

  const handleOrderChange = (fieldId: string, direction: 'ASC' | 'DESC' | null) => {
    const field = mainTableFields.find((f) => f.id === fieldId);
    if (field) {
      setOrderBy(field, direction);
    }
  };

  const handleGroupByToggle = (fieldRef: string, isSelected: boolean) => {
    try {
      if (isSelected) {
        removeGroupByField(fieldRef);
      } else {
        addGroupByField(fieldRef);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      window.dispatchEvent(
        new ErrorEvent('error', {
          message,
          error: error instanceof Error ? error : new Error(message),
        })
      );
    }
  };

  const handleTimeGroupBy = (field: SelectedField, aggregate: AggregateType) => {
    const previousExpression = formatSelectedFieldExpression(field);
    const nextExpression = formatSelectedFieldExpression({ ...field, aggregate });
    const hasPreviousSelection = groupByFields.includes(previousExpression);
    const hasNextSelection = groupByFields.includes(nextExpression);

    if (field.aggregate === aggregate) {
      handleGroupByToggle(nextExpression, hasNextSelection);
      return;
    }

    updateFieldAggregate(field, aggregate);

    if (!hasPreviousSelection && !hasNextSelection) {
      addGroupByField(nextExpression);
    }
  };

  const hasAggregates = mainTableFields.some((f) => isTrueAggregate(f.aggregate));

  return (
    <div className="space-y-3">
      {uniqueGroupableFields.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-primary)]">GROUP BY</span>
            {groupByFields.length > 0 && (
              <button
                onClick={() => groupByFields.forEach((f) => removeGroupByField(f))}
                className="text-xs text-[var(--text-tertiary)] hover:text-primary-500"
              >
                清除全部
              </button>
            )}
          </div>

          <p className="text-xs text-[var(--text-tertiary)]">
            从已选字段里勾选需要分组的维度；时间字段支持直接按天或按时间分组。
          </p>

          <div className="flex flex-wrap gap-2">
            {uniqueGroupableFields.map((field) => {
              const fieldRef = formatSelectedFieldExpression(field);
              const isSelected = groupByFields.includes(fieldRef);
              const fieldLabel = field.sourceAlias || field.tableName;
              const canUseTimeGrouping = supportsTimeGrouping(field.fieldName, field.fieldType);
              const dayExpression = formatSelectedFieldExpression({ ...field, aggregate: 'DATE' });
              const dateTimeExpression = formatSelectedFieldExpression({ ...field, aggregate: 'DATETIME' });
              const isDaySelected = groupByFields.includes(dayExpression) && field.aggregate === 'DATE';
              const isDateTimeSelected = groupByFields.includes(dateTimeExpression) && field.aggregate === 'DATETIME';

              return (
                <div key={`${field.id}-${field.aggregate}`} className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGroupByToggle(fieldRef, isSelected)}
                    className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
                      isSelected
                        ? 'border border-primary-500 bg-primary-500/20 text-primary-500'
                        : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-primary-500'
                    }`}
                  >
                    <span className="font-mono">{fieldLabel}.{field.fieldName}</span>
                    {field.fieldComment && (
                      <span className="text-[var(--text-tertiary)]">({field.fieldComment})</span>
                    )}
                  </button>

                  {canUseTimeGrouping && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTimeGroupBy(field, 'DATE')}
                        className={`rounded-md px-2 py-1 text-[11px] transition-colors ${
                          isDaySelected
                            ? 'border border-primary-500 bg-primary-500/20 text-primary-500'
                            : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:border-primary-500 hover:text-primary-500'
                        }`}
                      >
                        按天
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTimeGroupBy(field, 'DATETIME')}
                        className={`rounded-md px-2 py-1 text-[11px] transition-colors ${
                          isDateTimeSelected
                            ? 'border border-primary-500 bg-primary-500/20 text-primary-500'
                            : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:border-primary-500 hover:text-primary-500'
                        }`}
                      >
                        按时间
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {!hasAggregates && (
            <p className="text-xs text-[var(--text-tertiary)]">
              当前还没有聚合字段；如果要生成汇总 SQL，再把需要统计的字段改成 `COUNT`、`SUM`、`AVG` 等即可。
            </p>
          )}
        </>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-primary)]">ORDER BY</span>
      </div>

      <div className="space-y-1">
        {mainTableFields.map((field) => {
          const orderItem = orderByFields.find(
            (o) => o.field.id === field.id
          );
          const currentDirection = orderItem?.direction || null;

          return (
            <div
              key={field.id}
              className="flex items-center gap-2 p-2 bg-[var(--bg-elevated)] rounded-md"
            >
              <span className="flex-1 text-sm text-[var(--text-primary)] font-mono">
                {field.aggregate !== 'none' ? (
                  <span className="text-primary-500">{getDisplayLabel(field.aggregate, field.fieldName)}</span>
                ) : (
                  field.fieldName
                )}
                {field.fieldComment && (
                  <span className="text-[var(--text-tertiary)] ml-1">({field.fieldComment})</span>
                )}
              </span>

              <select
                value={currentDirection || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleOrderChange(
                    field.id,
                    value === '' ? null : (value as 'ASC' | 'DESC')
                  );
                }}
                className="text-xs px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-secondary)]"
              >
                <option value="">— 不排序</option>
                <option value="ASC">↑ 升序</option>
                <option value="DESC">↓ 降序</option>
              </select>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">LIMIT</span>
        <input
          type="number"
          min="1"
          value={limit || ''}
          onChange={(e) => setLimit(e.target.value ? parseInt(e.target.value, 10) : null)}
          placeholder="不限制"
          className="w-24 text-sm px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-primary)]"
        />
      </div>
    </div>
  );
}
