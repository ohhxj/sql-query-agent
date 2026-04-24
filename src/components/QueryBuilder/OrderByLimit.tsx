import { useQueryBuilderStore } from '@/stores/useQueryBuilderStore';
import { formatSelectedFieldExpression, isTrueAggregate } from '@/utils/sqlGenerator';

function getDisplayLabel(aggregate: string, fieldName: string): string {
  if (aggregate === 'DATE') {
    return `DATE(${fieldName})`;
  }
  if (aggregate === 'DATETIME') {
    return `DATETIME(${fieldName})`;
  }
  return `${aggregate}(${fieldName})`;
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
    setOrderBy,
    setLimit,
  } = useQueryBuilderStore();

  const mainTableFields = selectedFields.filter((f) => f.tableName === mainTable?.name);

  if (!mainTable || mainTableFields.length === 0) {
    return null;
  }

  const handleOrderChange = (fieldId: string, direction: 'ASC' | 'DESC' | null) => {
    const field = mainTableFields.find((f) => f.id === fieldId);
    if (field) {
      setOrderBy(field, direction);
    }
  };

  const nonAggregatedFields = mainTableFields.filter((f) => !isTrueAggregate(f.aggregate));
  const hasAggregates = mainTableFields.some((f) => isTrueAggregate(f.aggregate));

  return (
    <div className="space-y-3">
      {hasAggregates && nonAggregatedFields.length > 0 && (
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

          <div className="flex flex-wrap gap-2">
            {nonAggregatedFields.map((field) => {
              const fieldRef = formatSelectedFieldExpression(field);
              const isSelected = groupByFields.includes(fieldRef);

              return (
                <label
                  key={fieldRef}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary-500/20 text-primary-500 border border-primary-500'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-primary-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      if (isSelected) {
                        removeGroupByField(fieldRef);
                      } else {
                        addGroupByField(fieldRef);
                      }
                    }}
                    className="sr-only"
                  />
                  <span className="font-mono">{field.fieldName}</span>
                  {field.fieldComment && (
                    <span className="text-[var(--text-tertiary)]">({field.fieldComment})</span>
                  )}
                </label>
              );
            })}
          </div>
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
              key={`${field.tableName}.${field.fieldName}`}
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
