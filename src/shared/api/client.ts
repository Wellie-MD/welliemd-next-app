import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

import { env, debugLog } from '@/config/env';
import { ApiErrorCode, ApiResponse, HttpStatus } from './types';

// Import the token manager we created
import { tokenManager } from '@/features/auth/services/token-manager';

// Extend the AxiosRequestConfig to include our custom properties
declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
    skipAuth?: boolean;
  }
}

// Request queue for handling concurrent requests during token refresh
class RequestQueue {
  private queue: Array<{
    config: InternalAxiosRequestConfig;
    resolve: (value: AxiosResponse) => void;
    reject: (error: unknown) => void;
  }> = [];
  private isRefreshing = false;

  async add(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push({ config, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isRefreshing || this.queue.length === 0) {
      return;
    }

    this.isRefreshing = true;

    try {
      await tokenManager.refreshAccessToken();

      // Process all queued requests
      while (this.queue.length > 0) {
        const { config, resolve, reject } = this.queue.shift()!;

        try {
          const response = await axios(config);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      }
    } catch (error) {
      // Clear queue on refresh failure
      while (this.queue.length > 0) {
        const { reject } = this.queue.shift()!;
        reject(error);
      }
    } finally {
      this.isRefreshing = false;
    }
  }
}

// Global instance
const requestQueue = new RequestQueue();

// Helper function to ensure URLs have trailing slashes
const normalizeUrl = (url: string = ''): string => {
  if (!url) return url;
  // Skip URLs that already have query params or fragments
  if (url.includes('?') || url.includes('#')) return url;
  // Add trailing slash if missing
  return url.endsWith('/') ? url : `${url}/`;
};

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: env.VITE_API_BASE_URL,
    timeout: env.VITE_API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: true,
  });

  // Request interceptor
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Ensure URL has a trailing slash for Django compatibility
      if (config.url) {
        config.url = normalizeUrl(config.url);
      }
      // Skip auth for certain endpoints
      if (config.skipAuth) {
        return config;
      }

      // Add access token if available
      const accessToken = tokenManager.getAccessToken();
      if (accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      // Add request ID for tracing
      config.headers = config.headers || {};
      config.headers['X-Request-ID'] = crypto.randomUUID();

      debugLog('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: config.headers,
      });

      return config;
    },
    (error) => {
      debugLog('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // If the error is 401 and we haven't already tried to refresh the token
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Use tokenManager for deduplication - prevents concurrent refresh floods
          const newAccessToken = await tokenManager.refreshAccessToken();

          // Update the authorization header with the new token
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Retry the original request with the new token
          return client(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear tokens and redirect to login
          tokenManager.clearTokens();
          window.location.href = '/auth/signin';
          return Promise.reject(transformAxiosError(refreshError as AxiosError));
        }
      }

      return Promise.reject(transformAxiosError(error));
    }
  );

  return client;
};

// Transform axios error to standardized API error
function transformAxiosError(error: AxiosError): ApiResponse {
  const status = error.response?.status ?? 0;
  const responseData = error.response?.data as any;

  // If response has our API error format with string error, use it directly
  if (responseData?.error && typeof responseData.error === 'string') {
    return {
      success: false,
      error: responseData.error, // Keep as string for simple extraction
      timestamp: new Date().toISOString(),
    };
  }

  // If response has nested error object with message
  if (responseData?.error?.message) {
    return responseData as ApiResponse;
  }

  // Handle Django serializer errors (e.g., {"email": ["Enter a valid email"]})
  // Convert to a readable message
  if (responseData && typeof responseData === 'object' && !responseData.error) {
    const fieldErrors = Object.entries(responseData)
      .filter(([key]) => key !== 'detail' && key !== 'non_field_errors')
      .map(([field, errors]) => {
        const errorList = Array.isArray(errors) ? errors : [errors];
        return `${field}: ${errorList.join(', ')}`;
      });

    // Check for non_field_errors (Django's catch-all)
    const nonFieldErrors = responseData.non_field_errors || responseData.detail;
    if (nonFieldErrors) {
      const errorMsg = Array.isArray(nonFieldErrors) ? nonFieldErrors.join(', ') : nonFieldErrors;
      return {
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      };
    }

    if (fieldErrors.length > 0) {
      return {
        success: false,
        error: fieldErrors.join('; '),
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Otherwise, create standardized error with appropriate message
  let errorCode = ApiErrorCode.INTERNAL_ERROR;
  let message = 'An unexpected error occurred';

  if (error.code === 'ECONNABORTED') {
    errorCode = ApiErrorCode.TIMEOUT_ERROR;
    message = 'Request timeout';
  } else if (error.code === 'ERR_NETWORK') {
    errorCode = ApiErrorCode.NETWORK_ERROR;
    message = 'Network error';
  } else if (status === HttpStatus.UNAUTHORIZED) {
    errorCode = ApiErrorCode.AUTHENTICATION_ERROR;
    message = 'Invalid credentials';
  } else if (status === HttpStatus.BAD_REQUEST) {
    errorCode = ApiErrorCode.VALIDATION_ERROR;
    message = 'Invalid request. Please check your input.';
  } else if (status === HttpStatus.FORBIDDEN) {
    errorCode = ApiErrorCode.AUTHORIZATION_ERROR;
    message = 'Access forbidden';
  } else if (status === HttpStatus.NOT_FOUND) {
    errorCode = ApiErrorCode.NOT_FOUND;
    message = 'Resource not found';
  } else if (status === HttpStatus.CONFLICT) {
    errorCode = ApiErrorCode.CONFLICT;
    message = 'Resource conflict';
  } else if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
    errorCode = ApiErrorCode.VALIDATION_ERROR;
    message = 'Validation error';
  } else if (status === HttpStatus.TOO_MANY_REQUESTS) {
    errorCode = ApiErrorCode.RATE_LIMIT_EXCEEDED;
    message = 'Rate limit exceeded';
  }

  return {
    success: false,
    error: {
      code: errorCode,
      message,
      details: {
        status,
        originalMessage: error.message,
      },
    },
    timestamp: new Date().toISOString(),
  };
}


// Export the API client instance
export const apiClient = createApiClient();

// Retry utility with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

