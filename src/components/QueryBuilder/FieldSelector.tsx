import { useDatabaseStore } from '@/stores/useDatabaseStore';
import { useQueryBuilderStore } from '@/stores/useQueryBuilderStore';
import { isNumericType } from '@/utils/jsonParser';
import { extractMappingsFromComment } from '@/utils/fieldMapping';
import { cleanComment } from '@/utils/sqlGenerator';
import { useMemo, useState } from 'react';
import type { AggregateType, SelectedField, Table } from '@/types';

const AGGREGATE_OPTIONS: { value: AggregateType; label: string; shortLabel: string }[] = [
  { value: 'none', label: '原始', shortLabel: '原始' },
  { value: 'SUM', label: 'SUM(求和)', shortLabel: '求和' },
  { value: 'AVG', label: 'AVG(平均)', shortLabel: '平均' },
  { value: 'COUNT', label: 'COUNT(计数)', shortLabel: '计数' },
  { value: 'MAX', label: 'MAX(最大)', shortLabel: '最大' },
  { value: 'MIN', label: 'MIN(最小)', shortLabel: '最小' },
  { value: 'DATE', label: '转日期(YYYY-MM-DD)', shortLabel: '转日期' },
  { value: 'DATETIME', label: '转日期时间(YYYY-MM-DD HH:mm:ss)', shortLabel: '转时间' },
];

interface FieldSource {
  tableId: string;
  sourceAlias?: string;
  table: Table;
  fieldName: string;
  fieldComment: string;
  fieldType: string;
}

