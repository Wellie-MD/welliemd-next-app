import api from '../api/axiosInstance';
import { useAuthStore } from '../store/useAuthStore';

// Define the shape of credentials for clarity
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

// Define the shape of the user object
interface User {
  id: string;
  email: string;
  name: string;
  // Add other user properties as needed
}

interface RegisterResponse {
  access: string;
  refresh: string;
  user: User;
}

// Define the login response from the backend
interface LoginResponse {
  access: string;
  refresh: string; // Add refresh token to the response
  user: User;
}

interface RefreshResponse {
  access: string;
  refresh?: string; // The new refresh token is optional, but expected if rotation is enabled
}

/**
 * This promise is used to prevent multiple token refresh requests from being sent simultaneously.
 * When a token refresh is in progress, subsequent requests will wait for this promise to resolve.
 */
let refreshPromise: Promise<string | null> | null = null;

/**
 * The authService provides methods for interacting with the backend authentication endpoints.
 */
export const authService = {
  /**
   * Logs the user in. On success, it sets the user and both tokens in the Zustand store.
   * The refresh token is persisted to localStorage by the store.
   * @param credentials - The user's email and password.
   */
  login: async (credentials: LoginCredentials): Promise<User> => {
    const { data } = await api.post<LoginResponse>('/auth/login/', credentials);
    const { access: accessToken, refresh: refreshToken, user } = data;
    
    // Set state in Zustand store, now including the refresh token
    useAuthStore.getState().login(accessToken, refreshToken, user);
    
    return user;
  },

  /**
   * Registers a new user with the provided credentials
   * @param credentials - The user's registration details
   */
  register: async (credentials: RegisterCredentials): Promise<User> => {
    // Client-side validation - these errors will be thrown directly and caught by useAuthStore
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
      
      // Set state in Zustand store after successful registration
      useAuthStore.getState().login(data.access, data.refresh, data.user);
      
      return data.user;
    } catch (error: any) {
      console.error('Registration error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });

      // Handle Axios errors with a response from the backend
      if (error.response?.data) {
        const data = error.response.data;
        if (data.email && Array.isArray(data.email) && data.email.length > 0) {
          throw new Error(data.email[0]);
        } else if (data.detail) {
          throw new Error(data.detail);
        } else if (data.message) {
          throw new Error(data.message);
        } else if (typeof data === 'string') {
          throw new Error(data);
        } else {
          throw new Error(JSON.stringify(data));
        }
      } else {
        // Re-throw original error for client-side validation or network errors
        throw error;
      }
    }
  },

  /**
   * Logs the user out by calling the backend endpoint and clearing the local auth state.
   */
  logout: async (): Promise<void> => {
    try {
      // Optional: Inform the backend to invalidate the refresh token
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout failed, clearing client-side state anyway.', error);
    } finally {
      // Always clear client-side state
      useAuthStore.getState().logout();
    }
  },

  /**
   * Refreshes the access token using the persisted refresh token.
   * This function now handles refresh token rotation from the backend.
   */
  refreshAccessToken: async (): Promise<string | null> => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      // If there's no refresh token, we can't refresh.
      useAuthStore.getState().logout();
      return null;
    }

    // Use the single-flight promise to avoid race conditions
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const { data } = await api.post<RefreshResponse>('/auth/token/refresh/', {
            refresh: refreshToken,
          });
          const newAccessToken = data.access;
          const newRefreshToken = data.refresh;

          if (newAccessToken) {
            useAuthStore.getState().setAccessToken(newAccessToken);
            // If the backend sent a new refresh token, update it in the store
            if (newRefreshToken) {
              useAuthStore.getState().setRefreshToken(newRefreshToken);
            }
            return newAccessToken;
          }
          throw new Error('No new access token received');
        } catch (error) {
          console.error('Token refresh failed:', error);
          // If refresh fails, log the user out completely
          useAuthStore.getState().logout();
          throw error; // Re-throw to be caught by the caller
        } finally {
          // Reset the promise after completion
          refreshPromise = null;
        }
      })();
    }
    
    await refreshPromise;
    return useAuthStore.getState().accessToken;
  },

  /**
   * Fetches the current user's data from the backend.
   * This is used to hydrate the auth state when the app loads.
   */
  getMe: async (): Promise<User | null> => {
    try {
      const { data } = await api.get<User>('/auth/me/');
      useAuthStore.getState().setUser(data);
      return data;
    } catch (error) {
      console.warn('Could not fetch user. User may not be logged in.');
      // It's not an error if the user isn't logged in, so we clear the state.
      useAuthStore.getState().logout();
      return null;
    }
  },
  
  /**
   * Hydrates the auth state on application startup.
   * It checks for a persisted refresh token and uses it to get a new access token and user data.
   */
  hydrateAuth: async (): Promise<void> => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().setLoading(false);
      return; // No token, nothing to do.
    }

    try {
      const newAccessToken = await authService.refreshAccessToken();
      if (newAccessToken) {
        await authService.getMe();
      }
    } catch (error) {
      // This is expected if the refresh token is expired or invalid.
      // The refreshAccessToken function already handles logout.
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  },

  /**
   * Requests a password reset for the given email address.
   * @param email - The email address of the user requesting the reset
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/auth/password-reset/request/', { email });
  },

  /**
   * Confirms a password reset using the token and uid from the email link.
   * @param uid - The user ID from the reset link
   * @param token - The reset token from the reset link
   * @param newPassword - The new password to set
   */
  confirmPasswordReset: async (uid: string, token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/password-reset/confirm/', {
      uid,
      token,
      new_password: newPassword,
      confirm_password: newPassword
    });
  },
};
