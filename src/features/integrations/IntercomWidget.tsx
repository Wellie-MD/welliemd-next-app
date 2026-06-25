import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import axiosInstance from '../../api/axiosInstance';

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

// ── Module-level Intercom manager ──────────────────────────────────
// Lives outside React so it is immune to StrictMode double-mount/unmount.
let intercomBooted = false;
let storeUnsubscribe: (() => void) | null = null;
let jwtRefreshTimer: ReturnType<typeof setInterval> | null = null;

// Re-mint the short-lived identity JWT well within the 24h messenger session.
const JWT_REFRESH_INTERVAL_MS = 43200000; // 12 hours

function bootIntercomFromPayload(payload: IntercomPayload) {
  const doBoot = () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    window.Intercom?.('boot', {
      app_id: payload.intercom_app_id,
      intercom_user_jwt: payload.intercom_user_jwt,
      session_duration: payload.session_duration,
      ...payload.attributes,
    });
    intercomBooted = true;
    startJwtRefresh();
    scheduleBannerCleanup();
  };

  const existingScript = document.getElementById('intercom-script');
  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'intercom-script';
    script.src = `https://widget.intercom.io/widget/${payload.intercom_app_id}`;
    script.async = true;
    script.onload = doBoot;
    document.body.appendChild(script);
  } else if (window.Intercom) {
    doBoot();
  } else {
    existingScript.addEventListener('load', doBoot, { once: true });
  }
}

function startJwtRefresh() {
  stopJwtRefresh();
  jwtRefreshTimer = setInterval(() => {
    if (!useAuthStore.getState().isAuthenticated) {
      stopJwtRefresh();
      return;
    }
    axiosInstance.post<IntercomPayload>('/auth/intercom-identity-token/')
      .then((response) => {
        if (!useAuthStore.getState().isAuthenticated) return;
        window.Intercom?.('boot', {
          app_id: response.data.intercom_app_id,
          intercom_user_jwt: response.data.intercom_user_jwt,
          session_duration: response.data.session_duration,
          ...response.data.attributes,
        });
        scheduleBannerCleanup();
      })
      .catch(() => {
        // Silently fail — next refresh will retry
      });
  }, JWT_REFRESH_INTERVAL_MS);
}

function stopJwtRefresh() {
  if (jwtRefreshTimer !== null) {
    clearInterval(jwtRefreshTimer);
    jwtRefreshTimer = null;
  }
}

/** Reset body-level styles Intercom may have added for its inline banner. */
function scheduleBannerCleanup() {
  setTimeout(() => {
    document.body.style.marginTop = '';
    document.body.style.paddingTop = '';
  }, 500);
}

export function shutdownIntercom() {
  intercomBooted = false;
  stopJwtRefresh();
  try {
    window.Intercom?.('shutdown');
  } catch (error) {
    console.error('Intercom shutdown error:', error);
  }

  const scriptEl = document.getElementById('intercom-script');
  if (scriptEl) {
    scriptEl.remove();
  }

  try {
    delete window.Intercom;
    delete window.intercomSettings;
  } catch {
    (window as any).Intercom = undefined;
    (window as any).intercomSettings = undefined;
  }

  document.querySelectorAll(
    '.intercom-lightweight-app, .intercom-namespace, ' +
    'iframe.intercom-launcher-frame, iframe.intercom-launcher-badge-frame, ' +
    '#intercom-container, #intercom-frame'
  ).forEach((el) => el.remove());
}

function ensureIntercom(setShowFallback?: (v: boolean) => void) {
  if (intercomBooted) return;
  if (!useAuthStore.getState().isAuthenticated) return;

  axiosInstance.post<IntercomPayload>('/auth/intercom-identity-token/')
    .then((response) => {
      if (!useAuthStore.getState().isAuthenticated) return;
      bootIntercomFromPayload(response.data);
    })
    .catch((error: any) => {
      console.error('Failed to initialize Intercom widget:', error);
      if (setShowFallback && error.response?.status !== 404) {
        setShowFallback(true);
      }
    });
}

function ensureStoreListener() {
  if (storeUnsubscribe) return;
  storeUnsubscribe = useAuthStore.subscribe((state) => {
    if (!state.isAuthenticated && intercomBooted) {
      shutdownIntercom();
    } else if (state.isAuthenticated && !intercomBooted) {
      ensureIntercom();
    }
  });
}

export const IntercomWidget = () => {
  const location = useLocation();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    ensureStoreListener();
    ensureIntercom(setShowFallback);

    return () => {
      stopJwtRefresh();
    };
  }, []);

  useEffect(() => {
    if (intercomBooted && useAuthStore.getState().isAuthenticated) {
      window.Intercom?.('update');
    }
  }, [location.pathname]);

  if (showFallback) {
    return (
      <div id="an-post" style={{
        position: 'fixed',
        left: '24px',
        bottom: '24px',
        width: '322px',
        maxWidth: 'calc(100vw - 48px)',
        background: 'hsl(var(--card, 0 0% 100%))',
        border: '1px solid hsl(var(--border, 214.3 31.8% 91.4%))',
        borderRadius: '16px',
        boxShadow: '0 14px 44px rgba(15,23,42,.22)',
        padding: '17px 18px 18px',
        zIndex: 8900,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '11px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'hsl(var(--primary, 199 95% 74%))', color: '#fff',
              display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 700,
            }}>
              W
            </span>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'hsl(var(--foreground, 222.2 84% 4.9%))' }}>WellieMD</div>
              <div style={{ fontSize: '10.5px', color: 'hsl(var(--muted-foreground, 215.4 16.3% 46.9%))' }}>Service update</div>
            </div>
          </div>
          <button aria-label="Dismiss" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'hsl(var(--muted-foreground, 215.4 16.3% 46.9%))', padding: '4px', flexShrink: 0,
          }} onClick={() => setShowFallback(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <h4 style={{ margin: '0 0 5px', fontSize: '15px', fontWeight: 700, color: 'hsl(var(--foreground, 222.2 84% 4.9%))' }}>
          Live chat unavailable
        </h4>
        <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'hsl(var(--muted-foreground, 215.4 16.3% 46.9%))', lineHeight: 1.5 }}>
          Live chat is currently unavailable. Please use our internal messaging system.
        </p>
        <button style={{
          background: 'hsl(var(--primary, 199 95% 74%))', color: '#fff',
          borderColor: 'hsl(var(--primary, 199 95% 74%))',
          width: '100%', textAlign: 'center', padding: '9px',
          fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 600,
          borderRadius: '8px', cursor: 'pointer', border: '1px solid',
        }}
          onClick={() => { setShowFallback(false); window.location.href = '/dashboard/messages'; }}>
          Go to Messages
        </button>
        <style>{`
          @media (max-width: 560px) {
            #an-post { left: 14px !important; right: 14px !important; width: auto !important; bottom: 14px !important; }
          }
        `}</style>
      </div>
    );
  }

  return null;
};
