'use client';

import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component for catching React errors
 * Best practice: Wrap high-risk components with error boundaries
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service (e.g., Sentry)
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry/LogRocket/etc
      // logErrorToService(error, errorInfo);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Terjadi Kesalahan
              </h2>
              <p className="text-gray-600 mb-4">
                Maaf, terjadi kesalahan yang tidak terduga.
              </p>
              <details className="text-left mb-4 p-3 bg-gray-100 rounded">
                <summary className="cursor-pointer text-sm font-medium">
                  Detail Error
                </summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
              <button
                onClick={this.reset}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
