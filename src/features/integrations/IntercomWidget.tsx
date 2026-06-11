import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import axiosInstance from '../../api/axiosInstance';
import { AlertCircle } from 'lucide-react';

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

// ── Module-level Intercom manager ──────────────────────────────────
// Lives outside React so it is immune to StrictMode double-mount/unmount.
let intercomBooted = false;
let storeUnsubscribe: (() => void) | null = null;

function bootIntercomFromPayload(payload: IntercomPayload) {
  const doBoot = () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    window.Intercom?.('boot', {
      app_id: payload.intercom_app_id,
      intercom_user_jwt: payload.intercom_user_jwt,
      session_duration: payload.session_duration,
      name: payload.attributes.name,
      email: payload.attributes.email,
      role: payload.attributes.role,
    });
    intercomBooted = true;
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

/**
 * Forcefully shuts down Intercom and removes all its DOM artifacts.
 * Exported so it can also be called from authService.logout().
 */
export function shutdownIntercom() {
  intercomBooted = false;
  try {
    window.Intercom?.('shutdown');
  } catch (error) {
    console.error('Intercom shutdown error:', error);
  }

  // Remove the script tag so it is completely re-fetched and re-executed on next login
  const scriptEl = document.getElementById('intercom-script');
  if (scriptEl) {
    scriptEl.remove();
  }

  // Clean up global Intercom variables
  try {
    delete window.Intercom;
    delete window.intercomSettings;
  } catch {
    (window as any).Intercom = undefined;
    (window as any).intercomSettings = undefined;
  }

  // Forcefully remove any residual DOM elements injected by Intercom
  document.querySelectorAll(
    '.intercom-lightweight-app, .intercom-namespace, ' +
    'iframe.intercom-launcher-frame, iframe.intercom-launcher-badge-frame, ' +
    '#intercom-container, #intercom-frame'
  ).forEach((el) => el.remove());
}

function ensureIntercom() {
  if (intercomBooted) return;
  if (!useAuthStore.getState().isAuthenticated) return;

  axiosInstance.post<IntercomPayload>('/auth/intercom-identity-token/')
    .then((response) => {
      if (!useAuthStore.getState().isAuthenticated) return;
      bootIntercomFromPayload(response.data);
    })
    .catch((error) => {
      console.error('Failed to initialize Intercom widget:', error);
    });
}

function ensureStoreListener() {
  if (storeUnsubscribe) return; // already listening
  storeUnsubscribe = useAuthStore.subscribe((state) => {
    if (!state.isAuthenticated && intercomBooted) {
      shutdownIntercom();
    }
  });
}

// ── React component ────────────────────────────────────────────────
export const IntercomWidget = () => {
  const location = useLocation();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    ensureStoreListener();
    ensureIntercom();

    // NO cleanup that shuts down Intercom here.
    // Shutdown is handled by the store listener (on logout) and by
    // shutdownIntercom() called directly from authService.logout().
    // This avoids StrictMode cleanup killing the widget.
  }, []);

  // Update Intercom on route changes (only if authenticated)
  useEffect(() => {
    if (intercomBooted && useAuthStore.getState().isAuthenticated) {
      window.Intercom?.('update');
    }
  }, [location.pathname]);

  if (showFallback) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full shadow-lg rounded-md border border-gray-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-gray-500 mt-0.5" />
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">Live chat is currently unavailable. Please use our internal messaging system.</span>
            <div className="flex justify-end gap-2 mt-2">
              <button 
                className="text-xs px-3 py-1.5 font-medium text-gray-600 hover:text-gray-900 rounded" 
                onClick={() => setShowFallback(false)}
              >
                Dismiss
              </button>
              <button 
                className="text-xs px-3 py-1.5 font-medium bg-blue-600 text-white hover:bg-blue-700 rounded shadow-sm"
                onClick={() => {
                  setShowFallback(false);
                  window.location.href = '/dashboard/messages';
                }}
              >
                Go to Messages
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
