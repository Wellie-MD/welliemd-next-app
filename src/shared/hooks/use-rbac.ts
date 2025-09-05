import { useMemo } from 'react';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { 
  Permission, 
  UserRole, 
  PERMISSIONS, 
  ROLE_PERMISSIONS 
} from '@/features/auth/types/auth.types';
import { debugLog } from '@/config/env';

/**
 * Hook for Role-Based Access Control (RBAC)
 * Provides utilities for checking permissions and roles
 */
export function useRBAC() {
  const { user, permissions, hasPermission, hasAnyPermission, hasAllPermissions } = useAuthStore();

  // Memoized permission checkers for performance
  const rbacUtils = useMemo(() => ({
    // Permission checkers
    can: (permission: Permission): boolean => {
      const result = hasPermission(permission);
      debugLog('RBAC.can:', { permission, result, userPermissions: permissions });
      return result;
    },

    canAny: (requiredPermissions: Permission[]): boolean => {
      const result = hasAnyPermission(requiredPermissions);
      debugLog('RBAC.canAny:', { requiredPermissions, result, userPermissions: permissions });
      return result;
    },

    canAll: (requiredPermissions: Permission[]): boolean => {
      const result = hasAllPermissions(requiredPermissions);
      debugLog('RBAC.canAll:', { requiredPermissions, result, userPermissions: permissions });
      return result;
    },

    // Role checkers
    hasRole: (role: UserRole): boolean => {
      const result = user?.role === role;
      debugLog('RBAC.hasRole:', { role, result, userRole: user?.role });
      return result;
    },

    hasAnyRole: (roles: UserRole[]): boolean => {
      const result = user ? roles.includes(user.role) : false;
      debugLog('RBAC.hasAnyRole:', { roles, result, userRole: user?.role });
      return result;
    },

    // Combined checkers
    canAccessRoute: (requiredRoles?: UserRole[], requiredPermissions?: Permission[]): boolean => {
      if (!user) return false;

      // Check role requirements
      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(user.role)) {
          debugLog('RBAC.canAccessRoute: Role check failed', { 
            requiredRoles, 
            userRole: user.role 
          });
          return false;
        }
      }

      // Check permission requirements
      if (requiredPermissions && requiredPermissions.length > 0) {
        if (!hasAnyPermission(requiredPermissions)) {
          debugLog('RBAC.canAccessRoute: Permission check failed', { 
            requiredPermissions, 
            userPermissions: permissions 
          });
          return false;
        }
      }

      return true;
    },

    // Resource-specific permissions
    canViewPatients: (): boolean => {
      return rbacUtils.can(PERMISSIONS.PROVIDER_VIEW_PATIENTS);
    },

    canManagePatients: (): boolean => {
      return rbacUtils.canAny([
        PERMISSIONS.PROVIDER_VIEW_PATIENTS,
        PERMISSIONS.PROVIDER_UPDATE_PATIENT_RECORDS,
      ]);
    },

    canViewOwnData: (): boolean => {
      return rbacUtils.can(PERMISSIONS.PATIENT_READ_OWN_DATA);
    },

    canBookAppointments: (): boolean => {
      return rbacUtils.can(PERMISSIONS.PATIENT_BOOK_APPOINTMENTS);
    },

    canManageAppointments: (): boolean => {
      return rbacUtils.can(PERMISSIONS.PROVIDER_MANAGE_APPOINTMENTS);
    },

    canPrescribeMedications: (): boolean => {
      return rbacUtils.can(PERMISSIONS.PROVIDER_PRESCRIBE_MEDICATIONS);
    },

    canViewAnalytics: (): boolean => {
      return rbacUtils.can(PERMISSIONS.PROVIDER_VIEW_ANALYTICS);
    },

    canManageUsers: (): boolean => {
      return rbacUtils.can(PERMISSIONS.ADMIN_MANAGE_USERS);
    },

    canManageProviders: (): boolean => {
      return rbacUtils.can(PERMISSIONS.ADMIN_MANAGE_PROVIDERS);
    },

    canViewSystemLogs: (): boolean => {
      return rbacUtils.can(PERMISSIONS.ADMIN_VIEW_SYSTEM_LOGS);
    },

    canManageSettings: (): boolean => {
      return rbacUtils.can(PERMISSIONS.ADMIN_MANAGE_SETTINGS);
    },

    // Utility functions
    isPatient: (): boolean => rbacUtils.hasRole(UserRole.PATIENT),
    isProvider: (): boolean => rbacUtils.hasRole(UserRole.PROVIDER),
    isAdmin: (): boolean => rbacUtils.hasRole(UserRole.ADMIN),
    
    isStaff: (): boolean => rbacUtils.hasAnyRole([UserRole.PROVIDER, UserRole.ADMIN]),

    // Get all permissions for current user role
    getRolePermissions: (): Permission[] => {
      return user ? ROLE_PERMISSIONS[user.role] || [] : [];
    },

    // Get permission details
    getPermissionInfo: (permission: Permission) => {
      const permissionMap: Record<Permission, { name: string; description: string; category: string }> = {
        [PERMISSIONS.PATIENT_READ_OWN_DATA]: {
          name: 'Read Own Data',
          description: 'View personal health information',
          category: 'Patient',
        },
        [PERMISSIONS.PATIENT_UPDATE_OWN_PROFILE]: {
          name: 'Update Profile',
          description: 'Edit personal profile information',
          category: 'Patient',
        },
        [PERMISSIONS.PATIENT_VIEW_APPOINTMENTS]: {
          name: 'View Appointments',
          description: 'View scheduled appointments',
          category: 'Patient',
        },
        [PERMISSIONS.PATIENT_BOOK_APPOINTMENTS]: {
          name: 'Book Appointments',
          description: 'Schedule new appointments',
          category: 'Patient',
        },
        [PERMISSIONS.PATIENT_VIEW_MEDICAL_RECORDS]: {
          name: 'View Medical Records',
          description: 'Access medical history and records',
          category: 'Patient',
        },
        [PERMISSIONS.PATIENT_VIEW_PRESCRIPTIONS]: {
          name: 'View Prescriptions',
          description: 'View prescribed medications',
          category: 'Patient',
        },
        [PERMISSIONS.PATIENT_SEND_MESSAGES]: {
          name: 'Send Messages',
          description: 'Communicate with healthcare providers',
          category: 'Patient',
        },
        [PERMISSIONS.PROVIDER_VIEW_PATIENTS]: {
          name: 'View Patients',
          description: 'Access patient information',
          category: 'Provider',
        },
        [PERMISSIONS.PROVIDER_UPDATE_PATIENT_RECORDS]: {
          name: 'Update Patient Records',
          description: 'Modify patient medical records',
          category: 'Provider',
        },
        [PERMISSIONS.PROVIDER_MANAGE_APPOINTMENTS]: {
          name: 'Manage Appointments',
          description: 'Schedule and modify appointments',
          category: 'Provider',
        },
        [PERMISSIONS.PROVIDER_PRESCRIBE_MEDICATIONS]: {
          name: 'Prescribe Medications',
          description: 'Create and manage prescriptions',
          category: 'Provider',
        },
        [PERMISSIONS.PROVIDER_VIEW_ANALYTICS]: {
          name: 'View Analytics',
          description: 'Access practice analytics and reports',
          category: 'Provider',
        },
        [PERMISSIONS.ADMIN_MANAGE_USERS]: {
          name: 'Manage Users',
          description: 'Create, edit, and delete user accounts',
          category: 'Admin',
        },
        [PERMISSIONS.ADMIN_MANAGE_PROVIDERS]: {
          name: 'Manage Providers',
          description: 'Manage healthcare provider accounts',
          category: 'Admin',
        },
        [PERMISSIONS.ADMIN_VIEW_SYSTEM_LOGS]: {
          name: 'View System Logs',
          description: 'Access system audit logs',
          category: 'Admin',
        },
        [PERMISSIONS.ADMIN_MANAGE_SETTINGS]: {
          name: 'Manage Settings',
          description: 'Configure system settings',
          category: 'Admin',
        },
      };

      return permissionMap[permission] || {
        name: permission,
        description: 'Unknown permission',
        category: 'Unknown',
      };
    },
  }), [user, permissions, hasPermission, hasAnyPermission, hasAllPermissions]);

  return {
    user,
    permissions,
    ...rbacUtils,
  };
}

