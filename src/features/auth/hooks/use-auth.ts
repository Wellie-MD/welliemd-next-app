import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { debugLog } from '@/config/env';
import { 
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  Permission,
} from '../types/auth.types';

/**
 * Main authentication hook providing all auth-related functionality
 * This hook manages authentication state and provides actions
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = useAuthStore((state) => state.user);
  const tokens = useAuthStore((state) => state.tokens);
  const permissions = useAuthStore((state) => state.permissions);
  const features = useAuthStore((state) => state.features);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isImpersonated = useAuthStore((state) => state.isImpersonated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  
  const loginAction = useAuthStore((state) => state.login);
  const impersonateLoginAction = useAuthStore((state) => state.impersonateLogin);
  const endImpersonationAction = useAuthStore((state) => state.endImpersonation);
  const registerAction = useAuthStore((state) => state.register);
  const logoutAction = useAuthStore((state) => state.logout);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const changePassword = useAuthStore((state) => state.changePassword);
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const resendVerification = useAuthStore((state) => state.resendVerification);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const clearError = useAuthStore((state) => state.clearError);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);
  const hasAllPermissions = useAuthStore((state) => state.hasAllPermissions);
  const isFeatureEnabled = useAuthStore((state) => state.isFeatureEnabled);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      await loginAction(credentials);

      const searchParams = new URLSearchParams(location.search);
      const returnTarget = searchParams.get('return');
      const stateFrom = location.state?.from;
      const from =
        returnTarget ||
        (typeof stateFrom === 'string' ? stateFrom : stateFrom?.pathname) ||
        '/dashboard';

      if (/^https?:\/\//i.test(from)) {
        window.location.href = from;
      } else {
        navigate(from, { replace: true });
      }

      debugLog('Login successful, navigating to:', from);
    } catch (error) {
      debugLog('Login failed:', error);
      throw error;
    }
  }, [loginAction, navigate, location.search, location.state]);

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      await registerAction(userData);
      
      navigate('/dashboard', { replace: true });
      
      debugLog('Registration successful, navigating to dashboard');
    } catch (error) {
      debugLog('Registration failed:', error);
      throw error;
    }
  }, [registerAction, navigate]);

  const logout = useCallback(async () => {
    try {
      await logoutAction();
      
      navigate('/auth/signin', { replace: true });
      
      debugLog('Logout successful, navigating to signin');
    } catch (error) {
      debugLog('Logout error:', error);
      navigate('/auth/signin', { replace: true });
    }
  }, [logoutAction, navigate]);

  const endImpersonation = useCallback(async () => {
    await endImpersonationAction();
    window.close();
  }, [endImpersonationAction]);

  const canAccessRoute = useCallback((requiredPermissions?: Permission[]) => {
    if (!isAuthenticated) {
      return false;
    }

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    return hasAnyPermission(requiredPermissions);
  }, [isAuthenticated, hasAnyPermission]);

  const getDisplayName = useCallback(() => {
    if (!user) return '';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    
    return user.email;
  }, [user]);

  const getInitials = useCallback(() => {
    if (!user) return '';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    
    return user.email.charAt(0).toUpperCase();
  }, [user]);

  return {
    // State
    user,
    tokens,
    permissions,
    features,
    isAuthenticated,
    isImpersonated,
    isLoading,
    error,

    // Actions
    login,
    register,
    logout,
    endImpersonation,
    refreshProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    clearError,

    // Permissions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    isFeatureEnabled,

    // Helpers
    getDisplayName,
    getInitials,
  };
};

/**
 * Hook for checking permissions
 * Useful for conditional rendering based on user permissions
 */
export const usePermissions = () => {
  const permissions = useAuthStore((state) => state.permissions);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission);
  const hasAllPermissions = useAuthStore((state) => state.hasAllPermissions);

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

/**
 * Hook for feature flags
 * Allows conditional rendering based on enabled features
 */
export const useFeatureFlags = () => {
  const features = useAuthStore((state) => state.features);
  const isFeatureEnabled = useAuthStore((state) => state.isFeatureEnabled);

  return {
    features,
    isFeatureEnabled,
  };
};

/**
 * Hook for user profile information
 * Provides user data and profile management functions
 */
export const useProfile = () => {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const changePassword = useAuthStore((state) => state.changePassword);

  const getDisplayName = useCallback(() => {
    if (!user) return '';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    
    return user.email;
  }, [user]);

  const getInitials = useCallback(() => {
    if (!user) return '';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    
    return user.email.charAt(0).toUpperCase();
  }, [user]);

  return {
    user,
    isLoading,
    error,
    refreshProfile,
    updateProfile,
    changePassword,
    getDisplayName,
    getInitials,
  };
};

/**
 * Hook for authentication loading state
 * Useful for showing loading spinners during auth operations
 */
export const useAuthLoading = () => {
  const isLoading = useAuthStore((state) => state.isLoading);
  return isLoading;
};

/**
 * Hook for authentication errors
 * Provides error state and clear function
 */
export const useAuthError = () => {
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  return {
    error,
    clearError,
  };
};
