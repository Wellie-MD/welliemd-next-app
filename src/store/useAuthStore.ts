import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  roles?: string[];
  primary_role?: string;
  permissions?: string[];
  is_superadmin_access?: boolean;
  is_tenant_user?: boolean;
  superadmin_access?: {
    session_id?: string;
    tenant_id?: string;
    portal_type?: string;
    access_mode?: string;
    role?: string;
    target_context?: Record<string, unknown>;
    expires_at?: string;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  superAdminApiBaseUrl: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string;
  login: (accessToken: string, user: User) => void;
  logout: () => void;
  clearExpiredSession: () => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setSuperAdminSession: (apiBaseUrl: string) => void;
  setLoading: (loading: boolean) => void;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (
    uid: string,
    token: string,
    newPassword: string
  ) => Promise<void>;
  register: (credentials: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
}

const scrubLegacySuperAdminSessionToken = (): void => {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem("auth-storage");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.state && "superAdminSessionToken" in parsed.state) {
      delete parsed.state.superAdminSessionToken;
      window.localStorage.setItem("auth-storage", JSON.stringify(parsed));
    }
  } catch {
    // Best-effort cleanup only; broken storage should not block auth boot.
  }
};

scrubLegacySuperAdminSessionToken();

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      superAdminApiBaseUrl: null,
      isAuthenticated: false,
      isLoading: true,
      error: "",

      login: (accessToken, user) =>
        set({
          accessToken,
          superAdminApiBaseUrl: null,
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          accessToken: null,
          superAdminApiBaseUrl: null,
          user: null,
          isAuthenticated: false,
        }),

      clearExpiredSession: () =>
        set({
          accessToken: null,
          superAdminApiBaseUrl: null,
          user: null,
          isAuthenticated: false,
          isLoading: true,
        }),

      setUser: (user) =>
        set({ user, isAuthenticated: !!user, isLoading: false }),
      setAccessToken: (token) => set({ accessToken: token }),
      setSuperAdminSession: (apiBaseUrl) =>
        set({ superAdminApiBaseUrl: apiBaseUrl }),
      setLoading: (loading) => set({ isLoading: loading }),

      requestPasswordReset: async (email: string) => {
        const authService = await import("../services/authService");
        await authService.authService.requestPasswordReset(email);
      },

      confirmPasswordReset: async (
        uid: string,
        token: string,
        newPassword: string
      ) => {
        const authService = await import("../services/authService");
        await authService.authService.confirmPasswordReset(
          uid,
          token,
          newPassword
        );
      },

      register: async (credentials) => {
        set({ isLoading: true, error: "" });
        try {
          const authService = await import("../services/authService");
          await authService.authService.register(credentials);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Registration failed";
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        superAdminApiBaseUrl: state.superAdminApiBaseUrl,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export { useAuthStore };
