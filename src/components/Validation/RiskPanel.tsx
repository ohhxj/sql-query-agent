import { useState, useCallback } from 'react';
import { checkAllRisks, getRiskSummary } from '@/utils/riskChecker';
import type { RiskResult } from '@/types';

export function RiskPanel() {
  const [result, setResult] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = useCallback(async () => {
    setLoading(true);
    const sqlElement = document.querySelector('.monaco-editor textarea') as HTMLTextAreaElement;
    const sql = sqlElement?.value || '';

    await new Promise((resolve) => setTimeout(resolve, 300));

    const riskResult = checkAllRisks(sql);
    setResult(riskResult);
    setLoading(false);
  }, []);

  const summary = result ? getRiskSummary(result) : null;

  return (
    <div className="border-t border-[var(--border-subtle)]">
      <div className="flex items-center justify-between p-3">
        <span className="text-sm font-medium text-[var(--text-primary)]">风险评估</span>
        <button
          onClick={handleCheck}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-accent-400 text-black rounded-md hover:bg-accent-500 transition-colors disabled:opacity-50"
        >
          {loading ? '检查中...' : '检查风险'}
        </button>
      </div>

      {summary && (
        <div className="px-3 pb-3">
          <div className="flex gap-3 mb-3">
            <div
              className={`flex-1 p-2 rounded-md text-center ${
                summary.high > 0 ? 'bg-risk-high-bg' : 'bg-[var(--bg-elevated)]'
              }`}
            >
              <div className={`text-lg font-bold ${summary.high > 0 ? 'text-risk-high' : 'text-[var(--text-tertiary)]'}`}>
                {summary.high}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">高</div>
            </div>
            <div
              className={`flex-1 p-2 rounded-md text-center ${
                summary.medium > 0 ? 'bg-risk-medium-bg' : 'bg-[var(--bg-elevated)]'
              }`}
            >
              <div className={`text-lg font-bold ${summary.medium > 0 ? 'text-risk-medium' : 'text-[var(--text-tertiary)]'}`}>
                {summary.medium}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">中</div>
            </div>
            <div
              className={`flex-1 p-2 rounded-md text-center ${
                summary.low > 0 ? 'bg-risk-low-bg' : 'bg-[var(--bg-elevated)]'
              }`}
            >
              <div className={`text-lg font-bold ${summary.low > 0 ? 'text-risk-low' : 'text-[var(--text-tertiary)]'}`}>
                {summary.low}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">低</div>
            </div>
          </div>

          {result && result.high.length > 0 && (
            <div className="space-y-2 mb-3">
              <div className="text-xs font-medium text-risk-high">高风险</div>
              {result.high.map((item) => (
                <div key={item.id} className="p-2 bg-risk-high-bg rounded-md text-sm">
                  <div className="text-risk-high">{item.message}</div>
                  {item.suggestion && (
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                      建议: {item.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result && result.medium.length > 0 && (
            <div className="space-y-2 mb-3">
              <div className="text-xs font-medium text-risk-medium">中风险</div>
              {result.medium.map((item) => (
                <div key={item.id} className="p-2 bg-risk-medium-bg rounded-md text-sm">
                  <div className="text-risk-medium">{item.message}</div>
                  {item.suggestion && (
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                      Suggestion: {item.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result && result.low.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-risk-low">低风险</div>
              {result.low.map((item) => (
                <div key={item.id} className="p-2 bg-risk-low-bg rounded-md text-sm">
                  <div className="text-risk-low">{item.message}</div>
                  {item.suggestion && (
                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                      Suggestion: {item.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {summary.total === 0 && (
            <div className="p-3 bg-risk-low-bg rounded-md text-center text-sm text-risk-low">
              No risks detected. SQL looks good!
            </div>
          )}
        </div>
      )}

      {!summary && !loading && (
        <div className="px-3 pb-3 text-center text-sm text-[var(--text-tertiary)]">
          点击"检查风险"分析潜在问题
        </div>
      )}
    </div>
  );
}
