import { useDatabaseStore } from '@/stores/useDatabaseStore';
import { useQueryBuilderStore } from '@/stores/useQueryBuilderStore';
import { isNumericType } from '@/utils/jsonParser';
import type { AggregateType, SelectedField, Table } from '@/types';

const AGGREGATE_OPTIONS: { value: AggregateType; label: string }[] = [
  { value: 'none', label: '原始' },
  { value: 'SUM', label: 'SUM(求和)' },
  { value: 'AVG', label: 'AVG(平均)' },
  { value: 'COUNT', label: 'COUNT(计数)' },
  { value: 'MAX', label: 'MAX(最大)' },
  { value: 'MIN', label: 'MIN(最小)' },
];

interface FieldSource {
  table: Table;
  fieldName: string;
  fieldComment: string;
  fieldType: string;
}

export function FieldSelector() {
  const { databases } = useDatabaseStore();
  const {
    mainTable,
    joinConfigs,
    selectedFields,
    addField,
    removeField,
    updateFieldAggregate,
  } = useQueryBuilderStore();

  if (!mainTable) {
    return (
      <div className="p-4 text-center text-[var(--text-tertiary)] text-sm">
        请从左侧选择一个表来选择字段
      </div>
    );
  }

  // 获取所有可选择的表（包括主表和已关联的表）
  const availableTables: Table[] = [mainTable];
  for (const config of joinConfigs) {
    const joinedTable = databases
      .flatMap((db) => db.tables)
      .find((t) => t.name === config.joinedTableName);
    if (joinedTable && !availableTables.some((t) => t.name === joinedTable.name)) {
      availableTables.push(joinedTable);
    }
  }

  // 构建所有可选择的字段列表
  const allFieldSources: FieldSource[] = [];
  for (const table of availableTables) {
    for (const field of table.fields) {
      allFieldSources.push({
        table,
        fieldName: field.name,
        fieldComment: field.comment,
        fieldType: field.type,
      });
    }
  }

  const isFieldSelected = (tableName: string, fieldName: string) =>
    selectedFields.some((f) => f.tableName === tableName && f.fieldName === fieldName);

  const getFieldAggregate = (tableName: string, fieldName: string): AggregateType => {
    const field = selectedFields.find(
      (f) => f.tableName === tableName && f.fieldName === fieldName
    );
    return field?.aggregate || 'none';
  };

  const handleFieldToggle = (
    tableName: string,
    tableComment: string,
    fieldName: string,
    fieldComment: string,
    fieldType: string
  ) => {
    if (isFieldSelected(tableName, fieldName)) {
      const field = selectedFields.find(
        (f) => f.tableName === tableName && f.fieldName === fieldName
      );
      if (field) {
        removeField(field);
      }
    } else {
      const newField: SelectedField = {
        tableName,
        tableComment,
        fieldName,
        fieldComment,
        fieldType,
        aggregate: 'none',
      };
      addField(newField);
    }
  };

  const handleAggregateChange = (tableName: string, fieldName: string, aggregate: AggregateType) => {
    const field = selectedFields.find(
      (f) => f.tableName === tableName && f.fieldName === fieldName
    );
    if (field) {
      updateFieldAggregate(field, aggregate);
    }
  };

  // 按表分组显示字段
  const fieldsByTable = availableTables.map((table) => ({
    table,
    fields: allFieldSources.filter((f) => f.table.name === table.name),
  }));

  return (
    <div className="space-y-4">
      {fieldsByTable.map(({ table, fields }) => {
        const isMainTable = table.name === mainTable.name;

        return (
          <div key={table.name} className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] overflow-hidden">
              <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${isMainTable ? 'bg-primary-500/20 text-primary-500' : 'bg-accent-400/20 text-accent-400'}`}>
                {isMainTable ? '主表' : '关联表'}
              </span>
              <span className="text-sm font-medium text-[var(--text-primary)] truncate" title={table.comment || table.name}>
                {table.comment || table.name}
              </span>
              <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0">({table.name})</span>
              <span className="ml-auto text-xs text-[var(--text-tertiary)] flex-shrink-0">
                {fields.length} 个字段
              </span>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: '200px' }}>
              <div className="p-2 space-y-1">
                {fields.map((source) => {
                  const selected = isFieldSelected(source.table.name, source.fieldName);
                  const numeric = isNumericType(source.fieldType);
                  const aggregate = getFieldAggregate(source.table.name, source.fieldName);

                  return (
                    <div
                      key={`${source.table.name}.${source.fieldName}`}
                      className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                        selected
                          ? 'bg-primary-500/10 border border-primary-500/30'
                          : 'hover:bg-[var(--bg-elevated)] border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          handleFieldToggle(
                            source.table.name,
                            source.table.comment,
                            source.fieldName,
                            source.fieldComment,
                            source.fieldType
                          )
                        }
                        className="w-4 h-4 rounded border-[var(--border-default)] text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[var(--text-primary)] font-mono truncate">
                            {source.fieldName}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0">({source.fieldType})</span>
                        </div>
                        {source.fieldComment && (
                          <span className="text-xs text-[var(--text-tertiary)] truncate" title={source.fieldComment}>
                            {source.fieldComment}
                          </span>
                        )}
                      </div>

                      {selected && numeric && (
                        <select
                          value={aggregate}
                          onChange={(e) =>
                            handleAggregateChange(source.table.name, source.fieldName, e.target.value as AggregateType)
                          }
                          className="text-xs px-1 py-0.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-secondary)]"
                        >
                          {AGGREGATE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {selectedFields.length > 0 && (
        <div className="pt-3 border-t border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-tertiary)] mb-2">已选字段：</div>
          <div className="flex flex-wrap gap-1">
            {selectedFields.map((field) => (
              <span
                key={`${field.tableName}.${field.fieldName}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-primary-500/20 text-primary-500"
              >
                {field.tableName}.{field.aggregate !== 'none' ? `${field.aggregate}(${field.fieldName})` : field.fieldName}
                {field.fieldComment && <span className="opacity-70" title={field.fieldComment}>({field.fieldComment})</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}