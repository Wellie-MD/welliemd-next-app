import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../auth/store/auth.store';
import { apiClient } from '@/shared/api/client';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Extend Window to include Intercom types
declare global {
  interface Window {
    Intercom?: (...args: any[]) => void;
    intercomSettings?: any;
  }
}

interface IntercomPayload {
  intercom_user_jwt: string;
  intercom_app_id: string;
  session_duration: number;
  attributes: {
    name: string;
    email: string;
    role: string;
  };
}

/** Reset body-level styles Intercom may have added for its inline banner. */
function scheduleBannerCleanup() {
  setTimeout(() => {
    document.body.style.marginTop = '';
    document.body.style.paddingTop = '';
  }, 500);
}

// Re-mint the identity JWT well within the 24h messenger session. The signed
// JWT itself is short-lived, so a fresh one is fetched periodically and the
// messenger is re-booted with it to keep the verified session alive. Lives at
// module scope (like the client portal) so a single timer survives re-renders.
const JWT_REFRESH_INTERVAL_MS = 43200000; // 12 hours
let jwtRefreshTimer: ReturnType<typeof setInterval> | null = null;

function bootIntercomFromPayload(payload: IntercomPayload) {
  window.Intercom?.('boot', {
    app_id: payload.intercom_app_id,
    intercom_user_jwt: payload.intercom_user_jwt,
    session_duration: payload.session_duration,
    name: payload.attributes.name,
    email: payload.attributes.email,
    role: payload.attributes.role,
  });
  scheduleBannerCleanup();
}

function stopJwtRefresh() {
  if (jwtRefreshTimer !== null) {
    clearInterval(jwtRefreshTimer);
    jwtRefreshTimer = null;
  }
}

function startJwtRefresh() {
  stopJwtRefresh();
  jwtRefreshTimer = setInterval(() => {
    if (!useAuthStore.getState().isAuthenticated) {
      stopJwtRefresh();
      return;
    }
    apiClient
      .post<IntercomPayload>('/auth/intercom-identity-token/')
      .then((response) => {
        if (!useAuthStore.getState().isAuthenticated) return;
        bootIntercomFromPayload(response.data);
      })
      .catch(() => {
        // Silently fail — the next refresh will retry.
      });
  }, JWT_REFRESH_INTERVAL_MS);
}

export const IntercomWidget = () => {
  const location = useLocation();
  const initialized = useRef(false);
  const isMounted = useRef(true);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    isMounted.current = true;
    // Only set up the subscription once
    if (initialized.current) return;
    initialized.current = true;

    const unsubscribe = useAuthStore.subscribe(
      (state) => state.isAuthenticated,
      async (isAuthenticated) => {
        if (isAuthenticated) {
          try {
            // Fetch the Identity Token payload from our Django endpoint
            const response = await apiClient.post<IntercomPayload>('/auth/intercom-identity-token/');
            const payload = response.data;
            
            const bootIntercom = () => {
              if (!isMounted.current || !useAuthStore.getState().isAuthenticated) return;
              bootIntercomFromPayload(payload);
              startJwtRefresh();
            };

            // Inject script if not present
            if (!document.getElementById('intercom-script')) {
              const script = document.createElement('script');
              script.id = 'intercom-script';
              script.src = `https://widget.intercom.io/widget/${payload.intercom_app_id}`;
              script.async = true;
              script.onload = bootIntercom;
              document.body.appendChild(script);
            } else {
              bootIntercom();
            }

            // Ensure fallback banner is hidden if Intercom boots successfully
            setShowFallback(false);

          } catch (error: any) {
            console.error('Failed to initialize Intercom widget:', error);
            // If the feature flag is off (404) or something fails, 
            // show the fallback banner directing users to internal messaging.
            if (error.response?.status !== 404) {
                // If it's 404, we just silently ignore because it means it's disabled.
                // If it's a 500 or network error, we can show a fallback if we wanted, 
                // but the plan says "fallback banner to /dashboard/messages". 
                // Let's show it only if we explicitly wanted it, or maybe show it if it fails.
                setShowFallback(true);
            }
          }
        } else {
          // If logged out, shut down Intercom
          stopJwtRefresh();
          window.Intercom?.('shutdown');
          setShowFallback(false);
        }
      },
      { fireImmediately: true }
    );

    return () => {
      isMounted.current = false;
      stopJwtRefresh();
      unsubscribe();
      window.Intercom?.('shutdown');
    };
  }, []);

  // Update Intercom on route changes
  useEffect(() => {
    if (useAuthStore.getState().isAuthenticated) {
      window.Intercom?.('update');
    }
  }, [location.pathname]);

  if (showFallback) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full shadow-lg animate-in slide-in-from-bottom-5">
        <Alert variant="default" className="border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2">
            <span className="text-sm">Live chat is currently unavailable. Please use our internal messaging system.</span>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowFallback(false)}>
                Dismiss
              </Button>
              <Button variant="default" size="sm" onClick={() => {
                setShowFallback(false);
                window.location.href = '/dashboard/messages';
              }}>
                Go to Messages
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
};
