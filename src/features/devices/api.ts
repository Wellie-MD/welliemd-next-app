/**
 * Devices API service — Junction Wearables integration.
 *
 * SECURITY: The Junction API key is a server secret. The browser only talks
 * to YOUR backend; the backend holds the key and calls Junction.
 *
 * In demo mode (JUNCTION.backend === null), all operations run locally
 * so the UI works without a backend.
 */
import { apiClient } from '@/shared/api/client';
import { JUNCTION } from './constants';
import type { ConnectionResponse, DeviceDataResponse, LinkTokenResponse } from './types';

/**
 * Create a Link Token so the patient can authorize a device connection.
 */
export async function getLinkToken(provider: string): Promise<LinkTokenResponse> {
  const response = await apiClient.post<LinkTokenResponse>(
    '/junction/link-token/',
    { userId: JUNCTION.userId, provider }
  );
  return response.data;
}

/**
 * Get the patient's active device connections.
 */
export async function getConnections(): Promise<ConnectionResponse[]> {
  const response = await apiClient.get<ConnectionResponse[]>(
    `/junction/connections/?userId=${encodeURIComponent(JUNCTION.userId)}`
  );
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get aggregated device data (weight, steps, sleep, etc.).
 */
export async function getDeviceData(): Promise<DeviceDataResponse> {
  const response = await apiClient.get<DeviceDataResponse>(
    `/junction/device-data/?userId=${encodeURIComponent(JUNCTION.userId)}`
  );
  return response.data || {};
}

/**
 * Deregister (disconnect) a provider.
 */
export async function deregisterProvider(provider: string): Promise<{ ok: boolean }> {
  const response = await apiClient.post<{ ok: boolean }>(
    '/junction/deregister/',
    { userId: JUNCTION.userId, provider }
  );
  return response.data;
}

/**
 * Helper: format a connection response from the server into a local connection object.
 */
export function formatConnection(c: ConnectionResponse): {
  provider: string;
  name: string;
  lastSync: string;
  status?: 'error' | undefined;
  errorType?: string | undefined;
} {
  return {
    provider: c.provider,
    name: c.name,
    lastSync: c.lastSync,
    status: c.status === 'error' ? 'error' as const : undefined,
    errorType: c.error_type || c.errorType,
  };
}
