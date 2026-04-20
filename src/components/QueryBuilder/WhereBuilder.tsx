import { useQueryBuilderStore } from '@/stores/useQueryBuilderStore';
import type { WhereOperator, WhereConnector } from '@/types';

const OPERATORS: { value: WhereOperator; label: string }[] = [
  { value: '=', label: '= (等于)' },
  { value: '!=', label: '!= (不等于)' },
  { value: '>', label: '> (大于)' },
  { value: '<', label: '< (小于)' },
  { value: '>=', label: '>= (大于等于)' },
  { value: '<=', label: '<= (小于等于)' },
  { value: 'LIKE', label: 'LIKE (模糊匹配)' },
  { value: 'IN', label: 'IN (多值匹配)' },
  { value: 'NOT_IN', label: 'NOT IN (排除多值)' },
  { value: 'IS_NULL', label: 'IS NULL (为空)' },
  { value: 'IS_NOT_NULL', label: 'IS NOT NULL (不为空)' },
  { value: 'BETWEEN', label: 'BETWEEN (范围)' },
];

const CONNECTORS: { value: WhereConnector; label: string }[] = [
  { value: 'AND', label: 'AND' },
  { value: 'OR', label: 'OR' },
];

export function WhereBuilder() {
  const {
    mainTable,
    whereConditions,
    addWhereCondition,
    removeWhereCondition,
    updateWhereCondition,
  } = useQueryBuilderStore();

  if (!mainTable) {
    return null;
  }

  const handleAddCondition = () => {
    const firstField = mainTable.fields[0];
    if (!firstField) return;

    addWhereCondition({
      tableName: mainTable.name,
      fieldName: firstField.name,
      operator: '=',
      value: '',
      connector: null,
    });
  };

  const handleFieldChange = (id: string, fieldName: string) => {
    updateWhereCondition(id, {
      fieldName,
      value: '',
    });
  };

  const handleOperatorChange = (id: string, operator: WhereOperator) => {
    updateWhereCondition(id, {
      operator,
      value: operator === 'IS_NULL' || operator === 'IS_NOT_NULL' ? '' : '',
    });
  };

  const handleValueChange = (id: string, value: string | string[]) => {
    updateWhereCondition(id, { value });
  };

  const handleConnectorChange = (id: string, connector: WhereConnector) => {
    updateWhereCondition(id, { connector });
  };

  const needsValueInput = (operator: WhereOperator) =>
    operator !== 'IS_NULL' && operator !== 'IS_NOT_NULL';

  const needsTwoValues = (operator: WhereOperator) => operator === 'BETWEEN';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-primary)]">查询条件 (WHERE)</span>
        <button
          onClick={handleAddCondition}
          className="text-xs px-2 py-1 text-primary-500 hover:bg-primary-500/10 rounded transition-colors"
        >
          + 添加条件
        </button>
      </div>

      {whereConditions.length === 0 ? (
        <div className="py-4 text-center text-sm text-[var(--text-tertiary)]">
          暂无条件，点击"+ 添加条件"开始
        </div>
      ) : (
        <div className="space-y-2">
          {whereConditions.map((condition, index) => (
            <div key={condition.id} className="space-y-2">
              {index > 0 && (
                <div className="flex items-center justify-center">
                  <select
                    value={condition.connector || 'AND'}
                    onChange={(e) => handleConnectorChange(condition.id, e.target.value as WhereConnector)}
                    className="text-xs px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-secondary)]"
                  >
                    {CONNECTORS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-start gap-2 p-2 bg-[var(--bg-elevated)] rounded-md overflow-x-auto">
                <select
                  value={condition.fieldName}
                  onChange={(e) => handleFieldChange(condition.id, e.target.value)}
                  className="w-36 flex-shrink-0 text-sm px-2 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-primary)] truncate"
                  title={condition.fieldName}
                >
                  {mainTable.fields.map((field) => (
                    <option key={field.name} value={field.name} title={field.comment || field.name}>
                      {field.comment || field.name} ({field.name})
                    </option>
                  ))}
                </select>

                <select
                  value={condition.operator}
                  onChange={(e) => handleOperatorChange(condition.id, e.target.value as WhereOperator)}
                  className="w-28 flex-shrink-0 text-sm px-2 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-secondary)]"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {needsValueInput(condition.operator) && (
                  needsTwoValues(condition.operator) ? (
                    <div className="flex-1 flex gap-1 min-w-0">
                      <input
                        type="text"
                        placeholder="起始值"
                        value={(condition.value as string[])?.[0] || ''}
                        onChange={(e) =>
                          handleValueChange(condition.id, [e.target.value, (condition.value as string[])?.[1] || ''])
                        }
                        className="w-20 flex-shrink-0 text-sm px-2 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-primary)]"
                      />
                      <span className="self-center text-[var(--text-tertiary)]">-</span>
                      <input
                        type="text"
                        placeholder="结束值"
                        value={(condition.value as string[])?.[1] || ''}
                        onChange={(e) =>
                          handleValueChange(condition.id, [(condition.value as string[])?.[0] || '', e.target.value])
                        }
                        className="w-20 flex-shrink-0 text-sm px-2 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-primary)]"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder={
                        condition.operator === 'IN' || condition.operator === 'NOT_IN'
                          ? 'value1, value2, ...'
                          : 'value'
                      }
                      value={Array.isArray(condition.value) ? '' : condition.value}
                      onChange={(e) => handleValueChange(condition.id, e.target.value)}
                      className="flex-1 min-w-[80px] text-sm px-2 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-primary)]"
                    />
                  )
                )}

                <button
                  onClick={() => removeWhereCondition(condition.id)}
                  className="p-1.5 text-[var(--text-tertiary)] hover:text-risk-high hover:bg-risk-high/10 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
