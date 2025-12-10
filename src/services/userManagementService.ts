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
        return data;
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
