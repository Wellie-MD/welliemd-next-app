import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { brandingService, BrandColors, BrandLogos, SupportDetails } from '../features/branding/services/branding.service';
import { useTheme } from 'next-themes';

interface BrandContextValue {
  colors: BrandColors;
  logos: BrandLogos | undefined;
  support: SupportDetails | undefined;
  isLoading: boolean;
  error: string | null;
}

const defaultColors: BrandColors = {
  primaryColor: '#2563eb',
  secondaryColor: '#7c3aed',
  accentColor: '#059669',
  neutralColor: '#64748b',
};

export const BrandContext = createContext<BrandContextValue>({
  colors: defaultColors,
  logos: undefined,
  support: undefined,
  isLoading: false,
  error: null,
});

interface BrandProviderProps {
  children: ReactNode;
}

/**
 * Converts hex color to HSL format for Tailwind CSS
 * @param hex - Hex color string (e.g., "#2563eb")
 * @returns HSL string in format "221 83% 53%"
 */
function hexToHSL(hex: string | null | undefined): string {
  // Return default if hex is null/undefined/empty
  if (!hex) {
    return '221 83% 53%'; // Default blue
  }
  
  // Remove the hash if present
  hex = hex.replace('#', '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}

export const BrandProvider: React.FC<BrandProviderProps> = ({ children }) => {
  const [colors, setColors] = useState<BrandColors>(defaultColors);
  const [logos, setLogos] = useState<BrandLogos | undefined>(undefined);
  const [support, setSupport] = useState<SupportDetails | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setTheme } = useTheme();
  const themeStorageKey = 'welliemd_patient_theme';
  const userThemeOverrideKey = 'welliemd_patient_theme_user_set';

  // Helper to fix LocalStack URLs for the browser
  const fixLocalStackUrl = (url?: string): string | undefined => {
    if (!url) return url;
    if (url.includes('localstack')) {
      return url.replace('localstack', 'localhost');
    }
    return url;
  };

  useEffect(() => {
    const fetchAndApplyBranding = async () => {
      try {
        setIsLoading(true);
        const brandSettings = await brandingService.getBrandSettings();
        
        // Apply colors to CSS custom properties
        const root = document.documentElement;
        
        // Set hex values for direct usage
        root.style.setProperty('--brand-primary', brandSettings.primaryColor);
        root.style.setProperty('--brand-secondary', brandSettings.secondaryColor);
        root.style.setProperty('--brand-accent', brandSettings.accentColor);
        root.style.setProperty('--brand-neutral', brandSettings.neutralColor);
        
        // Set HSL values for Tailwind opacity modifiers
        root.style.setProperty('--brand-primary-hsl', hexToHSL(brandSettings.primaryColor));
        root.style.setProperty('--brand-secondary-hsl', hexToHSL(brandSettings.secondaryColor));
        root.style.setProperty('--brand-accent-hsl', hexToHSL(brandSettings.accentColor));
        root.style.setProperty('--brand-neutral-hsl', hexToHSL(brandSettings.neutralColor));
        
        // Bridge brand colors → kinmeds3 accent system
        if (brandSettings.primaryColor) {
          root.style.setProperty('--km-ac', brandSettings.primaryColor);
          // Parse hex to create 12% opacity version for accent backgrounds
          const hex = brandSettings.primaryColor.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          root.style.setProperty('--km-acp', `rgba(${r},${g},${b},0.12)`);
        }
        
        setColors({
          primaryColor: brandSettings.primaryColor,
          secondaryColor: brandSettings.secondaryColor,
          accentColor: brandSettings.accentColor,
          neutralColor: brandSettings.neutralColor,
        });
        
        // Fix LocalStack URLs in logos
        const fixedLogos: BrandLogos | undefined = brandSettings.logos ? {
          square: fixLocalStackUrl(brandSettings.logos.square),
          round: fixLocalStackUrl(brandSettings.logos.round),
          transparent: fixLocalStackUrl(brandSettings.logos.transparent),
          favicon: fixLocalStackUrl(brandSettings.logos.favicon),
        } : undefined;
        
        setLogos(fixedLogos);
        setSupport(brandSettings.support);

        const storedTheme = localStorage.getItem(themeStorageKey);
        const userThemeOverride = localStorage.getItem(userThemeOverrideKey);
        if (brandSettings.patientPortalTheme && userThemeOverride !== 'true') {
          if (storedTheme !== brandSettings.patientPortalTheme) {
            setTheme(brandSettings.patientPortalTheme);
          }
        }
        
        // Update favicon dynamically
        if (fixedLogos?.favicon) {
          let faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
          if (!faviconLink) {
            faviconLink = document.createElement('link');
            faviconLink.rel = 'icon';
            document.head.appendChild(faviconLink);
          }
          faviconLink.href = fixedLogos.favicon;
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch brand settings:', err);
        setError('Failed to load brand settings');
        
        // Apply default colors on error
        const root = document.documentElement;
        root.style.setProperty('--brand-primary', defaultColors.primaryColor);
        root.style.setProperty('--brand-secondary', defaultColors.secondaryColor);
        root.style.setProperty('--brand-accent', defaultColors.accentColor);
        root.style.setProperty('--brand-neutral', defaultColors.neutralColor);
        
        // Set default HSL values
        root.style.setProperty('--brand-primary-hsl', hexToHSL(defaultColors.primaryColor));
        root.style.setProperty('--brand-secondary-hsl', hexToHSL(defaultColors.secondaryColor));
        root.style.setProperty('--brand-accent-hsl', hexToHSL(defaultColors.accentColor));
        root.style.setProperty('--brand-neutral-hsl', hexToHSL(defaultColors.neutralColor));
        
        setColors(defaultColors);
        setLogos(undefined);
        setSupport(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndApplyBranding();
  }, []);

  return (
    <BrandContext.Provider value={{ colors, logos, support, isLoading, error }}>
      {children}
    </BrandContext.Provider>
  );
};
