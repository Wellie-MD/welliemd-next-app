/**
 * Junction Labs Settings API Service
 * 
 * API client for managing per-tenant Junction Labs integration configuration.
 */

import axiosInstance from './axiosInstance';

export interface JunctionTenantConfig {
    id: string;
    enabled: boolean;
    environment: 'sandbox' | 'production';
    region: 'us' | 'eu';
    base_url: string;
    team_id: string;
    api_key_display: string;
    webhook_secret_display: string;
    has_api_key: boolean;
    has_webhook_secret: boolean;
    webhook_url: string;
    last_validated_at: string | null;
    validation_status: 'not_validated' | 'valid' | 'invalid';
    validation_error: string;
    created_at: string;
    updated_at: string;
}

export interface JunctionTenantConfigUpdatePayload {
    enabled?: boolean;
    environment?: 'sandbox' | 'production';
    region?: 'us' | 'eu';
    base_url?: string;
    team_id?: string;
    api_key?: string;
    webhook_secret?: string;
}

export interface ValidationResponse {
    valid: boolean;
    message: string;
    catalog_count?: number;
    error?: string;
}

const BASE_URL = '/integrations/junction/config';

export const junctionSettingsApi = {
    /**
     * Get current Junction tenant configuration
     * GET /api/v1/integrations/junction/config/
     */
    getConfig: async (): Promise<JunctionTenantConfig> => {
        const response = await axiosInstance.get<JunctionTenantConfig>(`${BASE_URL}/`);
        return response.data;
    },

    /**
     * Update current Junction tenant configuration
     * PATCH /api/v1/integrations/junction/config/
     */
    updateConfig: async (data: JunctionTenantConfigUpdatePayload): Promise<JunctionTenantConfig> => {
        const response = await axiosInstance.patch<JunctionTenantConfig>(`${BASE_URL}/`, data);
        return response.data;
    },

    /**
     * Validate current Junction connection credentials
     * POST /api/v1/integrations/junction/config/validate/
     */
    validateConnection: async (): Promise<ValidationResponse> => {
        const response = await axiosInstance.post<ValidationResponse>(`${BASE_URL}/validate/`);
        return response.data;
    },
};

export default junctionSettingsApi;
