"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { createLogger } from "@lib/logger";
import { cn } from "@lib/utils/style";

const logger = createLogger("ErrorBoundary");

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show error details in development */
  showDetails?: boolean;
}

/**
 * Error boundary component to catch and handle React errors gracefully
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <div>
 *       <p>Something went wrong: {error.message}</p>
 *       <button onClick={reset}>Try again</button>
 *     </div>
 *   )}
 *   onError={(error) => logError(error)}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    logger.error("Uncaught error in component tree", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails } = this.props;

    if (hasError && error) {
      // Custom fallback function
      if (typeof fallback === "function") {
        return fallback(error, this.reset);
      }

      // Custom fallback element
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          onReset={this.reset}
          showDetails={showDetails ?? process.env.NODE_ENV === "development"}
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;
export { ErrorBoundary };

// Default error fallback component
interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  showDetails: boolean;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  onReset,
  showDetails,
}: DefaultErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="border-danger/30 bg-danger/10 flex min-h-[200px] flex-col items-center justify-center rounded-xl border p-8"
    >
      <div className="bg-danger/20 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <i className="gng-alert-triangle text-danger text-2xl" />
      </div>

      <h2 className="mb-2 text-lg font-semibold text-white">Something went wrong</h2>

      <p className="text-grey-400 mb-4 text-center text-sm">
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </p>

      <button
        onClick={onReset}
        className="bg-action-600 hover:bg-action-500 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
      >
        Try again
      </button>

      {showDetails && (
        <details className="mt-6 w-full max-w-lg">
          <summary className="text-grey-500 hover:text-grey-400 cursor-pointer text-sm">
            Error details
          </summary>
          <div className="bg-grey-900 mt-2 overflow-auto rounded-lg p-4">
            <p className="text-danger mb-2 font-mono text-sm">{error.message}</p>
            {errorInfo?.componentStack && (
              <pre className="text-grey-500 font-mono text-xs whitespace-pre-wrap">
                {errorInfo.componentStack}
              </pre>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

/**
 * Higher-order component to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
}

/**
 * Section-level error boundary with minimal UI
 */
interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export function SectionErrorBoundary({
  children,
  sectionName,
  onError,
}: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={onError}
      fallback={(error, reset) => (
        <div className="border-grey-700 bg-grey-800/50 rounded-lg border p-4">
          <div className="text-grey-400 flex items-center gap-2 text-sm">
            <i className="gng-alert-circle text-warning" />
            <span>
              {sectionName ? `Failed to load ${sectionName}` : "This section failed to load"}
            </span>
          </div>
          <button onClick={reset} className="text-action-400 hover:text-action-300 mt-2 text-sm">
            Retry
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Query error boundary for data fetching errors
 */
interface QueryErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  className?: string;
}

export function QueryErrorBoundary({ children, onError, className }: QueryErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={onError}
      fallback={(error, reset) => (
        <div className={cn("flex flex-col items-center gap-4 p-8", className)}>
          <div className="bg-danger/20 flex h-12 w-12 items-center justify-center rounded-full">
            <i className="gng-wifi-off text-danger text-xl" />
          </div>
          <div className="text-center">
            <p className="font-medium text-white">Failed to load data</p>
            <p className="text-grey-400 mt-1 text-sm">
              {error.message || "Please check your connection and try again"}
            </p>
          </div>
          <button
            onClick={reset}
            className="bg-grey-800 hover:bg-grey-700 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            <i className="gng-refresh-cw text-sm" />
            Retry
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
