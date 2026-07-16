/**
 * Devices API service — Junction Wearables integration.
 *
 * SECURITY: The Junction API key is a server secret. The browser only talks
 * to YOUR backend; the backend holds the key and calls Junction.
 */
import { apiClient } from '@/shared/api/client';
import { DEVICE_ENDPOINTS } from './constants';
import type { ConnectionResponse, DeviceDataResponse, HealthGoalResponse, LinkSessionResponse, VitalsEntry } from './types';

/**
 * Fetch the permitted wearable providers for the patient client context.
 */
export async function listWearableProviders(): Promise<{ success: boolean; sources: any[] }> {
  const response = await apiClient.get<{ success: boolean; sources: any[] }>(
    DEVICE_ENDPOINTS.providers
  );
  return response.data;
}

/**
 * Create a Link Token so the patient can authorize a device connection.
 */
export async function createLinkSession(provider: string, patientId: string): Promise<LinkSessionResponse> {
  const response = await apiClient.post<{ success: boolean; demo?: boolean; session: any }>(
    DEVICE_ENDPOINTS.oauthSession,
    { patient_id: patientId, provider }
  );
  return {
    authorization_url: response.data.session.oauth_url || null,
    expires_at: response.data.session.expires_at || null,
    demo: !!response.data.demo,
  };
}

/**
 * Get the patient's active device connections.
 */
export async function getConnections(): Promise<ConnectionResponse[]> {
  const response = await apiClient.get<{ success: boolean; connections: any[] }>(
    DEVICE_ENDPOINTS.connections
  );
  const allConns = Array.isArray(response.data.connections) ? response.data.connections : [];
  return allConns.filter(c => c.status === 'connected' || c.status === 'error');
}

/**
 * Get aggregated device data (weight, steps, sleep, etc.).
 */
export async function getDeviceData(): Promise<DeviceDataResponse> {
  const response = await apiClient.get<DeviceDataResponse>(DEVICE_ENDPOINTS.deviceData);
  return response.data;
}

/**
 * Get the patient's persisted weight/height/BMI history — the single source
 * of truth for the dashboard graph (questionnaire baseline + manual + wearable).
 */
export async function getVitalsHistory(days = 90): Promise<VitalsEntry[]> {
  const response = await apiClient.get<{ results?: VitalsEntry[] } | VitalsEntry[]>(
    `${DEVICE_ENDPOINTS.vitals}?days=${days}`
  );
  const data = response.data as any;
  return Array.isArray(data) ? data : data?.results ?? [];
}

/**
 * Manually log a weight entry from the dashboard. Height/BMI are resolved
 * and computed server-side.
 */
export async function logWeight(weightLbs: number): Promise<VitalsEntry> {
  const response = await apiClient.post<VitalsEntry>(DEVICE_ENDPOINTS.vitals, {
    weight_lbs: weightLbs,
  });
  return response.data;
}

/**
 * Deregister (disconnect) a provider connection.
 */
export async function deregisterProvider(connectionId: string): Promise<{ ok: boolean }> {
  const response = await apiClient.post<{ success: boolean }>(
    DEVICE_ENDPOINTS.disconnect(connectionId)
  );
  return { ok: response.data.success };
}

/**
 * Reconnect a connection.
 */
export async function reconnectProvider(connectionId: string): Promise<{ success: boolean; demo?: boolean; session: any }> {
  const response = await apiClient.post<{ success: boolean; session: any }>(
    DEVICE_ENDPOINTS.reconnect(connectionId)
  );
  return response.data;
}

/**
 * Get the patient's consent status.
 */
export async function getConsent(): Promise<{ success: boolean; consent: any }> {
  const response = await apiClient.get<{ success: boolean; consent: any }>(
    DEVICE_ENDPOINTS.consent
  );
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
    DEVICE_ENDPOINTS.consent,
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
    DEVICE_ENDPOINTS.deleteHealthData,
    payload
  );
  return response.data;
}

export async function getHealthGoal(): Promise<HealthGoalResponse> {
  const response = await apiClient.get<HealthGoalResponse>(DEVICE_ENDPOINTS.healthGoal);
  return response.data;
}

export async function saveHealthGoal(targetBmi: number): Promise<HealthGoalResponse> {
  const response = await apiClient.put<HealthGoalResponse>(DEVICE_ENDPOINTS.healthGoal, {
    target_bmi: targetBmi,
  });
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
    ...(c.last_error ? { errorType: c.last_error } : {}),
  };
}
