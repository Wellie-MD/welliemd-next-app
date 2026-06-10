import { apiClient } from '@/shared/api/client';
import { tokenManager } from './token-manager';
import { ApiSuccessResponse, RequestConfig } from '@/shared/api/types';
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
} from '../types/auth.types';

// Extend AxiosRequestConfig with our custom properties
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
  }
}

/**
 * Authentication service handling all auth-related API calls
 * This service provides type-safe methods with Zod validation
 */
export class AuthService {
  private static instance: AuthService;

  private constructor() {}



  private getPersistedAccessToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const raw = window.localStorage.getItem('auth-store');
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      const accessToken = parsed?.state?.tokens?.accessToken;
      return typeof accessToken === 'string' && accessToken.trim() ? accessToken : null;
    } catch {
      return null;
    }
  }

  private getActiveAccessToken(): string | null {
    return tokenManager.getAccessToken() || this.getPersistedAccessToken();
  }

  /** Normalize email to lowercase for case-insensitive auth (RFC 5321). */
  private static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

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

    const config: RequestConfig = {
      withCredentials: true, // Important for cookies
      skipAuth: true, // Skip auth for login request
    };

    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      {
        email: AuthService.normalizeEmail(credentials.email),
        password: credentials.password,
        portal: credentials.portal || 'patient', // Default to 'patient' if not provided
      },
      config
    );

    // The refresh token is in an HTTP-only cookie
    // The access token is in the response body
    const validatedData = LoginResponseSchema.parse(response.data);
    
    // Store the access token in memory
    tokenManager.setAccessToken(validatedData.access);

    return validatedData;
  }

  /**
   * Login via impersonation token
   */
  async impersonateLogin(token: string): Promise<LoginResponse> {
    debugLog('AuthService.impersonateLogin');

    const config: RequestConfig = {
      withCredentials: true,
      skipAuth: true,
    };

    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.IMPERSONATE_LOGIN,
      { token },
      config
    );

    const validatedData = LoginResponseSchema.parse(response.data);
    tokenManager.setAccessToken(validatedData.access);

    return validatedData;
  }

  /**
   * End impersonation session
   */
  async endImpersonation(): Promise<void> {
    debugLog('AuthService.endImpersonation');

    const config: RequestConfig = {
      withCredentials: true,
      skipAuth: false,
    };

    try {
      await apiClient.post(
        API_ENDPOINTS.AUTH.END_IMPERSONATION,
        {},
        config
      );
    } catch (error) {
      debugLog('Error ending impersonation:', error);
    } finally {
      tokenManager.clearTokens();
    }
  }

  /**
   * Register new user account
   */
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    debugLog('AuthService.register:', { email: userData.email });

    const config: RequestConfig = {
      withCredentials: true, // For cookies
      skipAuth: true, // Skip auth for register request
    };

    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      {
        email: AuthService.normalizeEmail(userData.email),
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phoneNumber,
      },
      config
    );

    // The refresh token is in an HTTP-only cookie
    // The access token is in the response body
    const validatedData = LoginResponseSchema.parse(response.data);
    
    // Store the access token in memory
    tokenManager.setAccessToken(validatedData.access);

    return validatedData;
  }

  /**
   * Logout user and clear tokens
   */
  async logout(): Promise<void> {
    debugLog('AuthService.logout');
    
    const config: RequestConfig = {
      withCredentials: true,
      skipAuth: false, // We need the access token for this request
    };
    
    try {
      // Call the logout endpoint to invalidate the refresh token
      // The refresh token will be cleared from the cookie by the server
      await apiClient.post(
        API_ENDPOINTS.AUTH.LOGOUT, 
        {}, 
        config
      );
    } catch (error) {
      debugLog('Error during logout:', error);
      // Continue with clearing local state even if the server request fails
    } finally {
      // Clear the access token from memory
      tokenManager.clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    debugLog('AuthService.getCurrentUser');

    const accessToken = this.getActiveAccessToken();

    const response = await apiClient.get(
      API_ENDPOINTS.AUTH.ME,
      { 
        withCredentials: true, // Include cookies for auth
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        }
      }
    );
    return UserSchema.parse(response.data);
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    debugLog('AuthService.updateProfile:', profileData);

    const accessToken = this.getActiveAccessToken();

    const response = await apiClient.patch<ApiSuccessResponse<User>>(
      '/auth/profile',
      profileData,
      {
        headers: {
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        }
      }
    );

    const validatedData = UserSchema.parse(response.data.data);

    return validatedData;
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    debugLog('AuthService.changePassword');

    await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
      confirm_password: passwordData.confirmPassword,
    });
  }

  /**
   * Request password reset email
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    debugLog('AuthService.forgotPassword:', { email: data.email });

    await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, {
      ...data,
      portal: data.portal || 'patient',
      email: AuthService.normalizeEmail(data.email),
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    debugLog('AuthService.resetPassword', { uid: data.uid, hasToken: !!data.token });

    // Map client schema to API schema
    await apiClient.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, {
      uid: data.uid,
      token: data.token,
      new_password: data.password,
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<TokenRefreshResponse> {
    debugLog('AuthService.refreshToken');
    
    try {
      // Use the token manager to handle the refresh
      const accessToken = await tokenManager.refreshAccessToken();
      
      // Return the token in the expected format
      const response: TokenRefreshResponse = {
        access: accessToken,
      };
      
      return TokenRefreshResponseSchema.parse(response);
    } catch (error) {
      debugLog('Failed to refresh token:', error);
      throw error;
    }
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
    // We only need to check for access token since refresh token is in HTTP-only cookie.
    // Fall back to the persisted Zustand snapshot during app reload before hydration
    // restores the in-memory token manager.
    const accessToken = this.getActiveAccessToken();
    return !!accessToken;
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
  // Note: We don't need to expose getRefreshToken anymore
  // as it's now handled via HTTP-only cookies

  /**
   * Clear all stored authentication data
   */
  clearAuthData(): void {
    tokenManager.clearTokens();
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
