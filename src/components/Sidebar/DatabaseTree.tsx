import { useState } from 'react';
import { useDatabaseStore } from '@/stores/useDatabaseStore';
import { useQueryBuilderStore } from '@/stores/useQueryBuilderStore';
import { getFieldIcon } from '@/utils/jsonParser';
import { cleanTableComment } from '@/utils/sqlParser';
import type { Field } from '@/types';

export function DatabaseTree() {
  const {
    databases,
    selectedDatabase,
    expandedDatabases,
    expandedTables,
    setSelectedDatabase,
    updateDatabase,
    updateTable,
    createDatabase,
    toggleDatabaseExpand,
    toggleTableExpand,
    getAllTables,
    deleteDatabase,
    setFieldMapping,
    getFieldMapping,
  } = useDatabaseStore();

  const { mainTable } = useQueryBuilderStore();

  const [editingDb, setEditingDb] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showNewDbInput, setShowNewDbInput] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; field: Field; tableId: string } | null>(null);

  const filteredTables = getAllTables().filter((table) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return true;
    }

    const fieldMatched = table.fields.some(
      (field) =>
        field.name.toLowerCase().includes(keyword) ||
        field.comment.toLowerCase().includes(keyword)
    );

    return (
      table.name.toLowerCase().includes(keyword) ||
      table.comment.toLowerCase().includes(keyword) ||
      fieldMatched
    );
  });

  const handleDbClick = (dbName: string) => {
    if (selectedDatabase === dbName) {
      // 如果已选中，点击切换展开状态
      toggleDatabaseExpand(dbName);
    } else {
      // 如果未选中，选中并展开
      setSelectedDatabase(dbName);
      if (!expandedDatabases.includes(dbName)) {
        toggleDatabaseExpand(dbName);
      }
    }
  };

  const handleDbDoubleClick = (dbName: string) => {
    setEditingDb(dbName);
    setEditValue(dbName);
  };

  const handleDbBlur = (dbName: string) => {
    if (editValue.trim() && editValue.trim() !== dbName) {
      updateDatabase(dbName, { name: editValue.trim() });
    }
    setEditingDb(null);
  };

  const handleTableDoubleClick = (tableName: string) => {
    setEditingTable(tableName);
    setEditValue(tableName);
  };

  const handleTableBlur = (dbName: string, tableName: string) => {
    if (editValue.trim() && editValue.trim() !== tableName) {
      updateTable(dbName, tableName, { name: editValue.trim() });
    }
    setEditingTable(null);
  };

  const handleCreateDb = () => {
    if (newDbName.trim()) {
      createDatabase(newDbName.trim());
      setNewDbName('');
      setShowNewDbInput(false);
    }
  };

  if (databases.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-[var(--text-tertiary)] text-sm mb-4">
          <p>暂无数据库</p>
          <p className="mt-1">请先创建数据库</p>
        </div>
        <div className="px-2">
          {showNewDbInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newDbName}
                onChange={(e) => setNewDbName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateDb();
                  if (e.key === 'Escape') {
                    setShowNewDbInput(false);
                    setNewDbName('');
                  }
                }}
                placeholder="数据库名称"
                className="flex-1 px-2 py-1 text-sm bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-primary)]"
                autoFocus
              />
              <button
                onClick={handleCreateDb}
                className="px-2 py-1 text-sm bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
              >
                创建
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewDbInput(true)}
              className="w-full px-3 py-2 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              + 新建数据库
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 text-sm">
      <div className="flex items-center gap-2 mb-2 px-2">
        <button
          onClick={() => setShowNewDbInput(!showNewDbInput)}
          className="text-xs px-2 py-1 text-primary-500 hover:text-primary-400 transition-colors"
        >
          + 新建数据库
        </button>
        {showNewDbInput && (
          <div className="flex-1 flex gap-1">
            <input
              type="text"
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateDb();
                if (e.key === 'Escape') {
                  setShowNewDbInput(false);
                  setNewDbName('');
                }
              }}
              placeholder="数据库名称"
              className="flex-1 px-2 py-0.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded focus:outline-none focus:border-primary-500 text-[var(--text-primary)]"
              autoFocus
            />
            <button
              onClick={handleCreateDb}
              className="px-1.5 py-0.5 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
            >
              ✓
            </button>
          </div>
        )}
      </div>

      <div className="mb-2 px-2">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索表名、表备注、字段名"
            className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-1.5 pr-8 text-xs text-[var(--text-primary)] focus:border-primary-500 focus:outline-none"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0Z" />
            </svg>
          </span>
        </div>
      </div>

      {databases.map((db) => (
        <div key={db.name} className="mb-2">
          <div
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors group ${
              selectedDatabase === db.name
                ? 'bg-primary-500/10 text-primary-500'
                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
            }`}
            onClick={() => handleDbClick(db.name)}
            onDoubleClick={() => handleDbDoubleClick(db.name)}
          >
            <span
              className="p-0.5 transition-transform"
              style={{
                transform: expandedDatabases.includes(db.name) ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
            {editingDb === db.name ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleDbBlur(db.name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleDbBlur(db.name);
                  if (e.key === 'Escape') setEditingDb(null);
                }}
                className="flex-1 px-1 py-0.5 text-sm bg-[var(--bg-surface)] border border-primary-500 rounded focus:outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="font-medium truncate max-w-[140px]" title={db.name}>{db.name}</span>
                {db.comment && (
                  <span className="text-[var(--text-tertiary)] text-xs truncate max-w-[100px]" title={db.comment}>({db.comment})</span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`确定删除数据库 ${db.name} 吗？`)) {
                      deleteDatabase(db.name);
                    }
                  }}
                  className="ml-auto p-1 text-risk-high hover:bg-risk-high/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除数据库"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {expandedDatabases.includes(db.name) && selectedDatabase === db.name && (
            <div className="ml-4 mt-1">
              {filteredTables.map((table) => {
                const displayTableComment = cleanTableComment(table.comment);
                return (
                  <div key={table.name} className="relative">
                    <div
                      className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors group ${
                        mainTable?.name === table.name && mainTable?.comment === table.comment
                          ? 'bg-primary-500/20 text-primary-500 border-l-2 border-primary-500'
                          : 'hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                      }`}
                      onClick={() => toggleTableExpand(`${db.name}.${table.name}`)}
                      onDoubleClick={() => handleTableDoubleClick(table.name)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTableExpand(`${db.name}.${table.name}`);
                        }}
                        className="p-0.5 hover:bg-[var(--bg-overlay)] rounded transition-transform"
                        style={{
                          transform: expandedTables.includes(`${db.name}.${table.name}`)
                            ? 'rotate(90deg)'
                            : 'rotate(0deg)',
                        }}
                      >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {editingTable === table.name ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleTableBlur(db.name, table.name)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleTableBlur(db.name, table.name);
                            if (e.key === 'Escape') setEditingTable(null);
                          }}
                          className="flex-1 px-1 py-0.5 text-sm bg-[var(--bg-surface)] border border-primary-500 rounded focus:outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <span className="truncate max-w-[150px]" title={table.name}>{table.name}</span>
                          {displayTableComment && (
                            <span className="text-[var(--text-tertiary)] text-xs truncate max-w-[100px]" title={displayTableComment}>({displayTableComment})</span>
                          )}
                        </>
                      )}
                    </div>

                    {expandedTables.includes(`${db.name}.${table.name}`) && (
                      <div className="ml-6 mt-1 overflow-y-auto" style={{ maxHeight: '150px' }}>
                        <div className="space-y-0.5">
                          {table.fields.map((field) => (
                            <div
                              key={field.name}
                              className="flex items-center gap-2 px-2 py-1 rounded text-[var(--text-tertiary)] text-xs hover:bg-[var(--bg-overlay)] cursor-context-menu"
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setContextMenu({ x: e.clientX, y: e.clientY, field, tableId: `${db.name}.${table.name}` });
                              }}
                            >
                              <span>{getFieldIcon(field.type)}</span>
                              <span className="font-mono truncate max-w-[100px]" title={field.name}>{field.name}</span>
                              <span className="text-[var(--text-tertiary)] flex-shrink-0">({field.type})</span>
                              {field.comment && (
                                <span className="text-[var(--text-tertiary)] italic truncate max-w-[150px]" title={field.comment}>"{field.comment}"</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
      {contextMenu && (
        <div
          className="fixed bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]"
            onClick={() => {
              const existing = getFieldMapping(contextMenu.tableId, contextMenu.field.name);
              const currentMappings = existing?.mappings || {};
              const newMapping = prompt(`为字段 ${contextMenu.field.name} 设置值映射\n格式: 1:待合作,2:已合作\n当前映射: ${JSON.stringify(currentMappings)}`);
              if (newMapping !== null) {
                const parsed: Record<string, string> = {};
                newMapping.split(',').forEach((pair) => {
                  const [key, value] = pair.split(':');
                  if (key && value) parsed[key.trim()] = value.trim();
                });
                if (Object.keys(parsed).length > 0) {
                  setFieldMapping(contextMenu.tableId, contextMenu.field.name, parsed);
                }
              }
              setContextMenu(null);
            }}
          >
            值映射配置
          </button>
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