/**
 * Hook for checking specific permissions
 * More convenient for single permission checks
 */
export function usePermission(permission: Permission) {
  const { can } = useRBAC();
  return can(permission);
}

/**
 * Hook for checking multiple permissions
 */
export function usePermissions(requiredPermissions: Permission[], requireAll = false) {
  const { canAny, canAll } = useRBAC();
  
  const hasPermissions = useMemo(() => {
    return requireAll ? canAll(requiredPermissions) : canAny(requiredPermissions);
  }, [canAny, canAll, requiredPermissions, requireAll]);

  return hasPermissions;
}

/**
 * Hook for checking user role
 */
export function useRole(role: UserRole) {
  const { hasRole } = useRBAC();
  return hasRole(role);
}

/**
 * Hook for checking multiple roles
 */
export function useRoles(roles: UserRole[]) {
  const { hasAnyRole } = useRBAC();
  return hasAnyRole(roles);
}

/**
 * Hook for route access checking
 */
export function useRouteAccess(requiredRoles?: UserRole[], requiredPermissions?: Permission[]) {
  const { canAccessRoute } = useRBAC();
  
  const canAccess = useMemo(() => {
    return canAccessRoute(requiredRoles, requiredPermissions);
  }, [canAccessRoute, requiredRoles, requiredPermissions]);

  return canAccess;
}
