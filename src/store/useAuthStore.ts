// src/store/useAuthStore.ts
import { create } from "zustand";
import {
  login,
  logout,
  getMe,
  requestPasswordReset,
  confirmPasswordReset,
  registerUser,
  refreshToken,
  verifyToken,
} from "@/api/auth";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  fetchMe: () => Promise<void>;
  register: (formData: { email: string; password: string; name: string }) => Promise<void>;
  requestReset: (email: string) => Promise<void>;
  confirmReset: (email: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  loginUser: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Attempting login with:', { email });
      const data = await login(email, password);
      console.log('Login response:', data);
      
      if (!data || !data.access) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem("access_token", data.access);
      if (data.refresh) {
        localStorage.setItem("refresh_token", data.refresh);
      }
      set({ token: data.access });
      await (useAuthStore.getState().fetchMe());
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || "Login failed";
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logoutUser: async () => {
    set({ isLoading: true, error: null });
    try {
      await logout();
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, token: null });
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Logout failed" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMe: async () => {
    try {
      const userData = await getMe();
      set({ user: userData });
    } catch (error) {
      set({ user: null });
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      await registerUser(formData);
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Registration failed" });
    } finally {
      set({ isLoading: false });
    }
  },

  requestReset: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await requestPasswordReset(email);
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Email verification failed" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  confirmReset: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await confirmPasswordReset(email, password);
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Password reset failed" });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
