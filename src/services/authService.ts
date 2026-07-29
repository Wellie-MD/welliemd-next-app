import axios, { AxiosError } from 'axios';
import api from '../api/axiosInstance';
import { useAuthStore } from '../store/useAuthStore';
import { API_REQUEST_TIMEOUT_MS } from '../api/constants';

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

type ErrorResponseData = {
  current_password?: string[];
  detail?: string;
  email?: string[];
  message?: string;
  new_password?: string[];
  non_field_errors?: string[];
};

const getAxiosError = (error: unknown): AxiosError<ErrorResponseData> | null =>
  axios.isAxiosError<ErrorResponseData>(error) ? error : null;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const authService = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    try {
      const { data } = await api.post<LoginResponse>('/auth/login/', {
        email: normalizeEmail(credentials.email),
        password: credentials.password,
        portal: 'client'
      });
      const { access: accessToken, user } = data;

      useAuthStore.getState().login(accessToken, user);
      return user;
    } catch (error: any) {
      const responseData = error?.response?.data;
      const rawMessage =
        responseData?.message ||
        responseData?.non_field_errors?.[0]?.message ||
        responseData?.non_field_errors?.[0] ||
        responseData?.detail ||
        responseData?.error;
      const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
      throw new Error(
        typeof message === "string" && message
          ? message
          : "Failed to sign in. Please check your credentials."
      );
    }
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
    } catch (error) {
      const axiosError = getAxiosError(error);
      console.error('Registration error:', axiosError?.response?.data);

      if (axiosError?.response?.data) {
        const data = axiosError.response.data;
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
      // Shut down Intercom synchronously before clearing auth state
      // so the widget is removed even if the React component cleanup hasn't fired yet.
      try {
        const { shutdownIntercom } = await import('../features/integrations/IntercomWidget');
        shutdownIntercom();
      } catch {
        // IntercomWidget may not exist; ignore
      }
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
          timeout: API_REQUEST_TIMEOUT_MS,
          headers: {
            'Content-Type': 'application/json',
            'X-Wellie-Portal': 'client',
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
      } catch (error) {
        // When the refresh token itself returns 401/403 the stored access
        // token is also stale — the persisted state (localStorage) is
        // unreliable. Always clear the session so the interceptor or
        // hydrateAuth redirects the user to sign-in instead of leaving
        // them in a broken "authenticated" state with an expired token.
        const axiosError = getAxiosError(error);
        const status = axiosError?.response?.status;
        
        if (status === 401 || status === 403) {
          useAuthStore.getState().logout();
        } else {
          console.error('Token refresh failed (non-auth error):', axiosError?.response?.data || getErrorMessage(error));
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
    } catch (error) {
      const axiosError = getAxiosError(error);
      if (axiosError?.response?.status === 401) {
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
      if (authStore.superAdminApiBaseUrl) {
        try {
          const { data } = await api.get<User>('/auth/me/', { skipAuthRedirect: true });
          authStore.setUser(data);
          return;
        } catch (error) {
          const axiosError = getAxiosError(error);
          const status = axiosError?.response?.status;
          if (status === 401 || status === 403) {
            console.log('Super Admin access session expired or revoked');
            authStore.logout();
          } else {
            console.log('Failed to verify Super Admin access session:', getErrorMessage(error));
          }
          return;
        }
      }

      // If user is already authenticated with a valid access token, verify it's still valid
      // instead of immediately trying to refresh (which can fail if cookie isn't ready yet)
      if (authStore.isAuthenticated && authStore.accessToken) {
        try {
          // Try to verify the existing token by calling /auth/me/
          const directAxios = axios.create({
            baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
            withCredentials: true,
            timeout: API_REQUEST_TIMEOUT_MS,
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
        } catch (error) {
          // Token is invalid, fall through to refresh logic
          const axiosError = getAxiosError(error);
          const status = axiosError?.response?.status;
          if (status === 401 || status === 403) {
            // Token expired, try to refresh
            console.log('Access token expired, attempting refresh...');
          } else {
            // Network or other error, don't try to refresh
            console.log('Failed to verify token (non-auth error):', getErrorMessage(error));
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
          timeout: API_REQUEST_TIMEOUT_MS,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newAccessToken}`
          },
        });
        
        const { data } = await directAxios.get<User>('/auth/me/');
        authStore.login(newAccessToken, data);
        return;
      }
    } catch (error) {
      // The persisted access token in localStorage is stale after a day or
      // a page reload — checking authStore.isAuthenticated here is unreliable.
      // When the refresh endpoint itself responds 401/403 the session is dead;
      // clear it so the user can sign in again cleanly instead of bouncing
      // through a broken "authenticated" state.
      const axiosError = getAxiosError(error);
      const status = axiosError?.response?.status;
      if (status === 401 || status === 403) {
        console.log('Session restoration failed: refresh token invalid or expired');
        useAuthStore.getState().logout();
      } else {
        console.log('Session restoration failed (non-auth error, will retry on next request):', getErrorMessage(error));
        if (authStore.isAuthenticated && authStore.accessToken) {
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
    } catch (error) {
      // Extract error message from response
      const axiosError = getAxiosError(error);
      if (axiosError?.response?.data) {
        const data = axiosError.response.data;
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
