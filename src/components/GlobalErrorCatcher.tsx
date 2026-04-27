import { useEffect, useState } from 'react';

type GlobalErrorState = {
  message: string;
  source?: string;
};

export function GlobalErrorCatcher() {
  const [error, setError] = useState<GlobalErrorState | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError({
        message: event.error?.message || event.message || 'Unknown runtime error',
        source: event.filename
          ? `${event.filename}:${event.lineno ?? 0}:${event.colno ?? 0}`
          : undefined,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      setError({
        message:
          reason instanceof Error
            ? reason.message
            : typeof reason === 'string'
            ? reason
            : JSON.stringify(reason),
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (!error) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 top-4 z-[9999] rounded-lg border border-risk-high/40 bg-risk-high-bg p-4 text-sm text-risk-high shadow-lg">
      <div className="font-medium">捕获到运行时错误</div>
      <div className="mt-1 break-all">{error.message}</div>
      {error.source && (
        <div className="mt-1 text-xs opacity-80 break-all">{error.source}</div>
      )}
      <button
        type="button"
        onClick={() => setError(null)}
        className="mt-3 rounded bg-risk-high px-3 py-1.5 text-xs text-white hover:opacity-90"
      >
        关闭
      </button>
    </div>
  );
}
