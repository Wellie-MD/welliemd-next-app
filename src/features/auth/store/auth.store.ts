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
  UserRole,
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

let isInitializing = false;
let isRefreshing = false;

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
            } catch (error: any) {
              // The apiClient transforms errors - extract message from different formats:
              // 1. {error: "message"} - string error from server
              // 2. {error: {message: "..."}} - nested error object
              // 3. Axios error with response.data
              let errorMessage = 'Login failed';
              
              if (typeof error?.error === 'string') {
                errorMessage = error.error;
              } else if (typeof error?.error?.message === 'string') {
                errorMessage = error.error.message;
              } else if (error?.response?.data?.error) {
                errorMessage = typeof error.response.data.error === 'string'
                  ? error.response.data.error
                  : error.response.data.error.message || errorMessage;
              } else if (error?.message) {
                errorMessage = error.message;
              }
              
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
              const user = await authService.getCurrentUser();
              
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
            } catch (error: any) {
              // The apiClient transforms errors - extract message from different formats:
              // 1. {error: "message"} - string error from server
              // 2. {error: {message: "..."}} - nested error object
              // 3. Axios error with response.data
              let errorMessage = 'An unexpected error occurred. Please try again.';
              
              if (typeof error?.error === 'string') {
                errorMessage = error.error;
              } else if (typeof error?.error?.message === 'string') {
                errorMessage = error.error.message;
              } else if (error?.response?.data?.error) {
                errorMessage = typeof error.response.data.error === 'string'
                  ? error.response.data.error
                  : error.response.data.error.message || errorMessage;
              } else if (error?.message) {
                errorMessage = error.message;
              }
              
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
            if (isInitializing) {
              debugLog('Auth initialization already in progress');
              return;
            }
          
            debugLog('AuthStore.initializeAuth');
            
            isInitializing = true;
          
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });
          
            try {
              const hasAccessToken = authService.isAuthenticated();
              // If no in-memory token (common after hard refresh), try cookie-based refresh once.
              if (!hasAccessToken) {
                debugLog('No access token in memory, attempting to refresh from cookie');
                if (isRefreshing) {
                  debugLog('Token refresh already in progress');
                  return;
                }
                isRefreshing = true;
                try {
                  await authService.refreshToken();
                  debugLog('Token refreshed successfully');
                } catch (refreshError) {
                  debugLog('Token refresh failed, clearing auth state:', refreshError);
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
                } finally {
                  isRefreshing = false;
                }
              }

              let user: User | null = null;

              try {
                user = await authService.getCurrentUser();
              } catch (profileError) {
                debugLog('Failed to fetch profile on first attempt:', profileError);

                // If an access token exists but profile fetch failed (e.g. stale token),
                // attempt one refresh fallback before clearing auth state.
                if (!hasAccessToken) {
                  throw profileError;
                }

                if (isRefreshing) {
                  debugLog('Token refresh already in progress');
                  throw profileError;
                }

                isRefreshing = true;
                try {
                  await authService.refreshToken();
                  user = await authService.getCurrentUser();
                  debugLog('Recovered session after refresh fallback');
                } finally {
                  isRefreshing = false;
                }
              }
              
              set((state) => {
                state.user = user;
                state.tokens = {
                  accessToken: authService.getAccessToken() || '',
                  refreshToken: '', // Refresh token is in HTTP-only cookie, not stored in state
                  expiresIn: 3600,
                  tokenType: 'Bearer' as const,
                };
                state.permissions = user?.role ? ROLE_PERMISSIONS[user.role] : [];
                state.features = {};
                state.isAuthenticated = true;
                state.isLoading = false;
                state.error = null;
              });
          
              debugLog('Auth initialized successfully:', { userId: user?.id });
            } catch (error) {
              debugLog('Auth initialization failed:', error);
              
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
            } finally {
              isInitializing = false;
            }
          },

          clearError: () => {
            set((state) => {
              state.error = null;
            });
          },

          // Selectors
          hasPermission: (permission: Permission) => {
            const { permissions, user } = get();
            const effectivePermissions =
              permissions.length > 0
                ? permissions
                : user?.role
                  ? ROLE_PERMISSIONS[user.role]
                  : user
                    ? ROLE_PERMISSIONS[UserRole.PATIENT]
                    : [];
            return effectivePermissions.includes(permission);
          },

          hasAnyPermission: (requiredPermissions: Permission[]) => {
            const { permissions, user } = get();
            const effectivePermissions =
              permissions.length > 0
                ? permissions
                : user?.role
                  ? ROLE_PERMISSIONS[user.role]
                  : user
                    ? ROLE_PERMISSIONS[UserRole.PATIENT]
                    : [];
            return requiredPermissions.some(permission => effectivePermissions.includes(permission));
          },

          hasAllPermissions: (requiredPermissions: Permission[]) => {
            const { permissions, user } = get();
            const effectivePermissions =
              permissions.length > 0
                ? permissions
                : user?.role
                  ? ROLE_PERMISSIONS[user.role]
                  : user
                    ? ROLE_PERMISSIONS[UserRole.PATIENT]
                    : [];
            return requiredPermissions.every(permission => effectivePermissions.includes(permission));
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
        // Sync persisted token to tokenManager when store is rehydrated
        onRehydrateStorage: () => (state) => {
          if (state?.tokens?.accessToken) {
            // Import tokenManager dynamically to avoid circular dependencies
            import('../services/token-manager').then(({ tokenManager }) => {
              tokenManager.setAccessToken(state.tokens!.accessToken);
              debugLog('Token synced to tokenManager from persisted state');
            });
          }
        },
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
// useAuthStore.subscribe(
//   (state) => state.isAuthenticated,
//   (isAuthenticated, previousIsAuthenticated) => {
//     if (isAuthenticated !== previousIsAuthenticated) {
//       debugLog('Auth status changed:', { isAuthenticated, previousIsAuthenticated });
      
//       // Emit custom events for other parts of the app
//       if (isAuthenticated) {
//         window.dispatchEvent(new CustomEvent('auth:login'));
//       } else {
//         window.dispatchEvent(new CustomEvent('auth:logout'));
//       }
//     }
//   }
// );
