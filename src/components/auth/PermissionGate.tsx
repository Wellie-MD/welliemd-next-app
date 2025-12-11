import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/constants/permissions';

interface PermissionGateProps {
  /**
   * Required permission(s). Can be a single permission or array of permissions.
   * If array, user needs ANY of the permissions (OR logic).
   */
  permission: Permission | string | (Permission | string)[];
  
  /**
   * Optional fallback to render when user doesn't have permission
   */
  fallback?: React.ReactNode;
  
  /**
   * Content to render when user has permission
   */
  children: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions.
 * 
 * Usage:
 * ```tsx
 * <PermissionGate permission={Permissions.BILLING_VIEW}>
 *   <BillingContent />
 * </PermissionGate>
 * 
 * <PermissionGate 
 *   permission={[Permissions.ORDER_LIST, Permissions.ORDER_VIEW]}
 *   fallback={<p>No access</p>}
 * >
 *   <OrdersList />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({ 
  permission, 
  fallback = null, 
  children 
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission } = usePermissions();
  
  const allowed = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission);
  
  return allowed ? <>{children}</> : <>{fallback}</>;
}
