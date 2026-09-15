import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DevicesPage from './DevicesPage';
import * as deviceApi from './api';

vi.mock('./components/ConnectState', () => ({ default: () => <div>connect state</div> }));
vi.mock('./components/TelemetryDashboard', () => ({ default: () => <div>telemetry</div> }));
vi.mock('./components/DataPrivacyCard', () => ({ default: () => <div>privacy</div> }));
vi.mock('./components/DeviceModals', () => ({ default: () => null }));
vi.mock('./components/ConnectedState', () => ({
  default: ({ connections }: { connections: Array<{ provider: string; status?: string }> }) => (
    <div>{connections.map((connection) => `${connection.provider}:${connection.status}`).join(',')}</div>
  ),
}));
vi.mock('../profile/hooks/use-profile', () => ({
  useProfile: () => ({ patientProfile: { id: 'patient-1' }, updatePatientProfile: vi.fn() }),
}));
vi.mock('../profile/services/profile.service', () => ({
  profileService: { getPatientProfile: vi.fn() },
}));
vi.mock('./api', () => ({
  getConnections: vi.fn(),
  getDeviceData: vi.fn(),
  createLinkSession: vi.fn(),
  listWearableProviders: vi.fn(),
  deregisterProvider: vi.fn(),
  reconnectProvider: vi.fn(),
  syncConnections: vi.fn(),
  formatConnection: (connection: any) => ({
    id: connection.id,
    provider: connection.provider,
    name: connection.provider,
    lastSync: 'never',
    status: connection.status,
  }),
  getConsent: vi.fn(),
  updateConsent: vi.fn(),
  deleteHealthData: vi.fn(),
  getVitalsHistory: vi.fn(),
  logWeight: vi.fn(),
  getHealthGoal: vi.fn(),
  saveHealthGoal: vi.fn(),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }));

function Location() {
  return <output data-testid="location">{useLocation().search}</output>;
}

describe('DevicesPage OAuth return', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(deviceApi.getConnections).mockResolvedValue([
      { id: 'connection-1', provider: 'google_fit', status: 'pending', last_sync_at: null },
    ]);
    vi.mocked(deviceApi.syncConnections).mockResolvedValue([
      { id: 'connection-1', provider: 'google_fit', status: 'connected', last_sync_at: null },
    ]);
    vi.mocked(deviceApi.getDeviceData).mockResolvedValue({});
    vi.mocked(deviceApi.getVitalsHistory).mockResolvedValue([]);
    vi.mocked(deviceApi.getHealthGoal).mockResolvedValue({ goal: null });
    vi.mocked(deviceApi.getConsent).mockResolvedValue({ success: true, consent: null });
    vi.mocked(deviceApi.listWearableProviders).mockResolvedValue({ success: true, sources: [] });

    const { profileService } = await import('../profile/services/profile.service');
    vi.mocked(profileService.getPatientProfile).mockResolvedValue({ vitals_source_priority: [] } as any);
  });

  it('loads and displays the connected device after the pending OAuth callback', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/devices?wearable_connect=pending&provider=google_fit']}>
        <DevicesPage />
        <Location />
      </MemoryRouter>,
    );

    await waitFor(() => expect(deviceApi.getConnections).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(deviceApi.syncConnections).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('google_fit:connected')).toBeInTheDocument());
    expect(screen.getByTestId('location')).toHaveTextContent('');
  });

  it('automatically reconciles a pending connection without callback parameters', async () => {
    vi.mocked(deviceApi.syncConnections).mockResolvedValue([
      { id: 'connection-1', provider: 'google_fit', status: 'error', last_sync_at: null },
    ]);

    render(
      <MemoryRouter initialEntries={['/dashboard/devices']}>
        <DevicesPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(deviceApi.syncConnections).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText('google_fit:error')).toBeInTheDocument());
  });

  it('refreshes and reconciles connections when Browser Back restores the page', async () => {
    vi.mocked(deviceApi.getConnections)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'connection-1', provider: 'google_fit', status: 'pending', last_sync_at: null },
      ]);
    vi.mocked(deviceApi.syncConnections).mockResolvedValue([
      { id: 'connection-1', provider: 'google_fit', status: 'error', last_sync_at: null },
    ]);

    render(
      <MemoryRouter initialEntries={['/dashboard/devices']}>
        <DevicesPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(deviceApi.getConnections).toHaveBeenCalledTimes(1));
    await act(async () => {
      window.dispatchEvent(new Event('pageshow'));
    });

    await waitFor(() => expect(deviceApi.getConnections).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText('google_fit:error')).toBeInTheDocument());
  });
});
