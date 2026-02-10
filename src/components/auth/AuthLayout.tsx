import { useState, useEffect } from "react";
import authIllustration from "@/assets/flow1.jpg";
import { fetchPublicBrandSettings } from "@/api/brandSettingsApi";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Helper function to update favicon dynamically
 * Creates a new link element if one doesn't exist
 */
function updateFavicon(faviconUrl: string): void {
  try {
    let faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/png';
      document.head.appendChild(faviconLink);
    }
    
    faviconLink.href = faviconUrl;
    console.log('[AuthLayout] Favicon updated to:', faviconUrl);
  } catch (error) {
    console.error('[AuthLayout] Failed to update favicon:', error);
  }
}

/**
 * Helper function to fix LocalStack URLs for browser access
 * Replaces internal Docker hostname with localhost
 */
function fixLocalStackUrl(url: string): string {
  if (!url) return url;
  
  // Replace localstack:4566 with localhost:4566 for browser access
  if (url.includes('localstack:4566')) {
    return url.replace('localstack:4566', 'localhost:4566');
  }
  
  // Also handle just 'localstack' without port
  if (url.includes('localstack')) {
    return url.replace('localstack', 'localhost');
  }
  
  return url;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const [loginImage, setLoginImage] = useState<string>(authIllustration);

  useEffect(() => {
    const loadBrandSettings = async () => {
      try {
        console.log('[AuthLayout] Loading public brand settings...');
        const brandData = await fetchPublicBrandSettings();
        
        // Update login page background image
        if (brandData?.loginPageImage) {
          const imageUrl = fixLocalStackUrl(brandData.loginPageImage);
          setLoginImage(imageUrl);
          console.log('[AuthLayout] Login image updated');
        }
        
        // Update favicon
        if (brandData?.logos?.favicon) {
          const faviconUrl = fixLocalStackUrl(brandData.logos.favicon);
          updateFavicon(faviconUrl);
        }
        
        console.log('[AuthLayout] Brand settings loaded successfully');
      } catch (error) {
        console.error('[AuthLayout] Failed to load brand settings:', error);
        // Keep using default image and favicon on error - graceful degradation
      }
    };

    loadBrandSettings();
  }, []);

  return (
    <div className="h-screen flex flex-row items-stretch">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
      
      {/* Right side - Illustration */}
      <div className="flex-1 flex items-center justify-center p-0 bg-transparent">
        <div className="w-full h-full flex items-center justify-center">
          <img 
            src={loginImage} 
            alt="Healthcare illustration" 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default illustration if brand image fails to load
              console.warn('[AuthLayout] Login image failed to load, using default');
              e.currentTarget.src = authIllustration;
            }}
          />
        </div>
      </div>
    </div>
  );
};