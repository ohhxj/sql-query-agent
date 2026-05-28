import { useState } from 'react';
import { Header } from '@/components/Header';
import { DatabaseTree } from '@/components/Sidebar/DatabaseTree';
import { FieldSelector } from '@/components/QueryBuilder/FieldSelector';
import { WhereBuilder } from '@/components/QueryBuilder/WhereBuilder';
import { JoinConfig } from '@/components/QueryBuilder/JoinConfig';
import { OrderByLimit } from '@/components/QueryBuilder/OrderByLimit';
import { SQLPreview } from '@/components/SQLPreview/SQLPreview';
import { GlobalErrorCatcher } from '@/components/GlobalErrorCatcher';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)]">
      <GlobalErrorCatcher />
      <Header />

      <div className="flex-1 flex min-h-0">
        <div
          className={`relative flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all duration-200 ${
            isSidebarCollapsed ? 'w-12' : 'w-80'
          }`}
        >
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
            className="absolute right-2 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] shadow-sm transition-colors hover:border-primary-500 hover:text-primary-500"
            title={isSidebarCollapsed ? '展开左侧栏' : '收起左侧栏'}
          >
            <svg
              className={`h-4 w-4 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 19-7-7 7-7" />
            </svg>
          </button>

          {isSidebarCollapsed ? (
            <div className="flex h-full items-start justify-center pt-14">
              <div className="writing-mode-vertical text-xs tracking-[0.18em] text-[var(--text-tertiary)] [writing-mode:vertical-rl]">
                数据库
              </div>
            </div>
          ) : (
            <aside className="flex h-full flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-1">
                <DatabaseTree />
              </div>
            </aside>
          )}
        </div>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            <div className="flex-1 p-4 space-y-4 overflow-y-auto border-b border-[var(--border-subtle)] lg:border-b-0 lg:border-r border-[var(--border-subtle)]">
              <section className="bg-[var(--bg-surface)] rounded-lg p-4">
                <FieldSelector />
              </section>

              <section className="bg-[var(--bg-surface)] rounded-lg p-4">
                <WhereBuilder />
              </section>

              <section className="bg-[var(--bg-surface)] rounded-lg p-4">
                <JoinConfig />
              </section>

              <section className="bg-[var(--bg-surface)] rounded-lg p-4">
                <OrderByLimit />
              </section>
            </div>

            <div className="lg:w-[38%] xl:w-[36%] flex flex-col min-h-0 overflow-hidden bg-[var(--bg-surface)]">
              <div className="flex-none h-[360px] overflow-hidden border-b border-[var(--border-subtle)]">
                <SQLPreview />
              </div>

              <div className="flex-1 min-h-0 p-4">
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)]">
                  <div className="text-center">
                    <div className="text-sm font-medium text-[var(--text-primary)]">功能扩展区</div>
                    <div className="mt-2 text-xs text-[var(--text-tertiary)]">
                      这里预留给后续新增的查询辅助或结果分析模块
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
