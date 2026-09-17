import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import type { Connection } from '../types';
import { useOAuthConnectionPolling } from './useOAuthConnectionPolling';

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}));

const connected: Connection[] = [{
  id: 'connection-1',
  provider: 'google_fit',
  name: 'Google Fit',
  lastSync: 'never',
  status: 'connected',
}];

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter initialEntries={['/dashboard/devices?wearable_connect=pending&provider=google_fit']}>{children}</MemoryRouter>;
}

describe('useOAuthConnectionPolling', () => {
  it('reconciles the callback provider, refreshes device data, and removes callback parameters', async () => {
    const refreshConnectionStatus = vi.fn().mockResolvedValue(connected);
    const onConnected = vi.fn().mockResolvedValue(undefined);
    const setConnectionSyncError = vi.fn();

    const { result } = renderHook(
      () => ({
        polling: useOAuthConnectionPolling({
          connections: [],
          refreshConnectionStatus,
          onConnected,
          setConnectionSyncError,
        }),
        location: useLocation(),
      }),
      { wrapper },
    );

    await waitFor(() => expect(refreshConnectionStatus).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onConnected).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.location.search).toBe(''));
    expect(toast.success).toHaveBeenCalledWith(
      'Device successfully connected. Your health data is being synced...',
      { duration: 5000 },
    );
  });
});
