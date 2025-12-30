import { AxiosError } from 'axios';
import { ApiErrorResponse } from '../types/auth.types';

/**
 * Authentication error types
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  PASSWORD_TOO_WEAK = 'PASSWORD_TOO_WEAK',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom authentication error class
 */
export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly status?: number;
  public readonly details?: Record<string, string>;

  constructor(
    message: string,
    code: AuthErrorCode = AuthErrorCode.UNKNOWN_ERROR,
    status?: number,
    details?: Record<string, string>
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Error message mappings for user-friendly display
 */
const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password. Please check your credentials and try again.',
  [AuthErrorCode.USER_NOT_FOUND]: 'No account found with this email address.',
  [AuthErrorCode.EMAIL_ALREADY_EXISTS]: 'An account with this email address already exists.',
  [AuthErrorCode.EMAIL_NOT_VERIFIED]: 'Please verify your email address before signing in.',
  [AuthErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
  [AuthErrorCode.TOKEN_INVALID]: 'Invalid authentication token. Please sign in again.',
  [AuthErrorCode.REFRESH_TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
  [AuthErrorCode.ACCOUNT_LOCKED]: 'Your account has been temporarily locked due to multiple failed login attempts.',
  [AuthErrorCode.ACCOUNT_SUSPENDED]: 'Your account has been suspended. Please contact support.',
  [AuthErrorCode.PASSWORD_TOO_WEAK]: 'Password does not meet security requirements.',
  [AuthErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again.',
  [AuthErrorCode.NETWORK_ERROR]: 'Network connection error. Please check your internet connection.',
  [AuthErrorCode.SERVER_ERROR]: 'Server error occurred. Please try again later.',
  [AuthErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
  [AuthErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

/**
 * Parse API error response and convert to AuthError
 */
export const parseAuthError = (error: unknown): AuthError => {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data as ApiErrorResponse | undefined;

    // Network errors
    if (!error.response) {
      return new AuthError(
        ERROR_MESSAGES[AuthErrorCode.NETWORK_ERROR],
        AuthErrorCode.NETWORK_ERROR
      );
    }

    // Parse server error response
    if (data && typeof data === 'object') {
      const errorCode = mapServerErrorToCode(data, status);
      // Prefer server's error message over default (for custom messages like "This email is not registered with us.")
      const message = data.error || data.message || ERROR_MESSAGES[errorCode];

      return new AuthError(message, errorCode, status, data.details);
    }

    // Handle HTTP status codes
    switch (status) {
      case 400:
        return new AuthError(
          ERROR_MESSAGES[AuthErrorCode.VALIDATION_ERROR],
          AuthErrorCode.VALIDATION_ERROR,
          status
        );
      case 401:
        return new AuthError(
          ERROR_MESSAGES[AuthErrorCode.INVALID_CREDENTIALS],
          AuthErrorCode.INVALID_CREDENTIALS,
          status
        );
      case 403:
        return new AuthError(
          ERROR_MESSAGES[AuthErrorCode.ACCOUNT_SUSPENDED],
          AuthErrorCode.ACCOUNT_SUSPENDED,
          status
        );
      case 404:
        return new AuthError(
          ERROR_MESSAGES[AuthErrorCode.USER_NOT_FOUND],
          AuthErrorCode.USER_NOT_FOUND,
          status
        );
      case 429:
        return new AuthError(
          ERROR_MESSAGES[AuthErrorCode.RATE_LIMIT_EXCEEDED],
          AuthErrorCode.RATE_LIMIT_EXCEEDED,
          status
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return new AuthError(
          ERROR_MESSAGES[AuthErrorCode.SERVER_ERROR],
          AuthErrorCode.SERVER_ERROR,
          status
        );
      default:
        return new AuthError(
          ERROR_MESSAGES[AuthErrorCode.UNKNOWN_ERROR],
          AuthErrorCode.UNKNOWN_ERROR,
          status
        );
    }
  }

  // Handle AuthError instances
  if (error instanceof AuthError) {
    return error;
  }

  // Handle generic Error instances
  if (error instanceof Error) {
    return new AuthError(error.message, AuthErrorCode.UNKNOWN_ERROR);
  }

  // Handle unknown error types
  return new AuthError(
    ERROR_MESSAGES[AuthErrorCode.UNKNOWN_ERROR],
    AuthErrorCode.UNKNOWN_ERROR
  );
};

/**
 * Map server error codes to AuthErrorCode
 */
const mapServerErrorToCode = (errorData: ApiErrorResponse, status?: number): AuthErrorCode => {
  const code = errorData.code?.toLowerCase();
  const message = errorData.message?.toLowerCase();

  // Map based on error code
  if (code) {
    switch (code) {
      case 'invalid_credentials':
      case 'authentication_failed':
        return AuthErrorCode.INVALID_CREDENTIALS;
      case 'user_not_found':
        return AuthErrorCode.USER_NOT_FOUND;
      case 'email_already_exists':
      case 'user_already_exists':
        return AuthErrorCode.EMAIL_ALREADY_EXISTS;
      case 'email_not_verified':
        return AuthErrorCode.EMAIL_NOT_VERIFIED;
      case 'token_expired':
        return AuthErrorCode.TOKEN_EXPIRED;
      case 'token_invalid':
        return AuthErrorCode.TOKEN_INVALID;
      case 'refresh_token_expired':
        return AuthErrorCode.REFRESH_TOKEN_EXPIRED;
      case 'account_locked':
        return AuthErrorCode.ACCOUNT_LOCKED;
      case 'account_suspended':
        return AuthErrorCode.ACCOUNT_SUSPENDED;
      case 'password_too_weak':
        return AuthErrorCode.PASSWORD_TOO_WEAK;
      case 'rate_limit_exceeded':
        return AuthErrorCode.RATE_LIMIT_EXCEEDED;
      case 'validation_error':
        return AuthErrorCode.VALIDATION_ERROR;
    }
  }

  // Map based on message content
  if (message) {
    if (message.includes('credential') || message.includes('password')) {
      return AuthErrorCode.INVALID_CREDENTIALS;
    }
    if (message.includes('not found')) {
      return AuthErrorCode.USER_NOT_FOUND;
    }
    if (message.includes('already exists')) {
      return AuthErrorCode.EMAIL_ALREADY_EXISTS;
    }
    if (message.includes('expired')) {
      return AuthErrorCode.TOKEN_EXPIRED;
    }
    if (message.includes('invalid')) {
      return AuthErrorCode.TOKEN_INVALID;
    }
  }

  // Fallback based on status code
  switch (status) {
    case 401:
      return AuthErrorCode.INVALID_CREDENTIALS;
    case 403:
      return AuthErrorCode.ACCOUNT_SUSPENDED;
    case 404:
      return AuthErrorCode.USER_NOT_FOUND;
    case 429:
      return AuthErrorCode.RATE_LIMIT_EXCEEDED;
    case 500:
      return AuthErrorCode.SERVER_ERROR;
    default:
      return AuthErrorCode.UNKNOWN_ERROR;
  }
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  const authError = parseAuthError(error);
  return authError.message;
};

/**
 * Check if error is recoverable (user can retry)
 */
export const isRecoverableError = (error: AuthError): boolean => {
  const recoverableErrors = [
    AuthErrorCode.NETWORK_ERROR,
    AuthErrorCode.SERVER_ERROR,
    AuthErrorCode.RATE_LIMIT_EXCEEDED,
  ];

  return recoverableErrors.includes(error.code);
};

/**
 * Check if error requires user action
 */
export const requiresUserAction = (error: AuthError): boolean => {
  const actionRequiredErrors = [
    AuthErrorCode.INVALID_CREDENTIALS,
    AuthErrorCode.EMAIL_NOT_VERIFIED,
    AuthErrorCode.PASSWORD_TOO_WEAK,
    AuthErrorCode.VALIDATION_ERROR,
  ];

  return actionRequiredErrors.includes(error.code);
};

/**
 * Check if error should redirect to login
 */
export const shouldRedirectToLogin = (error: AuthError): boolean => {
  const redirectErrors = [
    AuthErrorCode.TOKEN_EXPIRED,
    AuthErrorCode.TOKEN_INVALID,
    AuthErrorCode.REFRESH_TOKEN_EXPIRED,
  ];

  return redirectErrors.includes(error.code);
};

/**
 * Get error severity level
 */
export const getErrorSeverity = (error: AuthError): 'low' | 'medium' | 'high' | 'critical' => {
  switch (error.code) {
    case AuthErrorCode.VALIDATION_ERROR:
    case AuthErrorCode.PASSWORD_TOO_WEAK:
      return 'low';

    case AuthErrorCode.INVALID_CREDENTIALS:
    case AuthErrorCode.USER_NOT_FOUND:
    case AuthErrorCode.EMAIL_ALREADY_EXISTS:
    case AuthErrorCode.EMAIL_NOT_VERIFIED:
    case AuthErrorCode.RATE_LIMIT_EXCEEDED:
      return 'medium';

    case AuthErrorCode.TOKEN_EXPIRED:
    case AuthErrorCode.TOKEN_INVALID:
    case AuthErrorCode.REFRESH_TOKEN_EXPIRED:
    case AuthErrorCode.NETWORK_ERROR:
      return 'high';

    case AuthErrorCode.ACCOUNT_LOCKED:
    case AuthErrorCode.ACCOUNT_SUSPENDED:
    case AuthErrorCode.SERVER_ERROR:
    case AuthErrorCode.UNKNOWN_ERROR:
      return 'critical';

    default:
      return 'medium';
  }
};
