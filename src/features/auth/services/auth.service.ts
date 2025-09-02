import { apiClient, tokenManager } from '@/shared/api/client';
import { ApiSuccessResponse } from '@/shared/api/types';
import { debugLog } from '@/config/env';
import { API_ENDPOINTS } from '@/config/constants';

import {
  LoginRequest,
  LoginResponse,
  LoginResponseSchema,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
  UserSchema,
  TokenRefreshResponse,
  TokenRefreshResponseSchema,
  PaginatedUserResponseSchema,
} from '../types/auth.types';

/**
 * Authentication service handling all auth-related API calls
 * This service provides type-safe methods with Zod validation
 */
export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    debugLog('AuthService.login:', { email: credentials.email });

    const response = await apiClient.post(
      API_ENDPOINTS.AUTH.LOGIN,
      {
        email: credentials.email,
        password: credentials.password,
      }
    );

    // Validate response with Zod - API returns tokens directly
    const validatedData = LoginResponseSchema.parse(response.data);

    // Store tokens using the actual API field names
    tokenManager.setTokens(validatedData.access, validatedData.refresh);

    return validatedData;
  }

  /**
   * Register new user account
   */
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    debugLog('AuthService.register:', { email: userData.email });

    // Note: The API spec doesn't show a register endpoint, 
    // so we'll assume it follows similar pattern to login
    const response = await apiClient.post(
      '/auth/register/', // Assuming this endpoint exists
      {
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phoneNumber,
      }
    );

    const validatedData = LoginResponseSchema.parse(response.data);

    // Store tokens after successful registration
    tokenManager.setTokens(validatedData.access, validatedData.refresh);

    return validatedData;
  }

  /**
   * Logout user and clear tokens
   */
  async logout(): Promise<void> {
    debugLog('AuthService.logout');

    try {
      // Call logout endpoint to invalidate refresh token on server
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      // Even if server logout fails, we should clear local tokens
      debugLog('Server logout failed, clearing tokens anyway:', error);
    } finally {
      // Always clear local tokens
      tokenManager.clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    debugLog('AuthService.getProfile');

    const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);

    // API returns paginated response
    const paginatedResponse = PaginatedUserResponseSchema.parse(response.data);
    
    if (paginatedResponse.results.length === 0) {
      throw new Error('User profile not found');
    }

    const user = paginatedResponse.results[0];
    if (!user) {
      throw new Error('User profile not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    debugLog('AuthService.updateProfile:', profileData);

    const response = await apiClient.patch<ApiSuccessResponse<User>>(
      '/auth/profile',
      profileData
    );

    const validatedData = UserSchema.parse(response.data.data);

    return validatedData;
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    debugLog('AuthService.changePassword');

    await apiClient.post('/auth/change-password', passwordData);
  }

  /**
   * Request password reset email
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    debugLog('AuthService.forgotPassword:', { email: data.email });

    await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, data);
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    debugLog('AuthService.resetPassword');

    // Map client schema to API schema
    await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, {
      uid: data.token, // Assuming token contains UID
      token: data.token,
      new_password: data.password,
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<TokenRefreshResponse> {
    debugLog('AuthService.refreshToken');

    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post(API_ENDPOINTS.AUTH.TOKEN_REFRESH, {
      refresh: refreshToken,
    });

    const validatedData = TokenRefreshResponseSchema.parse(response.data);

    // Update stored tokens
    tokenManager.setTokens(validatedData.access, validatedData.refresh);

    return validatedData;
  }

  /**
   * Verify if a token is valid
   */
  async verifyToken(token?: string): Promise<boolean> {
    debugLog('AuthService.verifyToken');

    const tokenToVerify = token || tokenManager.getAccessToken();
    if (!tokenToVerify) {
      return false;
    }

    try {
      await apiClient.post(API_ENDPOINTS.AUTH.TOKEN_VERIFY, {
        token: tokenToVerify,
      });
      return true;
    } catch (error) {
      debugLog('AuthService.verifyToken: token is invalid', error);
      return false;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    debugLog('AuthService.verifyEmail');

    await apiClient.post('/auth/verify-email', { token });
  }

  /**
   * Resend email verification
   */
  async resendVerification(): Promise<void> {
    debugLog('AuthService.resendVerification');

    await apiClient.post('/auth/resend-verification');
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  isAuthenticated(): boolean {
    const accessToken = tokenManager.getAccessToken();
    const refreshToken = tokenManager.getRefreshToken();
    
    return !!(accessToken && refreshToken);
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return tokenManager.getAccessToken();
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return tokenManager.getRefreshToken();
  }

  /**
   * Clear all stored authentication data
   */
  clearAuthData(): void {
    tokenManager.clearTokens();
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

