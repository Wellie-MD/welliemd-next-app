import api from '../api/axiosInstance';

export interface UpdateProfileData {
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
}

export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
}

export const userService = {
    /**
     * Get current user's profile
     */
    getProfile: async (): Promise<User> => {
        try {
            // Use /auth/me/ (same as authService) — canonical profile for the JWT user.
            const response = await api.get<User>('/auth/me/');
            return response.data;
        } catch (error: any) {
            console.error('Failed to fetch user profile:', error);
            throw new Error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                'Failed to fetch user profile'
            );
        }
    },

    /**
     * Update current user's profile
     */
    updateProfile: async (data: UpdateProfileData): Promise<User> => {
        try {
            const response = await api.patch<User>('/auth/me/', data);
            return response.data;
        } catch (error: any) {
            console.error('Failed to update user profile:', error);
            throw new Error(
                error.response?.data?.detail ||
                error.response?.data?.message ||
                'Failed to update user profile'
            );
        }
    },
};
