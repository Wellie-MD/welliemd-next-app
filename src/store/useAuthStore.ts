// src/store/useAuthStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authService } from "@/services/authService";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // To handle initial auth check
  error: string; // Changed from string | null
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (uid: string, token: string, newPassword: string) => Promise<void>;
  register: (credentials: { name: string; email: string; password: string }) => Promise<void>;
}

export const useAuthStore = create(
  persist<AuthState>(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true, // Start in loading state until hydration is complete
      error: "", // Initialize to empty string
      
      login: (accessToken, refreshToken, user) =>
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        }),

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      setLoading: (loading) => set({ isLoading: loading }),

      // Password reset functions
      requestPasswordReset: async (email: string) => {
        await authService.requestPasswordReset(email);
      },
      
      confirmPasswordReset: async (uid: string, token: string, newPassword: string) => {
        await authService.confirmPasswordReset(uid, token, newPassword);
      },

      register: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          await authService.register(credentials);
          // No need to set anything here as authService.register already calls login
        } catch (error: any) {
          const errorMessage = error.message || 'Registration failed';
          set({ error: errorMessage });
          // Do not re-throw error here, let the component handle it via the 'error' state
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage", // Key in localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ refreshToken: state.refreshToken }), // Only persist the refresh token
    }
  )
);
