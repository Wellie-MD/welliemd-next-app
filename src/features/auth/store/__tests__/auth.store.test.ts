import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useAuthStore } from '../auth.store';
import { authService } from '../../services/auth.service';
import { createMockUser, createMockTokens } from '@/__tests__/utils';

// Mock the auth service
vi.mock('../../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
  },
}));

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.setState({
      user: null,
      tokens: null,
      permissions: [],
      features: {},
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.permissions).toEqual([]);
      expect(result.current.features).toEqual({});
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should handle successful login', async () => {
      const mockUser = createMockUser();
      const mockTokens = createMockTokens();
      const mockResponse = {
        user: mockUser,
        tokens: mockTokens,
        permissions: ['patient:read:own_data'],
        features: { ENABLE_TELEMEDICINE: true },
      };

      vi.mocked(authService.login).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.tokens).toEqual(mockTokens);
      expect(result.current.permissions).toEqual(['patient:read:own_data']);
      expect(result.current.features).toEqual({ ENABLE_TELEMEDICINE: true });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle login failure', async () => {
      const mockError = new Error('Invalid credentials');
      vi.mocked(authService.login).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrongpassword',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });

    it('should set loading state during login', async () => {
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });

      vi.mocked(authService.login).mockReturnValue(loginPromise);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLogin!({
          user: createMockUser(),
          tokens: createMockTokens(),
          permissions: [],
          features: {},
        });
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should handle successful logout', async () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: createMockUser(),
        tokens: createMockTokens(),
        permissions: ['patient:read:own_data'],
        features: {},
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      vi.mocked(authService.logout).mockResolvedValue();

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.permissions).toEqual([]);
      expect(result.current.features).toEqual({});
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should clear state even if logout service fails', async () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: createMockUser(),
        tokens: createMockTokens(),
        permissions: ['patient:read:own_data'],
        features: {},
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      vi.mocked(authService.logout).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      // Should still clear state even if service fails
      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('permission checking', () => {
    beforeEach(() => {
      useAuthStore.setState({
        permissions: [
          'patient:read:own_data',
          'patient:view:appointments',
          'patient:book:appointments',
        ],
      });
    });

    it('should check single permission correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.hasPermission('patient:read:own_data')).toBe(true);
      expect(result.current.hasPermission('admin:manage:users')).toBe(false);
    });

    it('should check any permissions correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(
        result.current.hasAnyPermission([
          'patient:read:own_data',
          'admin:manage:users',
        ])
      ).toBe(true);

      expect(
        result.current.hasAnyPermission([
          'admin:manage:users',
          'provider:view:patients',
        ])
      ).toBe(false);
    });

    it('should check all permissions correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(
        result.current.hasAllPermissions([
          'patient:read:own_data',
          'patient:view:appointments',
        ])
      ).toBe(true);

      expect(
        result.current.hasAllPermissions([
          'patient:read:own_data',
          'admin:manage:users',
        ])
      ).toBe(false);
    });
  });

  describe('feature flag checking', () => {
    beforeEach(() => {
      useAuthStore.setState({
        features: {
          ENABLE_TELEMEDICINE: true,
          ENABLE_NEW_DASHBOARD: false,
        },
      });
    });

    it('should check feature flags correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isFeatureEnabled('ENABLE_TELEMEDICINE')).toBe(true);
      expect(result.current.isFeatureEnabled('ENABLE_NEW_DASHBOARD')).toBe(false);
      expect(result.current.isFeatureEnabled('NON_EXISTENT_FEATURE')).toBe(false);
    });
  });

  describe('profile management', () => {
    it('should update profile successfully', async () => {
      const mockUser = createMockUser();
      const updatedUser = { ...mockUser, firstName: 'Updated' };

      useAuthStore.setState({ user: mockUser });
      vi.mocked(authService.updateProfile).mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.updateProfile({ firstName: 'Updated' });
      });

      expect(result.current.user).toEqual(updatedUser);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle profile update failure', async () => {
      const mockError = new Error('Update failed');
      vi.mocked(authService.updateProfile).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.updateProfile({ firstName: 'Updated' });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('error handling', () => {
    it('should clear error', () => {
      useAuthStore.setState({ error: 'Some error' });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
