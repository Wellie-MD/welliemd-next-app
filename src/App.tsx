
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppRouter } from './app/router';
import { useAuthInit, useTokenRefresh, useAuthSideEffects } from '@/features/auth';
import { LoadingSkeleton } from './components/common/loading-skeleton';

/**
 * Main App component with authentication initialization and routing
 */
export default function App() {
  const { isInitialized, isInitializing, initError } = useAuthInit();
  
  // Initialize token refresh and session management
  useTokenRefresh();
  useAuthSideEffects();

  // Show loading screen while initializing auth
  if (isInitializing || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <LoadingSkeleton className="w-16 h-16 rounded-full mx-auto" />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Loading WellieMD</h2>
            <p className="text-muted-foreground">Please wait while we initialize your session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-destructive text-2xl">⚠</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-destructive">Initialization Error</h2>
            <p className="text-muted-foreground text-sm">
              We encountered an error while loading the application. Please refresh the page to try again.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="min-h-screen bg-background">
        <AppRouter />
        
        {/* Global toast notifications */}
        <Toaster 
          position="top-right"
          expand={false}
          richColors
          closeButton
        />
      </div>
    </Router>
  );
}