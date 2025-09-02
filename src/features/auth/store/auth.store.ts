import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { authService } from '../services/auth.service';
import { debugLog } from '@/config/env';
import {
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  Permission,
  ROLE_PERMISSIONS,
} from '../types/auth.types';

// Auth store state interface
interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  permissions: Permission[];
  features: Record<string, boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (profileData: UpdateProfileRequest) => Promise<void>;
  changePassword: (passwordData: ChangePasswordRequest) => Promise<void>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
  
  // Selectors (computed values)
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isFeatureEnabled: (feature: string) => boolean;
}

// Create auth store with middleware
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial state
          user: null,
          tokens: null,
          permissions: [],
          features: {},
          isAuthenticated: false,
          isLoading: false,
          error: null,

          // Actions
          login: async (credentials: LoginRequest) => {
            debugLog('AuthStore.login:', { email: credentials.email });
            
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const response = await authService.login(credentials);
              
              set((state) => {
                state.user = response.user;
                // Convert API tokens to internal format
                state.tokens = {
                  accessToken: response.access,
                  refreshToken: response.refresh,
                  expiresIn: 3600, // Default to 1 hour
                  tokenType: 'Bearer' as const,
                };
                // Set permissions based on user role (if available)
                state.permissions = response.user.role ? ROLE_PERMISSIONS[response.user.role] : [];
                state.features = {};
                state.isAuthenticated = true;
                state.isLoading = false;
                state.error = null;
              });

              debugLog('Login successful:', { userId: response.user.id });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Login failed';
              
              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
                state.isAuthenticated = false;
              });

              debugLog('Login failed:', error);
              throw error;
            }
          },

          register: async (userData: RegisterRequest) => {
            debugLog('AuthStore.register:', { email: userData.email });
            
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const response = await authService.register(userData);
              
              set((state) => {
                state.user = response.user;
                // Convert API tokens to internal format
                state.tokens = {
                  accessToken: response.access,
                  refreshToken: response.refresh,
                  expiresIn: 3600, // Default to 1 hour
                  tokenType: 'Bearer' as const,
                };
                // Set permissions based on user role (if available)
                state.permissions = response.user.role ? ROLE_PERMISSIONS[response.user.role] : [];
                state.features = {};
                state.isAuthenticated = true;
                state.isLoading = false;
                state.error = null;
              });

              debugLog('Registration successful:', { userId: response.user.id });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Registration failed';
              
              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
                state.isAuthenticated = false;
              });

              debugLog('Registration failed:', error);
              throw error;
            }
          },

          logout: async () => {
            debugLog('AuthStore.logout');
            
            set((state) => {
              state.isLoading = true;
            });

            try {
              await authService.logout();
            } catch (error) {
              debugLog('Logout error (continuing anyway):', error);
            } finally {
              set((state) => {
                state.user = null;
                state.tokens = null;
                state.permissions = [];
                state.features = {};
                state.isAuthenticated = false;
                state.isLoading = false;
                state.error = null;
              });
            }
          },

          refreshProfile: async () => {
            debugLog('AuthStore.refreshProfile');
            
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const user = await authService.getProfile();
              
              set((state) => {
                state.user = user;
                state.permissions = user.role ? ROLE_PERMISSIONS[user.role] : [];
                state.isLoading = false;
                state.error = null;
              });

              debugLog('Profile refreshed:', { userId: user.id });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to refresh profile';
              
              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
              });

              debugLog('Profile refresh failed:', error);
              throw error;
            }
          },

          updateProfile: async (profileData: UpdateProfileRequest) => {
            debugLog('AuthStore.updateProfile:', profileData);
            
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              const updatedUser = await authService.updateProfile(profileData);
              
              set((state) => {
                state.user = updatedUser;
                state.isLoading = false;
                state.error = null;
              });

              debugLog('Profile updated:', { userId: updatedUser.id });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
              
              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
              });

              debugLog('Profile update failed:', error);
              throw error;
            }
          },

          changePassword: async (passwordData: ChangePasswordRequest) => {
            debugLog('AuthStore.changePassword');
            
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              await authService.changePassword(passwordData);
              
              set((state) => {
                state.isLoading = false;
                state.error = null;
              });

              debugLog('Password changed successfully');
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
              
              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
              });

              debugLog('Password change failed:', error);
              throw error;
            }
          },

          forgotPassword: async (data: ForgotPasswordRequest) => {
            debugLog('AuthStore.forgotPassword:', { email: data.email });
            
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              await authService.forgotPassword(data);
              
              set((state) => {
                state.isLoading = false;
                state.error = null;
              });

              debugLog('Password reset email sent');
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
              
              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
              });

              debugLog('Forgot password failed:', error);
              throw error;
            }
          },

          resetPassword: async (data: ResetPasswordRequest) => {
            debugLog('AuthStore.resetPassword');
            
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              await authService.resetPassword(data);
              
              set((state) => {
                state.isLoading = false;
                state.error = null;
              });

              debugLog('Password reset successful');
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
              
              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
              });

              debugLog('Password reset failed:', error);
              throw error;
            }
          },

          verifyEmail: async (token: string) => {
            debugLog('AuthStore.verifyEmail');
            
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              await authService.verifyEmail(token);
              
              // Refresh profile to get updated status
              await get().refreshProfile();
              
              debugLog('Email verification successful');
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Email verification failed';
              
              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
              });

              debugLog('Email verification failed:', error);
              throw error;
            }
          },

          resendVerification: async () => {
            debugLog('AuthStore.resendVerification');
            
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              await authService.resendVerification();
              
              set((state) => {
                state.isLoading = false;
                state.error = null;
              });

              debugLog('Verification email resent');
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification';
              
              set((state) => {
                state.isLoading = false;
                state.error = errorMessage;
              });

              debugLog('Resend verification failed:', error);
              throw error;
            }
          },

          initializeAuth: async () => {
            debugLog('AuthStore.initializeAuth');
            
            // Check if we have stored tokens
            if (!authService.isAuthenticated()) {
              debugLog('No stored tokens found');
              return;
            }

            set((state) => {
              state.isLoading = true;
              state.error = null;
            });

            try {
              // Verify token is still valid
              const isTokenValid = await authService.verifyToken();
              
              if (!isTokenValid) {
                debugLog('Stored token is invalid, trying to refresh');
                
                try {
                  await authService.refreshToken();
                } catch (refreshError) {
                  debugLog('Token refresh failed, clearing auth state');
                  authService.clearAuthData();
                  set((state) => {
                    state.user = null;
                    state.tokens = null;
                    state.permissions = [];
                    state.features = {};
                    state.isAuthenticated = false;
                    state.isLoading = false;
                    state.error = null;
                  });
                  return;
                }
              }

              // Get current user profile
              const user = await authService.getProfile();
              
              set((state) => {
                state.user = user;
                state.tokens = {
                  accessToken: authService.getAccessToken() || '',
                  refreshToken: authService.getRefreshToken() || '',
                  expiresIn: 3600,
                  tokenType: 'Bearer' as const,
                };
                state.permissions = user.role ? ROLE_PERMISSIONS[user.role] : [];
                state.features = {};
                state.isAuthenticated = true;
                state.isLoading = false;
                state.error = null;
              });

              debugLog('Auth initialized successfully:', { userId: user.id });
            } catch (error) {
              debugLog('Auth initialization failed:', error);
              
              // Clear invalid auth state
              authService.clearAuthData();
              set((state) => {
                state.user = null;
                state.tokens = null;
                state.permissions = [];
                state.features = {};
                state.isAuthenticated = false;
                state.isLoading = false;
                state.error = null;
              });
            }
          },

          clearError: () => {
            set((state) => {
              state.error = null;
            });
          },

          // Selectors
          hasPermission: (permission: Permission) => {
            const { permissions } = get();
            return permissions.includes(permission);
          },

          hasAnyPermission: (requiredPermissions: Permission[]) => {
            const { permissions } = get();
            return requiredPermissions.some(permission => permissions.includes(permission));
          },

          hasAllPermissions: (requiredPermissions: Permission[]) => {
            const { permissions } = get();
            return requiredPermissions.every(permission => permissions.includes(permission));
          },

          isFeatureEnabled: (feature: string) => {
            const { features } = get();
            return features[feature] ?? false;
          },
        }))
      ),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          tokens: state.tokens,
          permissions: state.permissions,
          features: state.features,
          isAuthenticated: state.isAuthenticated,
        }),
        // Don't persist loading states and errors
        version: 1,
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// Auth store selectors for better performance
export const authSelectors = {
  user: () => useAuthStore((state) => state.user),
  isAuthenticated: () => useAuthStore((state) => state.isAuthenticated),
  isLoading: () => useAuthStore((state) => state.isLoading),
  error: () => useAuthStore((state) => state.error),
  permissions: () => useAuthStore((state) => state.permissions),
  features: () => useAuthStore((state) => state.features),
  hasPermission: (permission: Permission) => useAuthStore((state) => state.hasPermission(permission)),
  isFeatureEnabled: (feature: string) => useAuthStore((state) => state.isFeatureEnabled(feature)),
};

// Subscribe to auth changes for side effects
useAuthStore.subscribe(
  (state) => state.isAuthenticated,
  (isAuthenticated, previousIsAuthenticated) => {
    if (isAuthenticated !== previousIsAuthenticated) {
      debugLog('Auth status changed:', { isAuthenticated, previousIsAuthenticated });
      
      // Emit custom events for other parts of the app
      if (isAuthenticated) {
        window.dispatchEvent(new CustomEvent('auth:login'));
      } else {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
  }
);

