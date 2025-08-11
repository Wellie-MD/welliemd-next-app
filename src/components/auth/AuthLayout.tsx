import authIllustration from "@/assets/flow1.jpg";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-row items-stretch">
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
            src={authIllustration} 
            alt="Healthcare illustration" 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
};