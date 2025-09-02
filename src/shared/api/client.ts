import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

import { env, debugLog } from '@/config/env';
import { ApiErrorCode, ApiResponse, HttpStatus, RequestConfig } from './types';

// Token management
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage(): void {
    try {
      this.accessToken = localStorage.getItem(env.VITE_AUTH_TOKEN_KEY);
      this.refreshToken = localStorage.getItem(env.VITE_REFRESH_TOKEN_KEY);
    } catch (error) {
      debugLog('Failed to load tokens from storage:', error);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    
    try {
      localStorage.setItem(env.VITE_AUTH_TOKEN_KEY, accessToken);
      localStorage.setItem(env.VITE_REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      debugLog('Failed to save tokens to storage:', error);
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.refreshPromise = null;
    
    try {
      localStorage.removeItem(env.VITE_AUTH_TOKEN_KEY);
      localStorage.removeItem(env.VITE_REFRESH_TOKEN_KEY);
    } catch (error) {
      debugLog('Failed to clear tokens from storage:', error);
    }
  }

  isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      return timeUntilExpiry < env.VITE_TOKEN_REFRESH_THRESHOLD;
    } catch {
      return true; // If we can't decode the token, assume it's expiring
    }
  }

  async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    try {
      const response = await axios.post(`${env.VITE_API_BASE_URL}/auth/refresh`, {
        refreshToken: this.refreshToken,
      });

      const { accessToken, refreshToken } = response.data.data;
      this.setTokens(accessToken, refreshToken);
      
      return accessToken;
    } catch (error) {
      this.clearTokens();
      throw new Error('Token refresh failed');
    }
  }
}

// Request queue for handling concurrent requests during token refresh
class RequestQueue {
  private queue: Array<{
    config: AxiosRequestConfig;
    resolve: (value: AxiosResponse) => void;
    reject: (error: unknown) => void;
  }> = [];
  private isRefreshing = false;

  async add(config: AxiosRequestConfig): Promise<AxiosResponse> {
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

// Global instances
const tokenManager = new TokenManager();
const requestQueue = new RequestQueue();

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
    async (config) => {
      const customConfig = config as RequestConfig;
      
      // Skip auth for certain endpoints
      if (customConfig.skipAuth) {
        return config;
      }

      // Add access token
      const accessToken = tokenManager.getAccessToken();
      if (accessToken) {
        // Check if token is expiring soon and refresh if needed
        if (tokenManager.isTokenExpiringSoon(accessToken)) {
          try {
            const newToken = await tokenManager.refreshAccessToken();
            config.headers.Authorization = `Bearer ${newToken}`;
          } catch (error) {
            debugLog('Token refresh failed in request interceptor:', error);
            // Continue with existing token
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        } else {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }

      // Add request ID for tracing
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
    (response) => {
      debugLog('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
      
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as RequestConfig & { _retry?: boolean };
      
      debugLog('API Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
      });

      // Handle 401 Unauthorized - token refresh
      if (
        error.response?.status === HttpStatus.UNAUTHORIZED &&
        !originalRequest._retry &&
        !originalRequest.skipAuth &&
        tokenManager.getRefreshToken()
      ) {
        originalRequest._retry = true;
        
        try {
          // Use request queue to handle concurrent requests
          return await requestQueue.add(originalRequest);
        } catch (refreshError) {
          debugLog('Token refresh failed, clearing tokens:', refreshError);
          tokenManager.clearTokens();
          // Redirect to login or emit auth error event
          window.dispatchEvent(new CustomEvent('auth:logout'));
          return Promise.reject(refreshError);
        }
      }

      // Transform axios error to our API error format
      const apiError = transformAxiosError(error);
      return Promise.reject(apiError);
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

// Export API client instance
export const apiClient = createApiClient();

// Export token manager for auth service
export { tokenManager };

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

