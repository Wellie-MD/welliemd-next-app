import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';

import { authService } from '../auth.service';
import { server } from '@/__tests__/mocks/server';
import { createMockUser, createMockTokens, createMockApiResponse, createMockApiError } from '@/__tests__/utils';

// Mock the token manager
const mockTokenManager = {
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
  getRefreshToken: vi.fn(),
};

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
  tokenManager: mockTokenManager,
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(credentials);

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens).toBeDefined();
      expect(result.permissions).toContain('patient:read:own_data');
      expect(mockTokenManager.setTokens).toHaveBeenCalledWith(
        result.tokens.accessToken,
        result.tokens.refreshToken
      );
    });

    it('should throw error with invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(credentials)).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'New',
        lastName: 'User',
        termsAccepted: true,
      };

      const result = await authService.register(userData);

      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.firstName).toBe('New');
      expect(result.user.lastName).toBe('User');
      expect(result.tokens).toBeDefined();
      expect(mockTokenManager.setTokens).toHaveBeenCalledWith(
        result.tokens.accessToken,
        result.tokens.refreshToken
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockTokenManager.getRefreshToken.mockReturnValue('mock-refresh-token');

      await authService.logout();

      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens even if server logout fails', async () => {
      // Override the default handler to simulate server error
      server.use(
        http.post('http://localhost:3000/api/auth/logout', () => {
          return HttpResponse.json(
            createMockApiError('Server error', 'INTERNAL_ERROR'),
            { status: 500 }
          );
        })
      );

      mockTokenManager.getRefreshToken.mockReturnValue('mock-refresh-token');

      await authService.logout();

      // Should still clear tokens even if server fails
      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const result = await authService.getProfile();

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.email).toBeDefined();
    });

    it('should throw error if not authenticated', async () => {
      // Override the default handler to simulate unauthorized
      server.use(
        http.get('http://localhost:3000/api/auth/me', () => {
          return HttpResponse.json(
            createMockApiError('Authentication required', 'AUTHENTICATION_ERROR'),
            { status: 401 }
          );
        })
      );

      await expect(authService.getProfile()).rejects.toThrow();
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const profileData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      const result = await authService.updateProfile(profileData);

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      await expect(authService.changePassword(passwordData)).resolves.not.toThrow();
    });

    it('should throw error with incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      await expect(authService.changePassword(passwordData)).rejects.toThrow();
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password email', async () => {
      const data = { email: 'test@example.com' };

      await expect(authService.forgotPassword(data)).resolves.not.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const data = {
        token: 'valid-reset-token',
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      await expect(authService.resetPassword(data)).resolves.not.toThrow();
    });

    it('should throw error with invalid token', async () => {
      const data = {
        token: 'invalid-token',
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      await expect(authService.resetPassword(data)).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      mockTokenManager.getRefreshToken.mockReturnValue('valid-refresh-token');

      const result = await authService.refreshToken();

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(mockTokenManager.setTokens).toHaveBeenCalledWith(
        'new-access-token',
        'new-refresh-token'
      );
    });

    it('should throw error with invalid refresh token', async () => {
      mockTokenManager.getRefreshToken.mockReturnValue('invalid-refresh-token');

      await expect(authService.refreshToken()).rejects.toThrow();
    });

    it('should throw error when no refresh token available', async () => {
      mockTokenManager.getRefreshToken.mockReturnValue(null);

      await expect(authService.refreshToken()).rejects.toThrow('No refresh token available');
    });
  });

  describe('authentication state', () => {
    it('should return true if tokens are available', () => {
      // Mock token manager to return tokens
      vi.doMock('@/shared/api/client', () => ({
        tokenManager: {
          getAccessToken: () => 'mock-access-token',
          getRefreshToken: () => 'mock-refresh-token',
        },
      }));

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false if tokens are not available', () => {
      // Mock token manager to return null tokens
      vi.doMock('@/shared/api/client', () => ({
        tokenManager: {
          getAccessToken: () => null,
          getRefreshToken: () => null,
        },
      }));

      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});
