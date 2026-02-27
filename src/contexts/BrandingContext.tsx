import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchBrandSettings, BrandSettings, BrandLogos } from '@/api/brandSettingsApi';

interface BrandingContextType {
  brandSettings: BrandSettings | null;
  logos: BrandLogos | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null);
  const [logos, setLogos] = useState<BrandLogos | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to fix LocalStack URLs for the browser
  const fixLocalStackUrl = (url?: string): string | undefined => {
    if (!url) return url;
    // Replace localstack hostname with localhost for browser access
    if (url.includes('localstack:4566')) {
      return url.replace('localstack:4566', 'localhost:4566');
    }
    return url;
  };

  const loadBrandSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[BrandingContext] Fetching brand settings...');
      const settings = await fetchBrandSettings();
      console.log('[BrandingContext] Brand settings received:', settings);
      setBrandSettings(settings);
      
      // Fix LocalStack URLs in logos
      const fixedLogos: BrandLogos | undefined = settings.logos ? {
        square: fixLocalStackUrl(settings.logos.square) || undefined,
        round: fixLocalStackUrl(settings.logos.round) || undefined,
        transparent: fixLocalStackUrl(settings.logos.transparent) || undefined,
        favicon: fixLocalStackUrl(settings.logos.favicon) || undefined,
      } : undefined;
      
      console.log('[BrandingContext] Fixed logos:', fixedLogos);
      setLogos(fixedLogos);
      
      // Update favicon dynamically
      if (fixedLogos?.favicon) {
        console.log('[BrandingContext] Updating favicon to:', fixedLogos.favicon);
        updateFavicon(fixedLogos.favicon);
      }
    } catch (err) {
      console.error('[BrandingContext] Failed to load brand settings:', err);
      setError('Failed to load brand settings');
      setLogos(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrandSettings();
  }, []);

  return (
    <BrandingContext.Provider 
      value={{ 
        brandSettings, 
        logos,
        isLoading, 
        error,
        refetch: loadBrandSettings 
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

// Helper function to update favicon
function updateFavicon(faviconUrl: string) {
  let faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
  if (!faviconLink) {
    faviconLink = document.createElement('link');
    faviconLink.rel = 'icon';
    document.head.appendChild(faviconLink);
  }
  faviconLink.href = faviconUrl;
}
