import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    const init = async () => {
      try {
        console.log('AuthInitializer: Starting auth initialization');
        await initializeAuth();
        console.log('AuthInitializer: Auth initialization complete');
      } catch (error) {
        console.error('AuthInitializer: Auth initialization failed:', error);
      }
    };
    
    init();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <LoadingSkeleton className="w-16 h-16 rounded-full mx-auto" />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Loading WellieMD</h2>
            <p className="text-muted-foreground">Please wait while we initialize your session...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
