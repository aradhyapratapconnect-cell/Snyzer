import { Component, type ErrorInfo, type ReactNode } from 'react';

interface RootErrorBoundaryProps {
  children: ReactNode;
}

interface RootErrorBoundaryState {
  hasError: boolean;
}

/**
 * Root React error boundary (SNZ-003). Catches unhandled rendering
 * exceptions anywhere below it and shows a recoverable fallback instead of
 * a blank page. Diagnostics go to the console only.
 */
export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): RootErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[snyzer] unhandled render error', error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex min-h-screen items-center justify-center bg-canvas-light p-6 dark:bg-canvas-dark"
        >
          <div className="max-w-md rounded-xl border border-line-light bg-surface-light p-6 text-center dark:border-line-dark dark:bg-surface-dark">
            <h1 className="text-xl font-semibold text-ink-light dark:text-ink-dark">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-subink-light dark:text-subink-dark">
              The page ran into a problem while rendering. Your work is preserved wherever the
              editor autosaves it.
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
