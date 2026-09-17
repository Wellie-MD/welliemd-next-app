/**
 * Junction Labs Read-Only Status API
 *
 * Junction credentials are managed by WellieMD (control plane). The client
 * portal is read-only: it can only view connection status, never edit keys,
 * team id, environment, or lab-account linkage.
 */

import axiosInstance from './axiosInstance';

export interface JunctionTenantStatus {
    enabled: boolean;
    environment: 'sandbox' | 'production';
    team_id: string;
    status: 'connected' | 'disconnected';
    validation_status: 'not_validated' | 'valid' | 'invalid';
    last_synced_at: string | null;
    last_sync_status: string;
    last_event_at: string | null;
    webhook: { configured: boolean; url: string };
    lab_accounts: { linked_count: number };
    wearables: { enabled: boolean; status: string };
}

export const junctionSettingsApi = {
    /**
     * Get read-only Junction integration status for this tenant.
     * GET /api/v1/integrations/junction/status/
     */
    getStatus: async (): Promise<JunctionTenantStatus> => {
        const response = await axiosInstance.get<JunctionTenantStatus>(
            '/integrations/junction/status/'
        );
        return response.data;
    },
};

export default junctionSettingsApi;
