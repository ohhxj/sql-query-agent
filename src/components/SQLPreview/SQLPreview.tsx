import { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useQueryBuilderStore } from '@/stores/useQueryBuilderStore';
import { useDatabaseStore } from '@/stores/useDatabaseStore';
import { generateSQL, createDraft } from '@/utils/sqlGenerator';

function formatHistoryTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SQLPreview() {
  const [sql, setSql] = useState('');
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'vs'>('vs');

  const { selectedDatabase, setSelectedDatabase } = useDatabaseStore();
  const {
    mainTable,
    selectedFields,
    joinConfigs,
    joinSelectedFields,
    whereConditions,
    groupByFields,
    orderByFields,
    limit,
    queryHistory,
    saveQueryHistory,
    restoreQuerySnapshot,
    removeQueryHistory,
    clearQueryHistory,
  } = useQueryBuilderStore();

  useEffect(() => {
    const syncTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setEditorTheme(currentTheme === 'dark' ? 'vs-dark' : 'vs');
    };

    const handleThemeChange = () => syncTheme();

    syncTheme();
    window.addEventListener('themechange', handleThemeChange);

    return () => {
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  const handleGenerate = useCallback(() => {
    if (!mainTable) return;

    const allSelectedFields = [...selectedFields, ...joinSelectedFields];

    if (allSelectedFields.length === 0) {
      setSql('-- Select at least one field');
      return;
    }

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

    const generatedSql = generateSQL(draft);
    setSql(generatedSql);
    saveQueryHistory({
      title: `${mainTable.comment || mainTable.name}${groupByFields.length > 0 ? ' · 汇总' : ' · 明细'}`,
      sql: generatedSql,
      snapshot: {
        selectedDatabase,
        mainTable,
        selectedFields,
        joinConfigs,
        joinSelectedFields,
        whereConditions,
        groupByFields,
        orderByFields,
        limit,
      },
    });
  }, [mainTable, selectedFields, joinConfigs, joinSelectedFields, whereConditions, groupByFields, orderByFields, limit]);

  const handleRestoreHistory = (historyId: string) => {
    const target = queryHistory.find((item) => item.id === historyId);
    if (!target) {
      return;
    }

    setSelectedDatabase(target.snapshot.selectedDatabase);
    restoreQuerySnapshot(target.snapshot);
    setSql(target.sql);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFormat = () => {
    const lines = sql.split('\n');
    const formatted = lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('FROM') || trimmed.startsWith('WHERE') ||
          trimmed.startsWith('GROUP BY') || trimmed.startsWith('ORDER BY') || trimmed.startsWith('LIMIT') ||
          trimmed.startsWith('INNER JOIN') || trimmed.startsWith('LEFT JOIN') || trimmed.startsWith('RIGHT JOIN')) {
        return '\n' + trimmed;
      }
      return trimmed;
    }).join(' ').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',\n  ').replace(/\s+AND\s+/gi, '\n  AND ').replace(/\s+OR\s+/gi, '\n  OR ').trim();

    setSql(formatted);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-[var(--border-subtle)]">
        <span className="text-sm font-medium text-[var(--text-primary)]">SQL 预览</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={!mainTable}
            className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            生成
          </button>
          <button
            onClick={handleCopy}
            disabled={!sql}
            className="px-3 py-1.5 text-sm border border-[var(--border-default)] rounded-md hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-secondary)]"
          >
            {copied ? '已复制!' : '复制'}
          </button>
          <button
            onClick={handleFormat}
            disabled={!sql}
            className="px-3 py-1.5 text-sm border border-[var(--border-default)] rounded-md hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[var(--text-secondary)]"
          >
            格式化
          </button>
          <button
            onClick={() => setShowHistory((current) => !current)}
            className={`px-3 py-1.5 text-sm border border-[var(--border-default)] rounded-md transition-colors ${
              showHistory
                ? 'bg-primary-500/10 text-primary-500 border-primary-500'
                : 'hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
            }`}
          >
            历史
          </button>
        </div>
      </div>

      {showHistory && (
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-[var(--text-tertiary)]">已保存 {queryHistory.length} 条 SQL 记录</span>
            {queryHistory.length > 0 && (
              <button
                onClick={clearQueryHistory}
                className="text-xs text-[var(--text-tertiary)] hover:text-risk-high"
              >
                清空历史
              </button>
            )}
          </div>

          {queryHistory.length === 0 ? (
            <div className="px-3 pb-3 text-sm text-[var(--text-tertiary)]">
              还没有历史记录，点击一次“生成”后这里会自动保存。
            </div>
          ) : (
            <div className="max-h-52 space-y-2 overflow-y-auto px-3 pb-3">
              {queryHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] p-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleRestoreHistory(item.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="truncate text-sm text-[var(--text-primary)]">{item.title}</div>
                      <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                        {formatHistoryTime(item.createdAt)}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">
                        {item.sql}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQueryHistory(item.id)}
                      className="rounded px-2 py-1 text-xs text-[var(--text-tertiary)] hover:bg-risk-high/10 hover:text-risk-high"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={sql}
          onChange={(value) => setSql(value || '')}
          theme={editorTheme}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            padding: { top: 8 },
          }}
        />
      </div>
    </div>
  );
}
