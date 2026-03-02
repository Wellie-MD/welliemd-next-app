import { useState, useEffect } from "react";
import authIllustration from "@/assets/flow1.jpg";
import { fetchPublicBrandSettings } from "@/api/brandSettingsApi";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const [loginImage, setLoginImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBrandSettings = async () => {
      try {
        const brandData = await fetchPublicBrandSettings();
        if (brandData?.loginPageImage) {
          // Fix LocalStack URLs for browser access
          const imageUrl = brandData.loginPageImage.includes("localstack")
            ? brandData.loginPageImage.replace("localstack", "localhost")
            : brandData.loginPageImage;
          setLoginImage(imageUrl);
        }
      } catch (error) {
        console.error("Failed to load brand settings:", error);
      } finally {
        setIsLoading(false);
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
      {!isLoading && (
        <div className="flex-1 flex items-center justify-center p-0 bg-transparent">
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={loginImage || authIllustration} 
              alt="Healthcare illustration" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};