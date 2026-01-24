import axios from 'axios';
import api from '../api/axiosInstance';
import { useAuthStore } from '../store/useAuthStore';

interface LoginCredentials {
  email: string;
  password: string;
  portal?: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface LoginResponse {
  access: string;
  user: User;
}

interface RegisterResponse {
  access: string;
  user: User;
}

interface RefreshResponse {
  access: string;
}

let refreshPromise: Promise<string | null> | null = null;

export const authService = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    // Include portal in the request payload
    const { data } = await api.post<LoginResponse>('/auth/login/', {
      email: credentials.email,
      password: credentials.password,
      // portal: 'client'
    });
    const { access: accessToken, user } = data;
    
    useAuthStore.getState().login(accessToken, user);
    return user;
  },

  register: async (credentials: RegisterCredentials): Promise<User> => {
    if (!credentials.name?.trim()) {
      throw new Error('Name is required');
    }
    if (!credentials.email?.trim()) {
      throw new Error('Email is required');
    }
    if (!credentials.password) {
      throw new Error('Password is required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      throw new Error('Please enter a valid email address');
    }

    try {
      const { data } = await api.post<RegisterResponse>('/auth/register/', {
        name: credentials.name.trim(),
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      });
      
      useAuthStore.getState().login(data.access, data.user);
      return data.user;
    } catch (error: any) {
      console.error('Registration error:', error.response?.data);

      if (error.response?.data) {
        const data = error.response.data;
        if (data.email && Array.isArray(data.email) && data.email.length > 0) {
          throw new Error(data.email[0]);
        } else if (data.detail) {
          throw new Error(data.detail);
        } else if (data.message) {
          throw new Error(data.message);
        }
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout failed, clearing client-side state anyway.', error);
    } finally {
      useAuthStore.getState().logout();
    }
  },

  refreshAccessToken: async (): Promise<string | null> => {
    // Prevent multiple simultaneous refresh requests
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        // Create a new axios instance without interceptors to avoid infinite loops
        const refreshAxios = axios.create({
          baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const { data } = await refreshAxios.post<RefreshResponse>('/auth/token/refresh/');
        const newAccessToken = data.access;

        if (!newAccessToken) {
          throw new Error('No access token received in refresh response');
        }

        // Update the auth store with the new token
        const authStore = useAuthStore.getState();
        authStore.setAccessToken(newAccessToken);
        
        // Update user data to ensure consistency
        if (authStore.user) {
          try {
            const userData = await authService.getMe();
            if (userData) {
              authStore.setUser(userData);
            }
          } catch (error) {
            console.warn('Failed to refresh user data after token refresh:', error);
          }
        }
        
        return newAccessToken;
      } catch (error: any) {
        // Only log out if the refresh token is invalid (401) or expired
        // Don't log out for network errors or other transient issues
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          console.error('Refresh token is invalid or expired, logging out');
          useAuthStore.getState().logout();
        } else {
          console.error('Token refresh failed (non-auth error):', error.response?.data || error.message);
        }
        throw error;
      } finally {
        refreshPromise = null;
      }
    })();
    
    return refreshPromise;
  },

  getMe: async (throwOnError = false): Promise<User | null> => {
    try {
      const { data } = await api.get<User>('/auth/me/');
      useAuthStore.getState().setUser(data);
      return data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
        
        if (throwOnError) {
          throw error;
        }
      }
      return null;
    }
  },

  // Restore authentication state on app initialization
  hydrateAuth: async (): Promise<void> => {
    const { setHydratingState } = await import('../api/axiosInstance');
    setHydratingState(true);
    
    const authStore = useAuthStore.getState();
    authStore.setLoading(true);
    
    try {
      // Always try to refresh token on page load using the refresh token cookie
      // On page refresh, access token in memory is lost, but refresh token cookie persists
      const newAccessToken = await authService.refreshAccessToken();
      
      if (newAccessToken) {
        // Create a direct axios call to avoid interceptor conflicts during hydration
        const directAxios = axios.create({
          baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newAccessToken}`
          },
        });
        
        const { data } = await directAxios.get<User>('/auth/me/');
        authStore.login(newAccessToken, data);
        return;
      }
    } catch (error: any) {
      // refreshAccessToken already handles logout for 401/403 (invalid refresh token)
      // For other errors (network, etc.), we don't log out to avoid false logouts
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        console.log('Session restoration failed: refresh token invalid or expired');
        // refreshAccessToken already called logout() for 401/403, no need to call it again
      } else {
        console.log('Session restoration failed (non-auth error, will retry on next request):', error.message);
        // Don't log out for transient errors - user might still have a valid session
        // The user will remain unauthenticated but won't be forcefully logged out
      }
    } finally {
      setHydratingState(false);
      authStore.setLoading(false);
    }
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/auth/password-reset/request/', { email });
  },

  confirmPasswordReset: async (uid: string, token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/password-reset/confirm/', {
      uid,
      token,
      new_password: newPassword,
    });
  },

  changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> => {
    try {
      await api.post('/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      
      // On success, logout and redirect to login
      await authService.logout();
      window.location.href = '/auth/signin';
    } catch (error: any) {
      // Extract error message from response
      if (error.response?.data) {
        const data = error.response.data;
        if (data.current_password && Array.isArray(data.current_password) && data.current_password.length > 0) {
          throw new Error(data.current_password[0]);
        } else if (data.new_password && Array.isArray(data.new_password) && data.new_password.length > 0) {
          throw new Error(data.new_password[0]);
        } else if (data.non_field_errors && Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
          throw new Error(data.non_field_errors[0]);
        } else if (data.detail) {
          throw new Error(data.detail);
        } else if (data.message) {
          throw new Error(data.message);
        }
      }
      throw new Error('Failed to change password. Please try again.');
    }
  },
};
