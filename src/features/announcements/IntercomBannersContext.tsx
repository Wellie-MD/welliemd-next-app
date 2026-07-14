import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import {
  dismissIntercomBanner,
  fetchIntercomBanners,
  type IntercomBanner,
} from './bannersApi';

interface IntercomBannersContextValue {
  /** First banner authored as the inline (top) variant, if any. */
  inline: IntercomBanner | null;
  /** First banner authored as the floating card (bottom) variant, if any. */
  card: IntercomBanner | null;
  /** Dismiss a banner: records it in Intercom and removes it locally. */
  dismiss: (viewId: string) => void;
}

const IntercomBannersContext = createContext<IntercomBannersContextValue>({
  inline: null,
  card: null,
  dismiss: () => {},
});

export const useIntercomBanners = () => useContext(IntercomBannersContext);

export function IntercomBannersProvider({ children }: { children: ReactNode }) {
  const [banners, setBanners] = useState<IntercomBanner[]>([]);
  // Fetch exactly once per session: each GET records impressions in Intercom,
  // so we must not double-fetch (StrictMode / re-renders / route changes).
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    if (!useAuthStore.getState().isAuthenticated) return;
    fetchedRef.current = true;

    fetchIntercomBanners()
      .then((data) => {
        setBanners(data);
      })
      .catch(() => {
        // Best-effort: on failure show no banners.
      });
  }, []);

  const dismiss = (viewId: string) => {
    setBanners((prev) => prev.filter((b) => b.view_id !== viewId));
    // Already removed locally; the server dismissal is best-effort.
    dismissIntercomBanner(viewId).catch(() => {});
  };

  const inline = banners.find((b) => b.variant === 'inline') ?? null;
  const card = banners.find((b) => b.variant === 'card') ?? null;

  return (
    <IntercomBannersContext.Provider value={{ inline, card, dismiss }}>
      {children}
    </IntercomBannersContext.Provider>
  );
}
