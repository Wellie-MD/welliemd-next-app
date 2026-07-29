import { apiClient } from '@/shared/api/client';
import { DEVICE_ENDPOINTS } from './constants';
import type { ConnectionResponse, DeviceDataResponse, HealthGoalResponse, LinkSessionResponse, VitalsEntry } from './types';


export async function listWearableProviders(): Promise<{ success: boolean; sources: any[] }> {
  const response = await apiClient.get<{ success: boolean; sources: any[] }>(
    DEVICE_ENDPOINTS.providers
  );
  return response.data;
}

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

export async function getConnections(): Promise<ConnectionResponse[]> {
  const response = await apiClient.get<{ success: boolean; connections: any[] }>(
    DEVICE_ENDPOINTS.connections
  );
  const allConns = Array.isArray(response.data.connections) ? response.data.connections : [];
  return allConns.filter(c => c.status === 'connected' || c.status === 'error' || c.status === 'pending');
}


export async function syncConnections(): Promise<ConnectionResponse[]> {
  const response = await apiClient.post<{ success: boolean; connections: any[] }>(
    DEVICE_ENDPOINTS.syncConnections
  );
  const allConns = Array.isArray(response.data.connections) ? response.data.connections : [];
  return allConns.filter(c => c.status === 'connected' || c.status === 'error' || c.status === 'pending');
}

export async function getDeviceData(days = 7, skipLiveSync = false): Promise<DeviceDataResponse> {
  const response = await apiClient.get<DeviceDataResponse>(`${DEVICE_ENDPOINTS.deviceData}?days=${days}&skip_live_sync=${skipLiveSync}`);
  return response.data;
}

export async function getVitalsHistory(days = 90): Promise<VitalsEntry[]> {
  const response = await apiClient.get<{ results?: VitalsEntry[] } | VitalsEntry[]>(
    `${DEVICE_ENDPOINTS.vitals}?days=${days}`
  );
  const data = response.data as any;
  return Array.isArray(data) ? data : data?.results ?? [];
}

export async function logWeight(weightLbs: number): Promise<VitalsEntry> {
  const response = await apiClient.post<VitalsEntry>(DEVICE_ENDPOINTS.vitals, {
    weight_lbs: weightLbs,
  });
  return response.data;
}

export async function deregisterProvider(connectionId: string): Promise<{ ok: boolean }> {
  const response = await apiClient.post<{ success: boolean }>(
    DEVICE_ENDPOINTS.disconnect(connectionId)
  );
  return { ok: response.data.success };
}


export async function reconnectProvider(connectionId: string): Promise<{ success: boolean; demo?: boolean; session: any }> {
  const response = await apiClient.post<{ success: boolean; session: any }>(
    DEVICE_ENDPOINTS.reconnect(connectionId)
  );
  return response.data;
}


export async function getConsent(): Promise<{ success: boolean; consent: any }> {
  const response = await apiClient.get<{ success: boolean; consent: any }>(
    DEVICE_ENDPOINTS.consent
  );
  return response.data;
}


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

export function formatConnection(c: ConnectionResponse): {
  id: string;
  provider: string;
  name: string;
  lastSync: string;
  status?: 'error' | 'pending' | 'connected' | 'disconnected';
  errorType?: string;
  isBackfilling?: boolean;
} {
  const formattedSync = c.last_sync_at
    ? new Date(c.last_sync_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'never';

  const isStuck = c.is_backfilling && c.updated_at && (Date.now() - new Date(c.updated_at).getTime() > 300000);

  return {
    id: c.id,
    provider: c.provider,
    name: c.provider.charAt(0).toUpperCase() + c.provider.slice(1),
    lastSync: formattedSync,
    status: c.status as any,
    ...(c.last_error ? { errorType: c.last_error } : {}),
    isBackfilling: isStuck ? false : c.is_backfilling,
  };
}
