// client/src/components/ErrorBoundary.tsx
import React from 'react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Chart error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400">Something went wrong with the chart.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;