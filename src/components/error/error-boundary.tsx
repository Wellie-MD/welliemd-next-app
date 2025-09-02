import { Component, ErrorInfo, ReactNode } from 'react';

import { ErrorUtils } from '@/shared/lib/errors';
import { ErrorFallback } from './error-fallback';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // If true, prevents error from bubbling up
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}

/**
 * Error boundary component that catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of the component tree that crashed.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    ErrorUtils.logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Don't bubble up if isolate is true
    if (this.props.isolate) {
      return;
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary using react-error-boundary
 * This is a more modern approach using the react-error-boundary library
 */
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';

interface ModernErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  onReset?: () => void;
  resetKeys?: Array<string | number | boolean | null | undefined>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
}

export function ModernErrorBoundary({
  children,
  fallback: FallbackComponent = ErrorFallback,
  onError,
  onReset,
  resetKeys,
  resetOnPropsChange = true,
  isolate = false,
}: ModernErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: { componentStack: string }) => {
    // Log the error
    ErrorUtils.logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ModernErrorBoundary',
    });

    // Call custom error handler if provided
    onError?.(error, errorInfo);

    // Don't bubble up if isolate is true
    if (isolate) {
      return;
    }
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={handleError}
      onReset={onReset}
      resetKeys={resetKeys}
      resetOnPropsChange={resetOnPropsChange}
    >
      {children}
    </ReactErrorBoundary>
  );
}

/**
 * Higher-order component that wraps a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

/**
 * Hook for manually triggering error boundaries
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error;
  };
}

/**
 * Async error boundary wrapper for handling promise rejections
 */
interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
  onError?: (error: Error) => void;
}

export function AsyncErrorBoundary({ children, fallback, onError }: AsyncErrorBoundaryProps) {
  const handleError = useErrorHandler();

  // Handle unhandled promise rejections
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      
      ErrorUtils.logError(error, {
        type: 'unhandledPromiseRejection',
        reason: event.reason,
      });

      onError?.(error);
      handleError(error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError, onError]);

  return (
    <ModernErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ModernErrorBoundary>
  );
}
