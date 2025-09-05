import { Navigate } from 'react-router-dom';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { ROUTES } from '@/config/routes';
import { Permission, UserRole } from '@/features/auth/types/auth.types';
import { debugLog } from '@/config/env';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions/roles, otherwise ANY
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * RoleGuard component that checks user permissions and roles
 * Provides fine-grained access control for routes and components
 */
export function RoleGuard({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallback,
  redirectTo = ROUTES.UNAUTHORIZED,
}: RoleGuardProps) {
  const { user, hasPermission, hasAnyPermission, hasAllPermissions, isAuthenticated } = useAuthStore();

  debugLog('RoleGuard check:', {
    user: user?.email,
    userRole: user?.role,
    requiredRoles,
    requiredPermissions,
    requireAll,
    isAuthenticated,
  });

  // Must be authenticated to check roles/permissions
  if (!isAuthenticated || !user) {
    debugLog('User not authenticated for role guard');
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      debugLog('User does not have required role:', {
        userRole: user.role,
        requiredRoles,
      });
      
      if (fallback) {
        return <>{fallback}</>;
      }
      
      return <Navigate to={redirectTo} replace />;
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    let hasRequiredPermissions: boolean;
    
    if (requireAll) {
      hasRequiredPermissions = hasAllPermissions(requiredPermissions);
    } else {
      hasRequiredPermissions = hasAnyPermission(requiredPermissions);
    }

    if (!hasRequiredPermissions) {
      debugLog('User does not have required permissions:', {
        requiredPermissions,
        requireAll,
        userPermissions: useAuthStore.getState().permissions,
      });
      
      if (fallback) {
        return <>{fallback}</>;
      }
      
      return <Navigate to={redirectTo} replace />;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Hook for checking permissions in components
 */
export function usePermissions() {
  const { hasPermission, hasAnyPermission, hasAllPermissions, user } = useAuthStore();

  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(permission);
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    return hasAnyPermission(permissions);
  };

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    return hasAllPermissions(permissions);
  };

  const checkRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const checkAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  return {
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    checkRole,
    checkAnyRole,
    user,
  };
}

/**
 * Higher-order component for wrapping components with role guards
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<RoleGuardProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <RoleGuard {...guardProps}>
      <Component {...props} />
    </RoleGuard>
  );

  WrappedComponent.displayName = `withRoleGuard(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Component for conditionally rendering content based on permissions
 */
interface ConditionalRenderProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  inverse?: boolean; // If true, render children when conditions are NOT met
}

export function ConditionalRender({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallback = null,
  inverse = false,
}: ConditionalRenderProps) {
  const { user, hasAnyPermission, hasAllPermissions, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return inverse ? <>{children}</> : <>{fallback}</>;
  }

  let shouldRender = true;

  // Check role requirements
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    if (!hasRequiredRole) {
      shouldRender = false;
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0 && shouldRender) {
    let hasRequiredPermissions: boolean;
    
    if (requireAll) {
      hasRequiredPermissions = hasAllPermissions(requiredPermissions);
    } else {
      hasRequiredPermissions = hasAnyPermission(requiredPermissions);
    }

    if (!hasRequiredPermissions) {
      shouldRender = false;
    }
  }

  // Apply inverse logic if specified
  if (inverse) {
    shouldRender = !shouldRender;
  }

  return shouldRender ? <>{children}</> : <>{fallback}</>;
}

