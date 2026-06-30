import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { tokenManager } from '@/features/auth/services/token-manager';
import { setActiveSuperAdminSession } from '@/shared/api/superadmin-session';

const SuperAdminAccessLaunch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const exchangeStartedRef = useRef(false);

  useEffect(() => {
    if (exchangeStartedRef.current) return;
    exchangeStartedRef.current = true;

    const waitForInFlightExchange = async (handoffKey: string) => {
      for (let attempt = 0; attempt < 40; attempt += 1) {
        if (window.sessionStorage.getItem(handoffKey) === 'completed') {
          return true;
        }
        await new Promise(resolve => window.setTimeout(resolve, 100));
      }
      return false;
    };

    const exchange = async () => {
      const handoffCode = searchParams.get('handoff_code');
      if (!handoffCode) {
        setError('Missing access handoff code.');
        return;
      }
      const handoffKey = `superadmin-handoff:${handoffCode.length}:${handoffCode.slice(-8)}`;

      try {
        const handoffState = window.sessionStorage.getItem(handoffKey);
        if (handoffState === 'completed') {
          navigate('/dashboard', { replace: true });
          return;
        }
        if (handoffState === 'in-flight' && await waitForInFlightExchange(handoffKey)) {
          navigate('/dashboard', { replace: true });
          return;
        }
        window.sessionStorage.setItem(handoffKey, 'in-flight');

        const exchangeApiUrl = searchParams.get('exchange_api_url');
        const normalizedExchangeApiUrl = exchangeApiUrl?.replace(/\/+$/, '') || '';
        const exchangePath = '/superadmin-access/handoff/exchange/';
        const exchangeUrl = normalizedExchangeApiUrl
          ? `${normalizedExchangeApiUrl}${exchangePath}`
          : exchangePath;

        await apiClient.post(exchangeUrl, { handoff_code: handoffCode }, { skipAuth: true });
        if (normalizedExchangeApiUrl) {
          tokenManager.clearTokens();
          setActiveSuperAdminSession({
            apiBaseUrl: normalizedExchangeApiUrl,
          });
          useAuthStore.getState().setSuperAdminSession(normalizedExchangeApiUrl);
          await useAuthStore.getState().refreshProfile();
        }
        window.sessionStorage.setItem(handoffKey, 'completed');
        window.history.replaceState({}, document.title, '/superadmin-access/launch');
        navigate('/dashboard', { replace: true });
      } catch {
        window.sessionStorage.removeItem(handoffKey);
        setError('This Super Admin access link is invalid or expired.');
      }
    };

    void exchange();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="space-y-4 text-center">
        {error ? (
          <>
            <h1 className="text-2xl font-semibold">Access link expired</h1>
            <p className="text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            <LoadingSkeleton className="w-16 h-16 rounded-full mx-auto" />
            <p className="text-muted-foreground">Opening Super Admin read-only access...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default SuperAdminAccessLaunch;