function generateSelectionId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function supportsTimeFormatting(fieldName: string, fieldType: string): boolean {
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

export function FieldSelector() {
  const { databases, selectedDatabase, getFieldMapping } = useDatabaseStore();
  const {
    mainTable,
    setMainTable,
    joinConfigs,
    selectedFields,
    addField,
    removeField,
    updateFieldAggregate,
  } = useQueryBuilderStore();

  const [mainTableSearch, setMainTableSearch] = useState('');
  const [openAggregateFieldId, setOpenAggregateFieldId] = useState<string | null>(null);

  const allTables = useMemo(
    () =>
      databases.flatMap((db) =>
        db.tables.map((table) => ({
          dbName: db.name,
          table,
          label: `[${db.name}] ${table.name}${table.comment ? ` (${table.comment})` : ''}`,
        }))
      ),
    [databases]
  );

  const filteredMainTables = useMemo(() => {
    const keyword = mainTableSearch.trim().toLowerCase();
    if (!keyword) {
      return allTables;
    }

    return allTables.filter(({ dbName, table }) =>
      [dbName, table.name, table.comment]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [allTables, mainTableSearch]);

  const selectedMainTableValue = mainTable
    ? allTables.find(({ table }) => table.name === mainTable.name && table.comment === mainTable.comment)?.label || ''
    : '';

  // 获取所有可选择的表（包括主表和已关联的表）
  const availableTables: Array<{ tableId: string; sourceAlias?: string; table: Table }> = [];
  if (mainTable) {
    const mainTableId = selectedDatabase ? `${selectedDatabase}.${mainTable.name}` : mainTable.name;
    availableTables.push({ tableId: mainTableId, table: mainTable });
  }

  for (const config of joinConfigs) {
    const joinedDb = databases.find((db) => db.name === config.joinedDbName);
    const joinedTable = joinedDb?.tables.find((t) => t.name === config.joinedTableName);
    const joinedTableId = `${config.joinedDbName}.${config.joinedTableName}.${config.alias}`;

    if (joinedTable) {
      availableTables.push({ tableId: joinedTableId, sourceAlias: config.alias, table: joinedTable });
    }
  }

  // 构建所有可选择的字段列表
  const allFieldSources: FieldSource[] = [];
  for (const { tableId, sourceAlias, table } of availableTables) {
    for (const field of table.fields) {
      allFieldSources.push({
        tableId,
        sourceAlias,
        table,
        fieldName: field.name,
        fieldComment: field.comment,
        fieldType: field.type,
      });
    }
  }

  const getFieldInstances = (tableName: string, fieldName: string, sourceAlias?: string) =>
    selectedFields.filter(
      (f) => f.tableName === tableName && f.fieldName === fieldName && (f.sourceAlias || '') === (sourceAlias || '')
    );

  const getResolvedMapping = (tableId: string, fieldName: string, fieldComment: string) => {
    const parsedMapping = extractMappingsFromComment(fieldComment, tableId, fieldName)?.mappings;
    if (parsedMapping && Object.keys(parsedMapping).length > 0) {
      return parsedMapping;
    }

    const storedMapping = getFieldMapping(tableId, fieldName);
    if (storedMapping?.mappings && Object.keys(storedMapping.mappings).length > 0) {
      return storedMapping.mappings;
    }
    return undefined;
  };

  const handleAddFieldInstance = (
    tableName: string,
    tableComment: string,
    fieldName: string,
    fieldComment: string,
    fieldType: string,
    tableId: string,
    sourceAlias?: string
  ) => {
    const mappings = getResolvedMapping(tableId, fieldName, fieldComment);
    const newField: SelectedField = {
      id: generateSelectionId(),
      tableId,
      tableName,
      tableComment,
      sourceAlias,
      fieldName,
      fieldComment,
      fieldType,
      aggregate: 'none',
      valueMappings: mappings,
    };
    addField(newField);
  };

  const handleToggleFieldInstances = (
    tableName: string,
    fieldName: string,
    sourceAlias?: string
  ) => {
    const instances = getFieldInstances(tableName, fieldName, sourceAlias);
    if (instances.length > 0) {
      instances.forEach((instance) => removeField(instance));
      return;
    }
  };

  const handleAggregateChange = (field: SelectedField, aggregate: AggregateType) => {
    updateFieldAggregate(field, aggregate);
  };

  const handleToggleAllMainTableFields = () => {
    if (!mainTable) {
      return;
    }

    const mainTableId = selectedDatabase ? `${selectedDatabase}.${mainTable.name}` : mainTable.name;
    const mainTableFields = mainTable.fields;
    const allSelected = mainTableFields.every((field) => getFieldInstances(mainTable.name, field.name).length > 0);

    if (allSelected) {
      selectedFields
        .filter((field) => field.tableName === mainTable.name)
        .forEach((field) => removeField(field));
      return;
    }

    mainTableFields.forEach((field) => {
      if (getFieldInstances(mainTable.name, field.name).length === 0) {
        handleAddFieldInstance(
          mainTable.name,
          mainTable.comment,
          field.name,
          field.comment,
          field.type,
          mainTableId
        );
      }
    });
  };

  // 按表分组显示字段
  const fieldsByTable = availableTables.map(({ tableId, sourceAlias, table }) => ({
    tableId,
    sourceAlias,
    table,
    fields: allFieldSources.filter((f) => f.tableId === tableId),
  }));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-primary)]">主表</span>
          {mainTable && (
            <span className="text-xs text-[var(--text-tertiary)]">
              当前: {mainTable.comment || mainTable.name}
            </span>
          )}
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={mainTableSearch}
            onChange={(e) => setMainTableSearch(e.target.value)}
            placeholder="搜索主表名称或中文备注"
            className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none"
          />
          <select
            value={selectedMainTableValue}
            onChange={(e) => {
              const nextTable = filteredMainTables.find(({ label }) => label === e.target.value);
              if (nextTable) {
                setMainTable(nextTable.table);
              }
            }}
            className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-primary-500 focus:outline-none"
          >
            <option value="">选择主表</option>
            {filteredMainTables.map(({ label }) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!mainTable && (
        <div className="p-4 text-center text-[var(--text-tertiary)] text-sm">
          请先在上方选择主表
        </div>
      )}

      {mainTable && (
        <>
      {fieldsByTable.map(({ tableId, sourceAlias, table, fields }) => {
        const isMainTable = !sourceAlias;
        const allMainTableFieldsSelected =
          isMainTable &&
          fields.length > 0 &&
          fields.every((source) => getFieldInstances(source.table.name, source.fieldName, source.sourceAlias).length > 0);

        return (
          <div key={tableId} className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
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
              {isMainTable && (
                <button
                  onClick={handleToggleAllMainTableFields}
                  className="ml-2 rounded px-2 py-0.5 text-xs text-primary-500 transition-colors hover:bg-primary-500/10"
                >
                  {allMainTableFieldsSelected ? '取消全选' : '全选'}
                </button>
              )}
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: '200px' }}>
              <div className="p-2 space-y-1">
                {fields.map((source) => {
                  const fieldInstances = getFieldInstances(source.table.name, source.fieldName, source.sourceAlias);
                  const selected = fieldInstances.length > 0;
                  const resolvedMappings = getResolvedMapping(
                    source.tableId,
                    source.fieldName,
                    source.fieldComment
                  );
                  const cleanedComment = cleanComment(source.fieldComment);

                  return (
                    <div
                      key={`${source.table.name}.${source.fieldName}`}
                      className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                        selected
                          ? 'bg-primary-500/10 border border-primary-500/30'
                          : 'hover:bg-[var(--bg-elevated)] border border-transparent'
                      }`}
                    >
                      <button
                        onClick={() =>
                          handleToggleFieldInstances(
                            source.table.name,
                            source.fieldName,
                            source.sourceAlias
                          )
                        }
                        className={`rounded px-2 py-1 text-xs transition-colors ${
                          selected
                            ? 'text-risk-high hover:bg-risk-high/10'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]'
                        }`}
                      >
                        {selected ? '取消' : '选择'}
                      </button>

                      <button
                        onClick={() =>
                          handleAddFieldInstance(
                            source.table.name,
                            source.table.comment,
                            source.fieldName,
                            source.fieldComment,
                            source.fieldType,
                            source.tableId,
                            source.sourceAlias
                          )
                        }
                        className="rounded px-2 py-1 text-xs text-primary-500 hover:bg-primary-500/10"
                      >
                        + 添加
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[var(--text-primary)] font-mono truncate">
                            {source.fieldName}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0">({source.fieldType})</span>
                        </div>
                        {cleanedComment && (
                          <span className="text-xs text-[var(--text-tertiary)] truncate" title={cleanedComment}>
                            {cleanedComment}
                          </span>
                        )}
                        {resolvedMappings && (
                          <span
                            className="block text-[11px] text-accent-400 truncate"
                            title={Object.entries(resolvedMappings)
                              .map(([key, value]) => `${key}:${value}`)
                              .join(' ')}
                          >
                            映射: {Object.entries(resolvedMappings)
                              .map(([key, value]) => `${key}:${value}`)
                              .join(' ')}
                          </span>
                        )}
                      </div>

                      {selected && (
                        <span className="rounded bg-primary-500/10 px-2 py-0.5 text-xs text-primary-500">
                          已选 {fieldInstances.length}
                        </span>
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
          <div className="space-y-2">
            {selectedFields.map((field) => (
              <div
                key={field.id}
                className="flex items-center gap-2 rounded bg-primary-500/10 px-2 py-2 text-xs text-primary-500"
              >
                <span className="min-w-0 flex-1 truncate">
                  {(field.sourceAlias || field.tableName)}.{field.fieldName}
                  {field.fieldComment && (
                    <span className="opacity-70" title={cleanComment(field.fieldComment)}>
                      {' '}({cleanComment(field.fieldComment)})
                    </span>
                  )}
                </span>
                <select
                  value={field.aggregate}
                  onChange={() => undefined}
                  className="hidden"
                />
                <div
                  className="relative w-28 flex-shrink-0"
                  tabIndex={0}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                      setOpenAggregateFieldId((current) => (current === field.id ? null : current));
                    }
                  }}
                >
                  <button
                    type="button"
                    title={AGGREGATE_OPTIONS.find((opt) => opt.value === field.aggregate)?.label}
                    onClick={() =>
                      setOpenAggregateFieldId((current) => (current === field.id ? null : field.id))
                    }
                    className="flex w-full items-center justify-between rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-secondary)] focus:border-primary-500 focus:outline-none"
                  >
                    <span className="truncate">
                      {AGGREGATE_OPTIONS.find((opt) => opt.value === field.aggregate)?.shortLabel || '原始'}
                    </span>
                    <svg className="ml-2 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {openAggregateFieldId === field.id && (
                    <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 shadow-lg">
                      {AGGREGATE_OPTIONS.filter((opt) =>
                        opt.value === 'none' ||
                        opt.value === 'COUNT' ||
                        isNumericType(field.fieldType) ||
                        (supportsTimeFormatting(field.fieldName, field.fieldType) &&
                          (opt.value === 'DATE' || opt.value === 'DATETIME'))
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            handleAggregateChange(field, opt.value);
                            setOpenAggregateFieldId(null);
                          }}
                          className={`block w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
                            field.aggregate === opt.value
                              ? 'bg-primary-500/10 text-primary-500'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                          }`}
                          title={opt.label}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() =>
                    handleAddFieldInstance(
                      field.tableName,
                      field.tableComment,
                      field.fieldName,
                      field.fieldComment,
                      field.fieldType,
                      field.tableId || field.tableName,
                      field.sourceAlias
                    )
                  }
                  className="rounded px-2 py-1 text-xs text-primary-500 hover:bg-primary-500/10"
                >
                  复制
                </button>
                <button
                  onClick={() => removeField(field)}
                  className="rounded px-2 py-1 text-xs text-risk-high hover:bg-risk-high/10"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
