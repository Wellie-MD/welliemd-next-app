import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ROUTES } from '@/config/routes';
import { debugLog } from '@/config/env';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  fallback,
  redirectTo = ROUTES.LOGIN 
}: ProtectedRouteProps) {
  const location = useLocation();  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  debugLog('ProtectedRoute check:', { 
    isAuthenticated, 
    isLoading, 
    path: location.pathname 
  });

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

  if (!isAuthenticated) {
    debugLog('User not authenticated, redirecting to:', redirectTo);
    
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: `${location.pathname}${location.search}${location.hash}`,
          message: 'Please sign in to access this page'
        }} 
        replace 
      />
    );
  }

  if (fallback && isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
