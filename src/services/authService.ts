import axios from 'axios';
import api from '../api/axiosInstance';
import { useAuthStore } from '../store/useAuthStore';
import { apiHandler } from '@/utils/api-handler';
import { CLIENT_ROUTES, API_ROUTES } from '@/constants/routes';

interface LoginCredentials {
  email: string;
  password: string;
  portal?: string;
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

interface RefreshResponse {
  access: string;
}

let refreshPromise: Promise<string | null> | null = null;

export const authService = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    const authStore = useAuthStore.getState();
    authStore.setLoading(true);
    
    try {
      const response = await api.post(API_ROUTES.LOGIN, {
        email: credentials.email,
        password: credentials.password,
        portal: 'client'
      });

      const data = apiHandler.handleSuccess<LoginResponse>(response.data);
      
      if (data) {
        const { access: accessToken, user } = data;
        authStore.login(accessToken, user);
        return user;
      }
      
      throw new Error('Login failed - no data received');
    } catch (error) {
      apiHandler.handleError(error);
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  },

  logout: async (): Promise<void> => {
    const authStore = useAuthStore.getState();
    authStore.setLoading(true);
    
    try {
      const response = await api.post(API_ROUTES.LOGOUT);
      apiHandler.handleSuccess(response.data);
    } catch (error) {
      console.error('Logout failed, clearing client-side state anyway.', error);
    } finally {
      authStore.logout();
    }
  },

  refreshAccessToken: async (): Promise<string | null> => {
    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const refreshAxios = axios.create({
          baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const response = await refreshAxios.post(API_ROUTES.TOKEN_REFRESH);
        const data = apiHandler.handleSuccess<RefreshResponse>(response.data, false);
        
        if (data?.access) {
          const authStore = useAuthStore.getState();
          authStore.setAccessToken(data.access);
          
          // Update user data if needed
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
          
          return data.access;
        }
        
        throw new Error('No access token received');
      } catch (error: any) {
        console.error('Token refresh failed:', error);
        useAuthStore.getState().logout();
        throw error;
      } finally {
        refreshPromise = null;
      }
    })();
    
    return refreshPromise;
  },

  getMe: async (throwOnError = false): Promise<User | null> => {
    try {
      const response = await api.get(API_ROUTES.USER_ME);
      const data = apiHandler.handleSuccess<User>(response.data, false); // No toast for profile fetch
      
      if (data) {
        useAuthStore.getState().setUser(data);
        return data;
      }
      
      return null;
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

  hydrateAuth: async (): Promise<void> => {
    const { setHydratingState } = await import('../api/axiosInstance');
    setHydratingState(true);
    
    const authStore = useAuthStore.getState();
    authStore.setLoading(true);
    
    try {
      const newAccessToken = await authService.refreshAccessToken();
      
      if (newAccessToken) {
        const directAxios = axios.create({
          baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newAccessToken}`
          },
        });
        
        const response = await directAxios.get(API_ROUTES.USER_ME);
        const userData = apiHandler.handleSuccess<User>(response.data, false);
        
        if (userData) {
          authStore.login(newAccessToken, userData);
          return;
        }
      }
    } catch (error: any) {
      console.log('Session restoration failed:', error.message);
    } finally {
      setHydratingState(false);
      authStore.setLoading(false);
    }
    
    authStore.logout();
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    const authStore = useAuthStore.getState();
    authStore.setLoading(true);
    
    try {
      const response = await api.post(API_ROUTES.PASSWORD_RESET_REQUEST, { email });
      apiHandler.handleSuccess(response.data);
    } catch (error) {
      apiHandler.handleError(error);
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  },

  confirmPasswordReset: async (uid: string, token: string, newPassword: string): Promise<void> => {
    const authStore = useAuthStore.getState();
    authStore.setLoading(true);
    
    try {
      const response = await api.post(API_ROUTES.PASSWORD_RESET_CONFIRM, {
        uid,
        token,
        new_password: newPassword,
      });
      apiHandler.handleSuccess(response.data);
    } catch (error) {
      apiHandler.handleError(error);
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  },
};
