import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';
import { Skeleton } from '../ui/skeleton';
import { Permission } from '@/constants/permissions';
import { RoleNames } from '@/constants/permissions';

const CLIENT_PORTAL_ROLES = new Set<string>([
  RoleNames.PRIMARY_OWNER,
  RoleNames.ADMIN,
  RoleNames.CUSTOMER_SERVICE,
  RoleNames.SUPER_ADMIN,
]);

const hasClientPortalRole = (user: { primary_role?: string; roles?: string[] } | null): boolean => {
  if (!user) {
    return false;
  }

  const assignedRoles = [
    user.primary_role,
    ...(Array.isArray(user.roles) ? user.roles : []),
  ].filter((role): role is string => Boolean(role));

  return assignedRoles.some((role) => CLIENT_PORTAL_ROLES.has(role.trim()));
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Optional permission(s) required to access this route.
   * If array, user needs ANY of the permissions (OR logic).
   */
  requiredPermission?: Permission | string | (Permission | string)[];
}

/**
 * A wrapper component that protects routes from unauthenticated access
 * and optionally checks for required permissions.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission 
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const { hasPermission, hasAnyPermission } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="w-32 h-32 rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  if (!hasClientPortalRole(user)) {
    return <Navigate to="/forbidden" replace />;
  }

  // Check permissions if required
  if (requiredPermission) {
    const allowed = Array.isArray(requiredPermission)
      ? hasAnyPermission(requiredPermission)
      : hasPermission(requiredPermission);
    
    if (!allowed) {
      // Redirect to 403 Forbidden page
      return <Navigate to="/forbidden" replace />;
    }
  }

  return <>{children}</>;
};
