import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { Connection } from '../types';

const MAX_ATTEMPTS = 30;
const POLL_DELAY_MS = 1500;

interface UseOAuthConnectionPollingOptions {
  connections: Connection[];
  refreshConnectionStatus: () => Promise<Connection[] | null>;
  onConnected: () => void | Promise<void>;
  setConnectionSyncError: (message: string) => void;
}

export function useOAuthConnectionPolling({
  connections,
  refreshConnectionStatus,
  onConnected,
  setConnectionSyncError,
}: UseOAuthConnectionPollingOptions) {
  const [searchParams, setSearchParams] = useSearchParams();
  const provider = searchParams.get('wearable_connect') === 'pending'
    ? searchParams.get('provider')
    : null;
  const pendingProvidersKey = connections
    .filter((connection) => connection.status === 'pending')
    .map((connection) => connection.provider)
    .sort()
    .join(',');
  const providerKey = Array.from(new Set([
    ...pendingProvidersKey.split(',').filter(Boolean),
    ...(provider ? [provider] : []),
  ])).sort().join(',');

  useEffect(() => {
    if (!providerKey) return;

    const providers = providerKey.split(',');

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const clearCallbackParams = () => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('wearable_connect');
        next.delete('provider');
        return next;
      }, { replace: true });
    };

    const reconcile = async () => {
      const syncedConnections = await refreshConnectionStatus();
      if (cancelled) return;

      const trackedConnections = syncedConnections?.filter((item) => providers.includes(item.provider)) ?? [];
      const hasPendingConnection = trackedConnections.length === 0
        || trackedConnections.some((connection) => connection.status === 'pending');

      if (hasPendingConnection && attempt < MAX_ATTEMPTS - 1) {
        attempt += 1;
        setConnectionSyncError(`Checking connection status... (Attempt ${attempt}/${MAX_ATTEMPTS})`);
        timeout = setTimeout(reconcile, POLL_DELAY_MS);
        return;
      }

      if (trackedConnections.some((connection) => connection.status === 'connected')) {
        toast.success('Device successfully connected. Your health data is being synced...', {
          duration: 5000,
        });
        void onConnected();
      }

      if (provider) {
        clearCallbackParams();
      }
      setConnectionSyncError('');
    };

    void reconcile();

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [onConnected, provider, providerKey, refreshConnectionStatus, setConnectionSyncError, setSearchParams]);
}
