import { useAuthStore } from '@/store/useAuthStore';
import { ROLE_PERMISSIONS } from '@/constants/rolePermissions';
import { Permission } from '@/constants/permissions';

/**
 * Hook for checking user permissions based on their role or backend-provided grants.
 */
export function usePermissions() {
    const user = useAuthStore((state) => state.user);

    const isFullAccessSuperAdmin =
        user?.is_superadmin_access === true &&
        user?.superadmin_access?.portal_type === 'client' &&
        user?.superadmin_access?.access_mode === 'full';

    /**
     * Check if user has a specific permission
     */
    const hasPermission = (permission: Permission | string): boolean => {
        if (!user) return false;

        if (isFullAccessSuperAdmin) return true;

        if (user.permissions?.includes(permission)) return true;

        if (!user.primary_role) return false;

        const rolePermissions = ROLE_PERMISSIONS[user.primary_role] || [];
        return rolePermissions.includes(permission);
    };

    /**
     * Check if user has ANY of the provided permissions
     */
    const hasAnyPermission = (permissions: (Permission | string)[]): boolean => {
        return permissions.some(p => hasPermission(p));
    };

    /**
     * Check if user has ALL of the provided permissions
     */
    const hasAllPermissions = (permissions: (Permission | string)[]): boolean => {
        return permissions.every(p => hasPermission(p));
    };

    /**
     * Check if user has a specific role
     */
    const hasRole = (roleName: string): boolean => {
        return user?.primary_role === roleName || user?.roles?.includes(roleName) === true;
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        userRole: user?.primary_role || null,
        isFullAccessSuperAdmin,
    };
}
