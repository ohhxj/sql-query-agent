import { Header } from '@/components/Header';
import { DatabaseTree } from '@/components/Sidebar/DatabaseTree';
import { FieldSelector } from '@/components/QueryBuilder/FieldSelector';
import { WhereBuilder } from '@/components/QueryBuilder/WhereBuilder';
import { JoinConfig } from '@/components/QueryBuilder/JoinConfig';
import { OrderByLimit } from '@/components/QueryBuilder/OrderByLimit';
import { SQLPreview } from '@/components/SQLPreview/SQLPreview';
import { RiskPanel } from '@/components/Validation/RiskPanel';
import { AIValidator } from '@/components/Validation/AIValidator';
import { GlobalErrorCatcher } from '@/components/GlobalErrorCatcher';

function App() {
  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)]">
      <GlobalErrorCatcher />
      <Header />

      <div className="flex-1 flex min-h-0">
        <aside className="w-80 flex-shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <DatabaseTree />
          </div>
        </aside>

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

            <div className="lg:w-1/2 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-none h-[300px] overflow-hidden border-b border-[var(--border-subtle)]">
                <SQLPreview />
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <AIValidator />
                <RiskPanel />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
