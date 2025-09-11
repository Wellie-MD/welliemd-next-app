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
          // Try to refresh the token using the HTTP-only cookie
          const response = await client.post('/auth/token/refresh', {}, { skipAuth: true } as any);
          const { access } = response.data as { access: string };
          
          // Update the access token in memory
          tokenManager.setAccessToken(access);
          
          // Update the authorization header with the new token
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${access}`;
          
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
  const responseData = error.response?.data as ApiResponse | undefined;

  // If response has our API error format, use it
  if (responseData?.error) {
    return responseData;
  }

  // Otherwise, create standardized error
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
    message = 'Authentication failed';
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

