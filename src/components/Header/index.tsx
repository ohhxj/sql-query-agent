import { useState, useRef, useEffect } from 'react';
import { useDatabaseStore } from '@/stores/useDatabaseStore';
import { isSQLFormat } from '@/utils/sqlParser';
import helperAvatar from '@/assets/sql-helper-avatar.svg';

export function Header() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const { importJSON, importSQL, createDatabase, databases } = useDatabaseStore();
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pendingContent, setPendingContent] = useState<string | null>(null);
  const [isSQL, setIsSQL] = useState(false);
  const [selectedDb, setSelectedDb] = useState<string>('');
  const [newDbName, setNewDbName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  }, [theme]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setPendingContent(content);
      setShowModal(true);
      setSelectedDb(databases.length > 0 ? databases[0].name : '');
      setNewDbName('');
      setIsCreatingNew(false);
      setIsSQL(isSQLFormat(content));
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!pendingContent) return;

    let targetDbName = selectedDb;

    if (isCreatingNew) {
      if (!newDbName.trim()) {
        setError('请输入新数据库名称');
        setTimeout(() => setError(null), 3000);
        return;
      }
      const newDb = createDatabase(newDbName.trim());
      targetDbName = newDb.name;
    }

    if (!targetDbName) {
      setError('请选择或创建数据库');
      setTimeout(() => setError(null), 3000);
      return;
    }

    let result;
    if (isSQL) {
      result = importSQL(pendingContent, targetDbName);
    } else {
      result = importJSON(pendingContent, targetDbName);
    }

    if (!result.success) {
      setError(result.error || '导入失败');
      setTimeout(() => setError(null), 3000);
    }

    setShowModal(false);
    setPendingContent(null);
  };

  const handleCancelImport = () => {
    setShowModal(false);
    setPendingContent(null);
    setSelectedDb('');
    setNewDbName('');
    setIsCreatingNew(false);
    setIsSQL(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <>
      <header className="h-14 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-sm">
            <img
              src={helperAvatar}
              alt="SQL 小助手头像"
              className="h-8 w-8"
            />
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="text-lg font-semibold tracking-[0.02em] text-[var(--text-primary)]">
              SQL 小助手
            </h1>
            <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.26em] text-primary-500">
              smart query mate
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer px-4 py-2 rounded-md bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">
            <span>导入文件</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.sql"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-[var(--bg-elevated)] transition-colors"
            title="切换主题"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {error && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-risk-high text-white text-sm rounded-md shadow-lg z-50">
            {error}
          </div>
        )}
      </header>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-surface)] rounded-lg p-6 w-96 shadow-xl border border-[var(--border-default)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              导入表结构 {isSQL && <span className="text-xs text-primary-500">(SQL 格式)</span>}
            </h2>

            {databases.length === 0 && !isCreatingNew ? (
              <>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  当前暂无数据库，请先创建数据库再导入表结构。
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCancelImport}
                    className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    关闭
                  </button>
                  <button
                    onClick={() => setIsCreatingNew(true)}
                    className="px-4 py-2 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
                  >
                    创建数据库
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  选择要导入到的数据库，或创建新的数据库
                </p>

                <div className="mb-4">
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">选择数据库</label>
                  <select
                    value={selectedDb}
                    onChange={(e) => {
                      setSelectedDb(e.target.value);
                      setIsCreatingNew(false);
                    }}
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md focus:outline-none focus:border-primary-500 text-[var(--text-primary)]"
                  >
                    <option value="">— 选择已有数据库 —</option>
                    {databases.map((db) => (
                      <option key={db.name} value={db.name}>
                        {db.name} {db.comment ? `(${db.comment})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCreatingNew}
                      onChange={(e) => {
                        setIsCreatingNew(e.target.checked);
                        if (e.target.checked) {
                          setSelectedDb('');
                        }
                      }}
                      className="rounded border-[var(--border-default)] text-primary-500 focus:ring-primary-500"
                    />
                    创建新数据库
                  </label>
                  {isCreatingNew && (
                    <input
                      type="text"
                      value={newDbName}
                      onChange={(e) => setNewDbName(e.target.value)}
                      placeholder="新数据库名称"
                      className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md focus:outline-none focus:border-primary-500 text-[var(--text-primary)]"
                      autoFocus
                    />
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCancelImport}
                    className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={!selectedDb && !isCreatingNew}
                    className="px-4 py-2 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确认导入
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
