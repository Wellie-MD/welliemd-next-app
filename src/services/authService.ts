import axios from 'axios';
import api from '../api/axiosInstance';
import { useAuthStore, type AuthUser } from '../store/useAuthStore';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

interface RegisterResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

interface RefreshResponse {
  access: string;
  refresh: string;
  user_id: string;
}

interface ApiErrorPayload {
  email?: string[];
  current_password?: string[];
  new_password?: string[];
  non_field_errors?: string[];
  detail?: string;
  message?: string;
}

interface RefreshedSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

class AuthIdentityMismatchError extends Error {
  constructor(context: string) {
    super(`Authenticated identity mismatch during ${context}`);
    this.name = 'AuthIdentityMismatchError';
  }
}

let refreshPromise: Promise<RefreshedSession> | null = null;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const getApiErrorData = (error: unknown): ApiErrorPayload | undefined =>
  axios.isAxiosError<ApiErrorPayload>(error) ? error.response?.data : undefined;

const describeError = (error: unknown): unknown =>
  getApiErrorData(error) || (error instanceof Error ? error.message : error);

const assertSameIdentity = (
  expectedUserId: string | undefined,
  actualUserId: string,
  context: string,
) => {
  if (expectedUserId && expectedUserId !== actualUserId) {
    throw new AuthIdentityMismatchError(context);
  }
};

const fetchProfileWithToken = async (accessToken: string): Promise<AuthUser> => {
  const directAxios = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  const { data } = await directAxios.get<AuthUser>('/auth/me/');
  return data;
};

const performRefresh = async (refreshToken: string): Promise<RefreshedSession> => {
  const refreshAxios = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });
  const { data } = await refreshAxios.post<RefreshResponse>('/auth/token/refresh/', {
    refresh: refreshToken,
  });
  if (!data.access || !data.refresh || !data.user_id) {
    throw new Error('Refresh response did not include an access token and user identity');
  }
  return { accessToken: data.access, refreshToken: data.refresh, userId: data.user_id };
};

const getRefreshedSession = async (refreshToken: string): Promise<RefreshedSession> => {
  if (!refreshPromise) {
    refreshPromise = performRefresh(refreshToken).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthUser> => {
    const { data } = await api.post<LoginResponse>('/auth/login/', {
      ...credentials,
      email: normalizeEmail(credentials.email),
      portal: 'admin',
    });
    const { access: accessToken, refresh: refreshToken } = data;

    // Put token in store first so /auth/me/ request includes Authorization.
    // Always load profile from /auth/me/ so the UI matches the JWT identity
    // (full UserSerializer: full_name, avatar_url, etc.) — not the login payload alone.
    useAuthStore.getState().setAccessToken(accessToken);
    try {
      const { data: profile } = await api.get<AuthUser>('/auth/me/');
      assertSameIdentity(data.user.id, profile.id, 'login');
      useAuthStore.getState().login(accessToken, refreshToken, profile);
      return profile;
    } catch (e) {
      useAuthStore.getState().logout();
      throw e;
    }
  },

  register: async (credentials: RegisterCredentials): Promise<AuthUser> => {
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

      useAuthStore.getState().setAccessToken(data.access);
      try {
        const { data: profile } = await api.get<AuthUser>('/auth/me/');
        assertSameIdentity(data.user.id, profile.id, 'registration');
        useAuthStore.getState().login(data.access, data.refresh, profile);
        return profile;
      } catch (e) {
        useAuthStore.getState().logout();
        throw e;
      }
    } catch (error: unknown) {
      const errorData = getApiErrorData(error);
      console.error('Registration error:', errorData);

      if (errorData) {
        const data = errorData;
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
      const refreshToken = useAuthStore.getState().refreshToken;
      await api.post('/auth/logout/', refreshToken ? { refresh: refreshToken } : {});
    } catch (error) {
      console.error('Logout failed, clearing client-side state anyway.', error);
    } finally {
      useAuthStore.getState().logout();
    }
  },

  refreshAccessToken: async (expectedUserId?: string): Promise<string | null> => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) throw new Error('No tab refresh token available');
      const refreshed = await getRefreshedSession(refreshToken);
      assertSameIdentity(expectedUserId, refreshed.userId, 'token refresh');
      useAuthStore.getState().setAccessToken(refreshed.accessToken);
      useAuthStore.getState().setRefreshToken(refreshed.refreshToken);
      return refreshed.accessToken;
    } catch (error: unknown) {
      console.error('Token refresh failed:', describeError(error));
      useAuthStore.getState().logout();
      throw error;
    }
  },

  getMe: async (throwOnError = false): Promise<AuthUser | null> => {
    try {
      const { data } = await api.get<AuthUser>('/auth/me/');
      useAuthStore.getState().setUser(data);
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        useAuthStore.getState().logout();

        if (throwOnError) {
          throw error;
        }
      }
      return null;
    }
  },

  // Restore authentication state on app initialization
  hydrateAuth: async (expectedUserId?: string): Promise<boolean> => {
    const { setHydratingState } = await import('../api/axiosInstance');
    setHydratingState(true);

    const authStore = useAuthStore.getState();
    authStore.setLoading(true);

    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) throw new Error('No tab refresh token available');
      const refreshed = await getRefreshedSession(refreshToken);
      assertSameIdentity(expectedUserId, refreshed.userId, 'session hydration');
      const profile = await fetchProfileWithToken(refreshed.accessToken);
      assertSameIdentity(refreshed.userId, profile.id, 'profile hydration');
      authStore.login(refreshed.accessToken, refreshed.refreshToken, profile);
      return true;
    } catch (error: unknown) {
      console.log(
        'Session restoration failed:',
        error instanceof Error ? error.message : 'Unknown authentication error',
      );
      if (error instanceof AuthIdentityMismatchError) {
        try {
          window.sessionStorage.setItem(
            'welliemd-admin-auth-message',
            'Your admin session changed. Please sign in again.',
          );
        } catch {
          // The sign-in redirect still occurs when storage is unavailable.
        }
      }
    } finally {
      setHydratingState(false);
      authStore.setLoading(false);
    }

    // If refresh failed, ensure clean logout
    authStore.logout();
    return false;
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
    } catch (error: unknown) {
      // Extract error message from response
      const errorData = getApiErrorData(error);
      if (errorData) {
        const data = errorData;
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
