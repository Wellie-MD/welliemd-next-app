import { useAuthStore } from '@/store/useAuthStore';
import { ROLE_PERMISSIONS } from '@/constants/rolePermissions';
import { Permission } from '@/constants/permissions';

/**
 * Hook for checking user permissions based on their role
 */
export function usePermissions() {
    const user = useAuthStore((state) => state.user);

    /**
     * Check if user has a specific permission
     */
    const hasPermission = (permission: Permission | string): boolean => {
        if (!user?.primary_role) return false;

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
        return user?.primary_role === roleName;
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        userRole: user?.primary_role || null,
    };
}
