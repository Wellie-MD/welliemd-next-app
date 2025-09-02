import { useCallback, useEffect } from 'react';
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
  
  const {
    user,
    tokens,
    permissions,
    features,
    isAuthenticated,
    isLoading,
    error,
    login: loginAction,
    register: registerAction,
    logout: logoutAction,
    refreshProfile,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    initializeAuth,
    clearError,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isFeatureEnabled,
  } = useAuthStore();

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Enhanced login with navigation
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      await loginAction(credentials);
      
      // Navigate to intended destination or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      
      debugLog('Login successful, navigating to:', from);
    } catch (error) {
      debugLog('Login failed:', error);
      throw error;
    }
  }, [loginAction, navigate, location.state]);

  // Enhanced register with navigation
  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      await registerAction(userData);
      
      // Navigate to dashboard after successful registration
      navigate('/dashboard', { replace: true });
      
      debugLog('Registration successful, navigating to dashboard');
    } catch (error) {
      debugLog('Registration failed:', error);
      throw error;
    }
  }, [registerAction, navigate]);

  // Enhanced logout with navigation
  const logout = useCallback(async () => {
    try {
      await logoutAction();
      
      // Navigate to login page
      navigate('/auth/signin', { replace: true });
      
      debugLog('Logout successful, navigating to signin');
    } catch (error) {
      debugLog('Logout error:', error);
      // Still navigate even if logout fails
      navigate('/auth/signin', { replace: true });
    }
  }, [logoutAction, navigate]);

  // Helper to check if user can access a route
  const canAccessRoute = useCallback((requiredPermissions?: Permission[]) => {
    if (!isAuthenticated) {
      return false;
    }

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    return hasAnyPermission(requiredPermissions);
  }, [isAuthenticated, hasAnyPermission]);

  // Helper to get user display name
  const getDisplayName = useCallback(() => {
    if (!user) return '';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    
    return user.email;
  }, [user]);

  // Helper to get user initials for avatar
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
    isLoading,
    error,

    // Actions
    login,
    register,
    logout,
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
  const { permissions, hasPermission, hasAnyPermission, hasAllPermissions } = useAuthStore();

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
  const { features, isFeatureEnabled } = useAuthStore();

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
  const {
    user,
    isLoading,
    error,
    refreshProfile,
    updateProfile,
    changePassword,
  } = useAuthStore();

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
