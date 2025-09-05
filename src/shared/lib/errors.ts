import { ApiErrorCode } from '@/shared/api/types';

/**
 * Base error class for application errors
 */
export abstract class AppError extends Error {
  abstract readonly name: string;
  abstract readonly code: string;
  
  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      metadata: this.metadata,
      stack: this.stack,
    };
  }
}

/**
 * Authentication related errors
 */
export class AuthError extends AppError {
  readonly name = 'AuthError';
  readonly code = ApiErrorCode.AUTHENTICATION_ERROR;

  constructor(message = 'Authentication failed', originalError?: Error, metadata?: Record<string, unknown>) {
    super(message, originalError, metadata);
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Authorization related errors
 */
export class AuthorizationError extends AppError {
  readonly name = 'AuthorizationError';
  readonly code = ApiErrorCode.AUTHORIZATION_ERROR;

  constructor(message = 'Access denied', originalError?: Error, metadata?: Record<string, unknown>) {
    super(message, originalError, metadata);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Validation related errors
 */
export class ValidationError extends AppError {
  readonly name = 'ValidationError';
  readonly code = ApiErrorCode.VALIDATION_ERROR;

  constructor(
    message = 'Validation failed',
    public readonly validationErrors?: Record<string, string[]>,
    originalError?: Error
  ) {
    super(message, originalError, { validationErrors });
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Network related errors
 */
export class NetworkError extends AppError {
  readonly name = 'NetworkError';
  readonly code = ApiErrorCode.NETWORK_ERROR;

  constructor(message = 'Network error occurred', originalError?: Error, metadata?: Record<string, unknown>) {
    super(message, originalError, metadata);
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  readonly name = 'NotFoundError';
  readonly code = ApiErrorCode.NOT_FOUND;

  constructor(resource = 'Resource', originalError?: Error, metadata?: Record<string, unknown>) {
    super(`${resource} not found`, originalError, metadata);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict errors (e.g., duplicate resources)
 */
export class ConflictError extends AppError {
  readonly name = 'ConflictError';
  readonly code = ApiErrorCode.CONFLICT;

  constructor(message = 'Resource conflict', originalError?: Error, metadata?: Record<string, unknown>) {
    super(message, originalError, metadata);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends AppError {
  readonly name = 'RateLimitError';
  readonly code = ApiErrorCode.RATE_LIMIT_EXCEEDED;

  constructor(
    message = 'Rate limit exceeded',
    public readonly retryAfter?: number,
    originalError?: Error
  ) {
    super(message, originalError, { retryAfter });
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends AppError {
  readonly name = 'TimeoutError';
  readonly code = ApiErrorCode.TIMEOUT_ERROR;

  constructor(message = 'Request timeout', originalError?: Error, metadata?: Record<string, unknown>) {
    super(message, originalError, metadata);
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Generic server errors
 */
export class ServerError extends AppError {
  readonly name = 'ServerError';
  readonly code = ApiErrorCode.INTERNAL_ERROR;

  constructor(message = 'Internal server error', originalError?: Error, metadata?: Record<string, unknown>) {
    super(message, originalError, metadata);
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Error utility functions
 */
export const ErrorUtils = {
  /**
   * Check if error is an instance of AppError
   */
  isAppError: (error: unknown): error is AppError => {
    return error instanceof AppError;
  },

  /**
   * Check if error is a specific type of AppError
   */
  isErrorType: <T extends AppError>(error: unknown, ErrorClass: new (...args: any[]) => T): error is T => {
    return error instanceof ErrorClass;
  },

  /**
   * Extract error message from unknown error
   */
  getErrorMessage: (error: unknown): string => {
    if (ErrorUtils.isAppError(error)) {
      return error.message;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'An unknown error occurred';
  },

  /**
   * Extract error code from unknown error
   */
  getErrorCode: (error: unknown): string => {
    if (ErrorUtils.isAppError(error)) {
      return error.code;
    }
    
    return ApiErrorCode.INTERNAL_ERROR;
  },

  /**
   * Check if error is retryable
   */
  isRetryableError: (error: unknown): boolean => {
    if (ErrorUtils.isErrorType(error, NetworkError)) return true;
    if (ErrorUtils.isErrorType(error, TimeoutError)) return true;
    if (ErrorUtils.isErrorType(error, ServerError)) return true;
    if (ErrorUtils.isErrorType(error, RateLimitError)) return true;
    
    return false;
  },

  /**
   * Check if error should redirect to login
   */
  isAuthError: (error: unknown): boolean => {
    return ErrorUtils.isErrorType(error, AuthError);
  },

  /**
   * Check if error should show unauthorized page
   */
  isAuthorizationError: (error: unknown): boolean => {
    return ErrorUtils.isErrorType(error, AuthorizationError);
  },

  /**
   * Format error for user display
   */
  formatErrorForUser: (error: unknown): { title: string; message: string; type: 'error' | 'warning' } => {
    if (ErrorUtils.isErrorType(error, ValidationError)) {
      return {
        title: 'Validation Error',
        message: error.message,
        type: 'warning',
      };
    }

    if (ErrorUtils.isErrorType(error, AuthError)) {
      return {
        title: 'Authentication Required',
        message: 'Please sign in to continue',
        type: 'warning',
      };
    }

    if (ErrorUtils.isErrorType(error, AuthorizationError)) {
      return {
        title: 'Access Denied',
        message: 'You do not have permission to perform this action',
        type: 'warning',
      };
    }

    if (ErrorUtils.isErrorType(error, NotFoundError)) {
      return {
        title: 'Not Found',
        message: error.message,
        type: 'warning',
      };
    }

    if (ErrorUtils.isErrorType(error, NetworkError)) {
      return {
        title: 'Connection Error',
        message: 'Please check your internet connection and try again',
        type: 'error',
      };
    }

    if (ErrorUtils.isErrorType(error, TimeoutError)) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long to complete. Please try again.',
        type: 'error',
      };
    }

    if (ErrorUtils.isErrorType(error, RateLimitError)) {
      const retryAfter = error.retryAfter ? ` Please try again in ${Math.ceil(error.retryAfter / 1000)} seconds.` : '';
      return {
        title: 'Too Many Requests',
        message: `You've made too many requests.${retryAfter}`,
        type: 'warning',
      };
    }

    // Generic error
    return {
      title: 'Something went wrong',
      message: ErrorUtils.getErrorMessage(error),
      type: 'error',
    };
  },

  /**
   * Log error with context
   */
  logError: (error: unknown, context?: Record<string, unknown>) => {
    const errorInfo = {
      message: ErrorUtils.getErrorMessage(error),
      code: ErrorUtils.getErrorCode(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
    };

    console.error('Application Error:', errorInfo);

    // In production, send to error reporting service
    // if (env.VITE_ENABLE_ERROR_REPORTING && env.VITE_SENTRY_DSN) {
    //   Sentry.captureException(error, { extra: context });
    // }
  },
};
