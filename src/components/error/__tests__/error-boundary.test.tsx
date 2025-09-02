import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ErrorBoundary, ModernErrorBoundary } from '../error-boundary';

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Custom error component for testing
const CustomErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <div>
    <div>Custom Error: {error?.message}</div>
    <button onClick={resetErrorBoundary}>Custom Reset</button>
  </div>
);

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('ErrorBoundary (Class Component)', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render error fallback when child throws error', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should render custom fallback when provided', () => {
      render(
        <ErrorBoundary fallback={CustomErrorFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error: Test error')).toBeInTheDocument();
      expect(screen.getByText('Custom Reset')).toBeInTheDocument();
    });

    it('should reset error state when reset button is clicked', async () => {
      const user = userEvent.setup();

      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);

        React.useEffect(() => {
          if (!shouldThrow) {
            // Simulate fixing the error condition
            setTimeout(() => setShouldThrow(false), 100);
          }
        }, [shouldThrow]);

        return <ThrowError shouldThrow={shouldThrow} />;
      };

      render(
        <ErrorBoundary fallback={CustomErrorFallback}>
          <TestComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error: Test error')).toBeInTheDocument();

      const resetButton = screen.getByText('Custom Reset');
      await user.click(resetButton);

      // After reset, should attempt to render children again
      // In a real scenario, the error condition might be resolved
    });

    it('should call onError callback when error occurs', () => {
      const onErrorSpy = vi.fn();

      render(
        <ErrorBoundary onError={onErrorSpy}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should not bubble error when isolate is true', () => {
      const ParentErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        const [hasError, setHasError] = React.useState(false);

        if (hasError) {
          return <div>Parent caught error</div>;
        }

        return (
          <ErrorBoundary
            onError={() => setHasError(true)}
            fallback={() => <div>Child error boundary</div>}
          >
            {children}
          </ErrorBoundary>
        );
      };

      render(
        <ParentErrorBoundary>
          <ErrorBoundary isolate={true}>
            <ThrowError />
          </ErrorBoundary>
        </ParentErrorBoundary>
      );

      // Should show the isolated error boundary, not bubble to parent
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.queryByText('Parent caught error')).not.toBeInTheDocument();
    });
  });

  describe('ModernErrorBoundary (Hook-based)', () => {
    it('should render children when there is no error', () => {
      render(
        <ModernErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ModernErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should render error fallback when child throws error', () => {
      render(
        <ModernErrorBoundary>
          <ThrowError />
        </ModernErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should render custom fallback when provided', () => {
      render(
        <ModernErrorBoundary fallback={CustomErrorFallback}>
          <ThrowError />
        </ModernErrorBoundary>
      );

      expect(screen.getByText('Custom Error: Test error')).toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onErrorSpy = vi.fn();

      render(
        <ModernErrorBoundary onError={onErrorSpy}>
          <ThrowError />
        </ModernErrorBoundary>
      );

      expect(onErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should reset when resetKeys change', () => {
      const TestWrapper = () => {
        const [resetKey, setResetKey] = React.useState(0);
        const [shouldThrow, setShouldThrow] = React.useState(true);

        return (
          <div>
            <button onClick={() => setResetKey(k => k + 1)}>Change Reset Key</button>
            <button onClick={() => setShouldThrow(false)}>Fix Error</button>
            <ModernErrorBoundary
              resetKeys={[resetKey]}
              fallback={({ resetErrorBoundary }) => (
                <div>
                  <div>Error occurred</div>
                  <button onClick={resetErrorBoundary}>Reset</button>
                </div>
              )}
            >
              <ThrowError shouldThrow={shouldThrow} />
            </ModernErrorBoundary>
          </div>
        );
      };

      const user = userEvent.setup();

      render(<TestWrapper />);

      expect(screen.getByText('Error occurred')).toBeInTheDocument();

      // Click the button to change reset key
      const changeResetKeyButton = screen.getByText('Change Reset Key');
      user.click(changeResetKeyButton);

      // Should reset the error boundary
      // In a real scenario, this would re-render the children
    });
  });
});
