import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('UI runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-4 rounded-lg border border-risk-high/40 bg-risk-high-bg p-4 text-sm text-risk-high">
          <div className="font-medium">页面发生运行时错误</div>
          <div className="mt-2 break-all opacity-90">
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded bg-risk-high px-3 py-1.5 text-xs text-white hover:opacity-90"
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
