import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { FallbackProps } from 'react-error-boundary';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorUtils } from '@/shared/lib/errors';
import { isDev } from '@/config/env';

interface ErrorFallbackProps extends FallbackProps {
  errorInfo?: React.ErrorInfo | null;
}

/**
 * Default error fallback component
 * Displays user-friendly error message with recovery options
 */
export function ErrorFallback({ error, resetErrorBoundary, errorInfo }: ErrorFallbackProps) {
  const errorDetails = ErrorUtils.formatErrorForUser(error);

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReportError = () => {
    // In a real app, this would open a support form or send error report
    const errorReport = {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.log('Error Report:', errorReport);
    
    // Example: Open email client with pre-filled error report
    const subject = encodeURIComponent('Error Report - WellieMD Patient Portal');
    const body = encodeURIComponent(`
An error occurred in the application:

Error: ${error?.message}
Time: ${new Date().toLocaleString()}
Page: ${window.location.href}

Please describe what you were doing when this error occurred:
[Please describe your actions here]

Technical Details:
${JSON.stringify(errorReport, null, 2)}
    `);
    
    window.open(`mailto:support@welliemd.com?subject=${subject}&body=${body}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">{errorDetails.title}</CardTitle>
          <CardDescription className="text-gray-600">
            {errorDetails.message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isDev && error && (
            <Alert>
              <Bug className="h-4 w-4" />
              <AlertDescription className="font-mono text-xs">
                <strong>Development Error:</strong>
                <br />
                {error.message}
                {error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-semibold">Stack Trace</summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs">{error.stack}</pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm text-gray-600">You can try the following:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Refresh the page</li>
              <li>Go back to the home page</li>
              <li>Clear your browser cache</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="flex w-full space-x-2">
            <Button 
              onClick={resetErrorBoundary} 
              className="flex-1"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button 
              onClick={handleGoHome} 
              variant="outline"
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
          
          <div className="flex w-full space-x-2">
            <Button 
              onClick={handleReload} 
              variant="outline" 
              size="sm"
              className="flex-1"
            >
              Reload Page
            </Button>
            <Button 
              onClick={handleReportError} 
              variant="ghost" 
              size="sm"
              className="flex-1"
            >
              Report Issue
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Minimal error fallback for smaller components
 */
export function MinimalErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorDetails = ErrorUtils.formatErrorForUser(error);

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{errorDetails.title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{errorDetails.message}</p>
          </div>
          <div className="mt-3">
            <Button
              onClick={resetErrorBoundary}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-800 hover:bg-red-100"
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Network error specific fallback
 */
export function NetworkErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <AlertTriangle className="h-6 w-6 text-gray-400" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">Connection Problem</h3>
        <p className="mt-1 text-sm text-gray-500">
          Unable to connect to the server. Please check your internet connection.
        </p>
      </div>
      <Button onClick={resetErrorBoundary} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}

/**
 * Loading error fallback for async components
 */
export function LoadingErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex min-h-[100px] items-center justify-center">
      <div className="text-center space-y-2">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
        <div>
          <p className="text-sm font-medium text-gray-900">Failed to load</p>
          <p className="text-xs text-gray-500">{ErrorUtils.getErrorMessage(error)}</p>
        </div>
        <Button onClick={resetErrorBoundary} size="sm" variant="outline">
          Retry
        </Button>
      </div>
    </div>
  );
}
