import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { LoadingSkeleton } from '@/components/common/loading-skeleton';

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const impersonateLogin = useAuthStore((state) => state.impersonateLogin);
  const initRef = useRef(false);
  // Use local state for initial loading - not tied to auth store's isLoading
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    const init = async () => {
      if (window.location.pathname.replace(/\/+$/, '') === '/superadmin-access/launch') {
        setIsInitializing(false);
        return;
      }

      try {
        console.log('AuthInitializer: Starting auth initialization');
        const params = new URLSearchParams(window.location.search);
        const impersonateToken = params.get('impersonate_token');

        if (impersonateToken) {
          try {
            await impersonateLogin(impersonateToken);
            params.delete('impersonate_token');
            const nextSearch = params.toString();
            const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
            window.history.replaceState({}, '', nextUrl);
            if (window.location.pathname.startsWith('/auth/')) {
              navigate('/dashboard', { replace: true });
            }
            console.log('AuthInitializer: Impersonation login complete');
            return;
          } catch (error) {
            console.error('AuthInitializer: Impersonation login failed:', error);
          }
        }

        await initializeAuth();
        console.log('AuthInitializer: Auth initialization complete');
      } catch (error) {
        console.error('AuthInitializer: Auth initialization failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    init();
  }, [initializeAuth, impersonateLogin, navigate]);

  if (isInitializing) {
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
