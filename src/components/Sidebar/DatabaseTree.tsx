import { useState } from 'react';
import { useDatabaseStore } from '@/stores/useDatabaseStore';
import { useQueryBuilderStore } from '@/stores/useQueryBuilderStore';
import { getFieldIcon } from '@/utils/jsonParser';

export function DatabaseTree() {
  const {
    databases,
    selectedDatabase,
    expandedDatabases,
    expandedTables,
    tags,
    setSelectedDatabase,
    updateDatabase,
    updateTable,
    createDatabase,
    toggleDatabaseExpand,
    toggleTableExpand,
    getFilteredTables,
    addTagToTables,
    removeTagFromTables,
    getTagById,
  } = useDatabaseStore();

  const { mainTable, setMainTable } = useQueryBuilderStore();

  const [editingDb, setEditingDb] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedTableIds, setSelectedTableIds] = useState<Set<string>>(new Set());
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showNewDbInput, setShowNewDbInput] = useState(false);
  const [newDbName, setNewDbName] = useState('');

  const filteredTables = getFilteredTables();

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

  const toggleTableSelection = (tableId: string) => {
    const newSet = new Set(selectedTableIds);
    if (newSet.has(tableId)) {
      newSet.delete(tableId);
    } else {
      newSet.add(tableId);
    }
    setSelectedTableIds(newSet);
  };

  const handleBulkAddTag = (tagId: string) => {
    if (selectedTableIds.size > 0) {
      addTagToTables(Array.from(selectedTableIds), tagId);
      setShowTagMenu(false);
      setSelectedTableIds(new Set());
    }
  };

  const handleBulkRemoveTag = (tagId: string) => {
    if (selectedTableIds.size > 0) {
      removeTagFromTables(Array.from(selectedTableIds), tagId);
    }
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
      {selectedDatabase && tags.length > 0 && (
        <div className="mb-2 px-2 py-1.5 bg-[var(--bg-elevated)] rounded-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--text-tertiary)]">批量打标签</span>
            {selectedTableIds.size > 0 && (
              <span className="text-xs text-primary-500">{selectedTableIds.size} 个表已选</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTagMenu(!showTagMenu)}
              disabled={selectedTableIds.size === 0}
              className="text-xs px-2 py-1 bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + 添加标签
            </button>
            {selectedTableIds.size > 0 && (
              <button
                onClick={() => setSelectedTableIds(new Set())}
                className="text-xs px-2 py-1 border border-[var(--border-default)] rounded hover:bg-[var(--bg-overlay)] transition-colors"
              >
                取消选择
              </button>
            )}
          </div>
          {showTagMenu && (
            <div className="mt-2 p-2 bg-[var(--bg-surface)] rounded border border-[var(--border-default)]">
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleBulkAddTag(tag.id)}
                    className="text-xs px-2 py-1 bg-accent-400/20 text-accent-400 rounded hover:bg-accent-400/30 transition-colors"
                  >
                    + {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedTableIds.size > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleBulkRemoveTag(tag.id)}
                  className="text-xs px-2 py-1 bg-risk-high/20 text-risk-high rounded hover:bg-risk-high/30 transition-colors"
                >
                  - {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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

      {databases.map((db) => (
        <div key={db.name} className="mb-2">
          <div
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
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
                <span className="font-medium truncate max-w-[180px]" title={db.name}>{db.name}</span>
                {db.comment && (
                  <span className="text-[var(--text-tertiary)] text-xs truncate max-w-[120px]" title={db.comment}>({db.comment})</span>
                )}
              </>
            )}
          </div>

          {expandedDatabases.includes(db.name) && selectedDatabase === db.name && (
            <div className="ml-4 mt-1">
              {filteredTables.map((table) => {
                const tableId = `${db.name}.${table.name}`;
                const isSelected = selectedTableIds.has(tableId);
                return (
                  <div key={table.name} className="relative">
                    <div
                      className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors group ${
                        mainTable?.name === table.name && mainTable?.comment === table.comment
                          ? 'bg-primary-500/20 text-primary-500 border-l-2 border-primary-500'
                          : isSelected
                          ? 'bg-primary-500/10 text-primary-500'
                          : 'hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                      }`}
                      onClick={() => setMainTable(table)}
                      onDoubleClick={() => handleTableDoubleClick(table.name)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTableSelection(tableId)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-3.5 h-3.5 rounded border-[var(--border-default)] text-primary-500 focus:ring-primary-500"
                      />
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
                          {table.comment && (
                            <span className="text-[var(--text-tertiary)] text-xs truncate max-w-[100px]" title={table.comment}>({table.comment})</span>
                          )}
                        </>
                      )}
                      {table.tags.length > 0 && (
                        <span className="ml-auto flex gap-1">
                          {table.tags.slice(0, 2).map((tagId) => {
                            const tag = getTagById(tagId);
                            return (
                              <span
                                key={tagId}
                                className="px-1.5 py-0.5 text-[10px] rounded bg-accent-400/20 text-accent-400"
                              >
                                {tag?.name || tagId}
                              </span>
                            );
                          })}
                        </span>
                      )}
                    </div>

                    {expandedTables.includes(`${db.name}.${table.name}`) && (
                      <div className="ml-6 mt-1 overflow-y-auto" style={{ maxHeight: '150px' }}>
                        <div className="space-y-0.5">
                          {table.fields.map((field) => (
                            <div
                              key={field.name}
                              className="flex items-center gap-2 px-2 py-1 rounded text-[var(--text-tertiary)] text-xs hover:bg-[var(--bg-overlay)]"
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
    </div>
  );
}