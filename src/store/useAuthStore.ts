import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  permissions?: string[];
  roles?: string[];
  primary_role?: string;
  is_platform_owner?: boolean;
  can_access_cross_tenant_access_users?: boolean;
  can_deactivate_cross_tenant_access_users?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  clearExpiredSession: () => void;
  setUser: (user: AuthUser) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (uid: string, token: string, newPassword: string) => Promise<void>;
  register: (credentials: { name: string; email: string; password: string }) => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist((set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: "",

      login: (accessToken, refreshToken, user) =>
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),

      clearExpiredSession: () =>
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
          isLoading: true,
        }),

      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      setLoading: (loading) => set({ isLoading: loading }),

      requestPasswordReset: async (email: string) => {
        const authService = await import('../services/authService');
        await authService.authService.requestPasswordReset(email);
      },

      confirmPasswordReset: async (uid: string, token: string, newPassword: string) => {
        const authService = await import('../services/authService');
        await authService.authService.confirmPasswordReset(uid, token, newPassword);
      },

      register: async (credentials) => {
        set({ isLoading: true, error: "" });
        try {
          const authService = await import('../services/authService');
          await authService.authService.register(credentials);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'admin-auth-storage-v2',
      // Auth must be shared by tabs so opening the admin portal in a new tab
      // can hydrate the existing session.
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export { useAuthStore };
