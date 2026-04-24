import { useDatabaseStore } from '@/stores/useDatabaseStore';
import { useQueryBuilderStore } from '@/stores/useQueryBuilderStore';
import type { JoinType, Table } from '@/types';

const JOIN_TYPES: { value: JoinType; label: string }[] = [
  { value: 'INNER', label: 'INNER JOIN' },
  { value: 'LEFT', label: 'LEFT JOIN' },
  { value: 'RIGHT', label: 'RIGHT JOIN' },
];

interface TableWithDb {
  dbName: string;
  table: Table;
}

function buildJoinAlias(tableName: string, existingAliases: string[]): string {
  let index = 1;
  let alias = `${tableName}_${index}`;
  while (existingAliases.includes(alias)) {
    index += 1;
    alias = `${tableName}_${index}`;
  }
  return alias;
}

export function JoinConfig() {
  const { databases } = useDatabaseStore();
  const { mainTable, joinConfigs, addJoinConfig, removeJoinConfig, updateJoinConfig } = useQueryBuilderStore();

  // 获取所有数据库的所有表（包含数据库信息）
  const allTablesWithDb: TableWithDb[] = databases.flatMap((db) =>
    db.tables
      .filter((t) => !mainTable || t.name !== mainTable.name)
      .map((t) => ({ dbName: db.name, table: t }))
  );

  // 用于显示和选择的完整名称
  const getTableFullName = (dbName: string, tableName: string) => `${dbName}.${tableName}`;
  const parseTableFullName = (fullName: string): { dbName: string; tableName: string } => {
    const parts = fullName.split('.');
    return { dbName: parts[0], tableName: parts.slice(1).join('.') };
  };

  const availableTables = allTablesWithDb.filter(
    (t) => !mainTable || t.table.name !== mainTable.name
  );

  if (!mainTable) {
    return null;
  }

  const handleAddJoin = () => {
    if (availableTables.length === 0) return;

    const firstTableWithDb = availableTables[0];
    const mainFirstField = mainTable.fields[0];
    const joinFirstField = firstTableWithDb.table.fields[0];

    addJoinConfig({
      alias: buildJoinAlias(
        firstTableWithDb.table.name,
        joinConfigs.map((config) => config.alias)
      ),
      joinedDbName: firstTableWithDb.dbName,
      joinedTableName: firstTableWithDb.table.name,
      joinedTableComment: firstTableWithDb.table.comment,
      joinType: 'LEFT',
      leftField: {
        tableName: mainTable.name,
        fieldName: mainFirstField?.name || '',
      },
      rightField: {
        tableName: firstTableWithDb.table.name,
        fieldName: joinFirstField?.name || '',
      },
    });
  };

  const handleTableChange = (id: string, tableFullName: string) => {
    const { dbName, tableName } = parseTableFullName(tableFullName);
    const tableWithDb = allTablesWithDb.find(
      (t) => t.dbName === dbName && t.table.name === tableName
    );
    if (tableWithDb) {
      updateJoinConfig(id, {
        alias: buildJoinAlias(
          tableWithDb.table.name,
          joinConfigs.filter((config) => config.id !== id).map((config) => config.alias)
        ),
        joinedDbName: tableWithDb.dbName,
        joinedTableName: tableWithDb.table.name,
        joinedTableComment: tableWithDb.table.comment,
        rightField: {
          tableName: tableWithDb.table.name,
          fieldName: tableWithDb.table.fields[0]?.name || '',
        },
      });
    }
  };

  const handleJoinTypeChange = (id: string, joinType: JoinType) => {
    updateJoinConfig(id, { joinType });
  };

  const handleAliasChange = (id: string, alias: string) => {
    updateJoinConfig(id, { alias: alias.trim() || `join_${id.slice(0, 4)}` });
  };

  const handleLeftFieldChange = (id: string, fieldName: string) => {
    updateJoinConfig(id, {
      leftField: { tableName: mainTable.name, fieldName },
    });
  };

  const handleRightFieldChange = (id: string, fieldName: string, tableName: string) => {
    updateJoinConfig(id, {
      rightField: { tableName, fieldName },
    });
  };

  const getTableByName = (tableName: string): Table | undefined => {
    for (const db of databases) {
      const found = db.tables.find((t) => t.name === tableName);
      if (found) return found;
    }
    return undefined;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-primary)]">表关联 (JOIN)</span>
        <button
          onClick={handleAddJoin}
          disabled={availableTables.length === 0}
          className="text-xs px-2 py-1 text-primary-500 hover:bg-primary-500/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + 添加关联
        </button>
      </div>

      {joinConfigs.length === 0 ? (
        <div className="py-4 text-center text-sm text-[var(--text-tertiary)]">
          暂无关联，点击"+ 添加关联"开始
        </div>
      ) : (
        <div className="space-y-2">
          {joinConfigs.map((config) => {
            const leftFields = mainTable.fields;
            const rightTable = getTableByName(config.joinedTableName);
            const rightFields = rightTable?.fields || [];

            return (
              <div
                key={config.id}
                className="p-2 bg-[var(--bg-elevated)] rounded-md overflow-x-auto"
              >
                <div className="flex items-center gap-2 min-w-max">
                  <select
                    value={getTableFullName(config.joinedDbName, config.joinedTableName)}
                    onChange={(e) => handleTableChange(config.id, e.target.value)}
                    className="w-48 flex-shrink-0 text-sm px-2 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-primary)] truncate"
                    title={config.joinedTableName}
                  >
                    {availableTables.map(({ dbName, table }) => (
                      <option
                        key={getTableFullName(dbName, table.name)}
                        value={getTableFullName(dbName, table.name)}
                        title={table.comment || table.name}
                      >
                        [{dbName}] {table.comment || table.name} ({table.name})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={config.alias}
                    onChange={(e) => handleAliasChange(config.id, e.target.value)}
                    className="w-28 flex-shrink-0 text-sm px-2 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-primary)]"
                    placeholder="表别名"
                  />

                  <select
                    value={config.joinType}
                    onChange={(e) => handleJoinTypeChange(config.id, e.target.value as JoinType)}
                    className="w-28 flex-shrink-0 text-sm px-2 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-secondary)]"
                  >
                    {JOIN_TYPES.map((j) => (
                      <option key={j.value} value={j.value}>
                        {j.label}
                      </option>
                    ))}
                  </select>

                  <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0">ON</span>

                  <select
                    value={config.leftField.fieldName}
                    onChange={(e) => handleLeftFieldChange(config.id, e.target.value)}
                    className="w-40 flex-shrink-0 text-sm px-2 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-primary)] truncate"
                    title={`${mainTable.name}.${config.leftField.fieldName}`}
                  >
                    {leftFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {mainTable.name}.{field.name}
                      </option>
                    ))}
                  </select>

                  <span className="text-sm text-[var(--text-secondary)] flex-shrink-0">=</span>

                  <select
                    value={config.rightField.fieldName}
                    onChange={(e) => handleRightFieldChange(config.id, e.target.value, config.joinedTableName)}
                    className="w-40 flex-shrink-0 text-sm px-2 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-primary)] truncate"
                    title={`${config.joinedTableName}.${config.rightField.fieldName}`}
                  >
                    {rightFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {config.joinedTableName}.{field.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => removeJoinConfig(config.id)}
                    className="p-1.5 text-[var(--text-tertiary)] hover:text-risk-high hover:bg-risk-high/10 rounded transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
