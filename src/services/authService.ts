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
  roles?: string[];
  primary_role?: string;
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

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const authService = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    // Include portal in the request payload
    const { data } = await api.post<LoginResponse>('/auth/login/', {
      email: normalizeEmail(credentials.email),
      password: credentials.password,
      portal: 'client'
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
        email: normalizeEmail(credentials.email),
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
        // AND we don't have a valid access token already
        // Don't log out for network errors or other transient issues
        const status = error.response?.status;
        const authStore = useAuthStore.getState();
        
        if (status === 401 || status === 403) {
          // Only logout if we don't have a valid access token
          // If user just logged in, they have a valid token, so don't logout
          if (!authStore.isAuthenticated || !authStore.accessToken) {
            console.error('Refresh token is invalid or expired, logging out');
            authStore.logout();
          } else {
            // We have a valid access token, just log the refresh failure
            console.warn('Refresh token failed but user has valid access token, continuing with existing token');
          }
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
      // If user is already authenticated with a valid access token, verify it's still valid
      // instead of immediately trying to refresh (which can fail if cookie isn't ready yet)
      if (authStore.isAuthenticated && authStore.accessToken) {
        try {
          // Try to verify the existing token by calling /auth/me/
          const directAxios = axios.create({
            baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authStore.accessToken}`
            },
          });
          
          const { data } = await directAxios.get<User>('/auth/me/');
          // Token is still valid, update user data and return
          authStore.setUser(data);
          setHydratingState(false);
          authStore.setLoading(false);
          return;
        } catch (error: any) {
          // Token is invalid, fall through to refresh logic
          const status = error.response?.status;
          if (status === 401 || status === 403) {
            // Token expired, try to refresh
            console.log('Access token expired, attempting refresh...');
          } else {
            // Network or other error, don't try to refresh
            console.log('Failed to verify token (non-auth error):', error.message);
            setHydratingState(false);
            authStore.setLoading(false);
            return;
          }
        }
      }
      
      // Only try to refresh token if:
      // 1. User is not authenticated, OR
      // 2. User is authenticated but token verification failed
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
      // Only log out if we don't have a valid access token
      // If user just logged in and has a valid token, don't log them out
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        // Only logout if we don't have a valid access token already
        if (!authStore.isAuthenticated || !authStore.accessToken) {
          console.log('Session restoration failed: refresh token invalid or expired');
          useAuthStore.getState().logout();
        } else {
          // We have a valid token, just log the refresh failure but don't logout
          console.log('Token refresh failed but user has valid access token, continuing with existing token');
        }
      } else {
        console.log('Session restoration failed (non-auth error, will retry on next request):', error.message);
        // Don't log out for transient errors - user might still have a valid session
        // If we have a valid token, keep the user logged in
        if (authStore.isAuthenticated && authStore.accessToken) {
          // Keep user logged in with existing token
          console.log('Keeping user logged in with existing access token');
        }
      }
    } finally {
      setHydratingState(false);
      authStore.setLoading(false);
    }
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/auth/password-reset/request/', { email, portal: 'client' });
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
