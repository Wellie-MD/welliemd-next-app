import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { debugLog } from '@/config/env';

/**
 * Hook for initializing authentication on app startup
 * This should be used in the root App component to restore user session
 */
export const useAuthInit = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const { initializeAuth, isLoading } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        debugLog('Initializing authentication...');
        await initializeAuth();
        
        if (isMounted) {
          setIsInitialized(true);
          setInitError(null);
          debugLog('Authentication initialization complete');
        }
      } catch (error) {
        debugLog('Authentication initialization failed:', error);
        
        if (isMounted) {
          setInitError(error instanceof Error ? error.message : 'Initialization failed');
          setIsInitialized(true); // Still mark as initialized even if it failed
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [initializeAuth]);

  return {
    isInitialized,
    isInitializing: !isInitialized && isLoading,
    initError,
  };
};

/**
 * Hook for handling automatic token refresh
 * Sets up interval to refresh tokens before they expire
 */
export const useTokenRefresh = () => {
  const { tokens, refreshProfile } = useAuthStore();

  useEffect(() => {
    if (!tokens?.accessToken) {
      return;
    }

    // Calculate refresh time (refresh 5 minutes before expiry)
    const refreshTime = (tokens.expiresIn - 300) * 1000; // Convert to milliseconds
    
    if (refreshTime <= 0) {
      // Token is already expired or will expire very soon, refresh immediately
      refreshProfile().catch((error) => {
        debugLog('Immediate token refresh failed:', error);
      });
      return;
    }

    const refreshTimer = setTimeout(() => {
      debugLog('Refreshing token automatically...');
      refreshProfile().catch((error) => {
        debugLog('Automatic token refresh failed:', error);
      });
    }, refreshTime);

    return () => {
      clearTimeout(refreshTimer);
    };
  }, [tokens, refreshProfile]);
};

/**
 * Hook for handling session timeout
 * Logs out user after a period of inactivity
 */
export const useSessionTimeout = (timeoutMinutes: number = 30) => {
  const { isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let lastActivity = Date.now();

    const resetTimeout = () => {
      lastActivity = Date.now();
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        const timeSinceLastActivity = Date.now() - lastActivity;
        const timeoutMs = timeoutMinutes * 60 * 1000;
        
        if (timeSinceLastActivity >= timeoutMs) {
          debugLog('Session timeout, logging out user');
          logout();
        } else {
          // Schedule next check
          resetTimeout();
        }
      }, timeoutMinutes * 60 * 1000);
    };

    const handleActivity = () => {
      resetTimeout();
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isAuthenticated, logout, timeoutMinutes]);
};

/**
 * Hook for handling authentication-related side effects
 * Manages navigation, notifications, and other side effects
 */
export const useAuthSideEffects = () => {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Listen for custom auth events
    const handleAuthLogin = () => {
      debugLog('User logged in');
      // You can add side effects here like:
      // - Analytics tracking
      // - Notification setup
      // - Feature flag initialization
    };

    const handleAuthLogout = () => {
      debugLog('User logged out');
      // You can add side effects here like:
      // - Clear cached data
      // - Reset application state
      // - Analytics tracking
    };

    window.addEventListener('auth:login', handleAuthLogin);
    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:login', handleAuthLogin);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh user data
        debugLog('Page became visible, refreshing auth state');
        // You could refresh the profile here if needed
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);
};
