/**
 * Beluga Settings API Service
 * 
 * API client for managing Beluga integration settings
 */

import axiosInstance from './axiosInstance';

export interface BelugaSettings {
    beluga_company: string;
    beluga_environment: 'staging' | 'production';
}

export interface BelugaSettingsUpdatePayload {
    beluga_environment: 'staging' | 'production';
}

const BASE_URL = '/beluga-settings';

export const belugaSettingsApi = {
    /**
     * Get current client's Beluga settings
     * GET /api/v1/beluga-settings/current/
     */
    getCurrent: async (): Promise<BelugaSettings> => {
        const response = await axiosInstance.get<BelugaSettings>(`${BASE_URL}/current/`);
        return response.data;
    },

    /**
     * Update Beluga environment setting
     * PATCH /api/v1/beluga-settings/current/
     */
    updateEnvironment: async (data: BelugaSettingsUpdatePayload): Promise<BelugaSettings> => {
        const response = await axiosInstance.patch<BelugaSettings>(`${BASE_URL}/current/`, data);
        return response.data;
    },
};

export default belugaSettingsApi;
