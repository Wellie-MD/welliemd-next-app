import authIllustration from "@/assets/flow1.jpg";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-md">
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </div>
      
      {/* Right side - Illustration */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
        <img 
          src={authIllustration} 
          alt="Healthcare illustration" 
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};
