import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { ROUTES } from '@/config/routes';
import { debugLog } from '@/config/env';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * ProtectedRoute component that checks authentication status
 * Redirects to login page if user is not authenticated
 */
export function ProtectedRoute({ 
  children, 
  fallback,
  redirectTo = ROUTES.LOGIN 
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthStore();

  debugLog('ProtectedRoute check:', { 
    isAuthenticated, 
    isLoading, 
    path: location.pathname 
  });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    debugLog('User not authenticated, redirecting to:', redirectTo);
    
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location.pathname,
          message: 'Please sign in to access this page'
        }} 
        replace 
      />
    );
  }

  // Show fallback if provided and user is authenticated
  if (fallback && isAuthenticated) {
    return <>{fallback}</>;
  }

  // Render children if authenticated
  return <>{children}</>;
}

