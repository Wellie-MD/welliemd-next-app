/**
 * Devices API service — Junction Wearables integration.
 *
 * SECURITY: The Junction API key is a server secret. The browser only talks
 * to YOUR backend; the backend holds the key and calls Junction.
 */
import { apiClient } from '@/shared/api/client';
import type { ConnectionResponse, DeviceDataResponse, LinkTokenResponse } from './types';

/**
 * Fetch the permitted wearable providers for the patient client context.
 */
export async function listWearableProviders(): Promise<{ success: boolean; sources: any[] }> {
  const response = await apiClient.get<{ success: boolean; sources: any[] }>(
    '/wearables/providers/?client_view=true'
  );
    console.log("PROVIDERS", response.data.sources)
  return response.data;
}

/**
 * Create a Link Token so the patient can authorize a device connection.
 */
export async function getLinkToken(provider: string, patientId: string): Promise<LinkTokenResponse> {
  const response = await apiClient.post<{ success: boolean; demo?: boolean; session: any }>(
    '/wearables/oauth-session/',
    { patient_id: patientId, provider }
  );
  return {
    link_token: response.data.session.oauth_url || null,
    expires_at: response.data.session.expires_at || null,
    demo: !!response.data.demo,
  };
}

/**
 * Get the patient's active device connections.
 */
export async function getConnections(): Promise<ConnectionResponse[]> {
  const response = await apiClient.get<{ success: boolean; connections: any[] }>(
    '/wearables/connections/'
  );
  const allConns = Array.isArray(response.data.connections) ? response.data.connections : [];
  return allConns.filter(c => c.status === 'connected' || c.status === 'error');
}

/**
 * Get aggregated device data (weight, steps, sleep, etc.).
 */
export async function getDeviceData(): Promise<DeviceDataResponse> {
  try {
    const response = await apiClient.get<DeviceDataResponse>('/wearables/device-data/');
    return response.data;
  } catch (err) {
    console.error('Failed to fetch device data:', err);
    return {};
  }
}

/**
 * Deregister (disconnect) a provider connection.
 */
export async function deregisterProvider(connectionId: string): Promise<{ ok: boolean }> {
  const response = await apiClient.post<{ success: boolean }>(
    `/wearables/connections/${connectionId}/disconnect/`
  );
  return { ok: response.data.success };
}

/**
 * Reconnect a connection.
 */
export async function reconnectProvider(connectionId: string): Promise<{ success: boolean; demo?: boolean; session: any }> {
  const response = await apiClient.post<{ success: boolean; session: any }>(
    `/wearables/connections/${connectionId}/reconnect/`
  );
  return response.data;
}

/**
 * Get the patient's consent status.
 */
export async function getConsent(): Promise<{ success: boolean; consent: any }> {
  const response = await apiClient.get<{ success: boolean; consent: any }>(
    '/wearables/consent/'
  );
  console.log("CONSENT", response)
  return response.data;
}

/**
 * Update the patient's consent status.
 */
export async function updateConsent(consentGranted: boolean, patientId?: string): Promise<{ success: boolean; consent: any }> {
  const payload: any = { consent_granted: consentGranted };
  if (patientId) {
    payload.patient_id = patientId;
  }
  const response = await apiClient.post<{ success: boolean; consent: any }>(
    '/wearables/consent/',
    payload
  );
  return response.data;
}

/**
 * Delete patient's health data.
 */
export async function deleteHealthData(confirm: boolean, patientId?: string, reason?: string): Promise<{ success: boolean; result: any }> {
  const payload: any = { confirm, reason };
  if (patientId) {
    payload.patient_id = patientId;
  }
  const response = await apiClient.post<{ success: boolean; result: any }>(
    '/wearables/delete-health-data/',
    payload
  );
  return response.data;
}

/**
 * Helper: format a connection response from the server into a local connection object.
 */
export function formatConnection(c: ConnectionResponse): {
  id: string;
  provider: string;
  name: string;
  lastSync: string;
  status?: 'error' | 'pending' | 'connected' | 'disconnected';
  errorType?: string;
} {
  const formattedSync = c.last_sync_at
    ? new Date(c.last_sync_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'never';

  return {
    id: c.id,
    provider: c.provider,
    name: c.provider.charAt(0).toUpperCase() + c.provider.slice(1),
    lastSync: formattedSync,
    status: c.status as any,
    errorType: c.last_error || undefined,
  };
}
