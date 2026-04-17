import api from '../api/axiosInstance';

export interface PortalUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    is_active: boolean;
    created_at: string;
    roles: string[];           // From backend enrichment
    primary_role?: string;     // From backend enrichment
    // Invitation system fields (replaces password)
    invitation_status?: 'pending' | 'active' | 'expired';
    invitation_link?: string;  // Only for pending users
    invitation_expires_at?: string;  // ISO datetime string
}

export const getDisplayRole = (user: PortalUser): string => {
    if (Array.isArray(user.roles) && user.roles.includes('Super Admin')) {
        return 'Super Admin';
    }
    return user.primary_role || 'No Role';
};

export interface Role {
    id: string;
    name: string;
    description: string;
}

export interface InviteUserRequest {
    email: string;
    role_id: string;
    first_name?: string;
    last_name?: string;
}

export interface AssignRoleRequest {
    role_id: string;
}

const DEFAULT_ROLE_DESCRIPTIONS: Record<string, string> = {
    Admin: 'Full administrative access to manage users, settings, and operational workflows.',
    'Customer Service': 'Can manage conversations and operational support workflows without full admin controls.',
};

const withRoleDescriptionFallback = (role: Role): Role => ({
    ...role,
    description: (role.description || '').trim() || DEFAULT_ROLE_DESCRIPTIONS[role.name] || 'Standard access for this role.',
});

export const userManagementService = {
    /**
     * List all portal users with their roles
     */
    listUsers: async (): Promise<PortalUser[]> => {
        const { data } = await api.get('/portal-users/');
        return data;
    },

    /**
     * Get available roles for assignment
     */
    getAvailableRoles: async (): Promise<Role[]> => {
        const { data } = await api.get('/portal-users/available_roles/');
        return Array.isArray(data) ? data.map(withRoleDescriptionFallback) : [];
    },

    /**
     * Invite a new user to the portal
     */
    inviteUser: async (request: InviteUserRequest): Promise<unknown> => {
        const { data } = await api.post('/invite/', request);
        return data;
    },

    /**
     * Assign role to existing user
     */
    assignRole: async (userId: string, request: AssignRoleRequest): Promise<void> => {
        await api.post(`/portal-users/${userId}/assign_role/`, request);
    },

    /**
     * Deactivate user (soft delete)
     */
    deactivateUser: async (userId: string): Promise<void> => {
        await api.delete(`/portal-users/${userId}/`);
    },
};
