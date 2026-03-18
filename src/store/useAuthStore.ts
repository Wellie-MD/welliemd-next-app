import { create } from "zustand";
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string;
  login: (accessToken: string, user: User) => void;
  logout: () => void;
  clearExpiredSession: () => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (uid: string, token: string, newPassword: string) => Promise<void>;
  register: (credentials: { name: string; email: string; password: string }) => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      error: "",

      login: (accessToken, user) =>
        set({
          accessToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          accessToken: null,
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
        } catch (error: any) {
          const errorMessage = error.message || 'Registration failed';
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export { useAuthStore };
