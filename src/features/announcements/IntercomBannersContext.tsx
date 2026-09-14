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
  dismiss: (banner: IntercomBanner) => void;
}

const IntercomBannersContext = createContext<IntercomBannersContextValue>({
  inline: null,
  card: null,
  dismiss: () => {},
});

export const useIntercomBanners = () => useContext(IntercomBannersContext);

export function IntercomBannersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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

  const dismissedRefs = useRef<Set<string>>(new Set());

  const dismiss = (banner: IntercomBanner) => {
    if (banner.id) dismissedRefs.current.add(banner.id);
    dismissedRefs.current.add(banner.view_id);

    setBanners((prev) => prev.filter((b) => b !== banner && b.id !== banner.id));
    // Already removed locally; the server dismissal is best-effort.
    dismissIntercomBanner(banner.view_id)
      .then(() => fetchIntercomBanners())
      .then((data) => {
        setBanners(
          data.filter(
            (b) =>
              !dismissedRefs.current.has(b.view_id) &&
              (!b.id || !dismissedRefs.current.has(b.id))
          )
        );
      })
      .catch(() => {});
  };

  const inline = banners.find((b) => b.variant === 'inline') ?? null;
  const card = banners.find((b) => b.variant === 'card') ?? null;

  return (
    <IntercomBannersContext.Provider value={{ inline, card, dismiss }}>
      {children}
    </IntercomBannersContext.Provider>
  );
}
