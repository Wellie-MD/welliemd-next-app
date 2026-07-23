import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { API_REQUEST_TIMEOUT_MS } from "./constants";

// const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "https://knysysapi.welliemd.com/api/v1";

declare module "axios" {
  export interface AxiosRequestConfig<D = unknown> {
    skipAuthRedirect?: boolean;
    _retry?: boolean;
  }

  export interface InternalAxiosRequestConfig<D = unknown> {
    skipAuthRedirect?: boolean;
    _retry?: boolean;
  }
}

let isHydrating = false;

if (!apiBaseUrl) {
  throw new Error("Missing API Base URL configuration");
}

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: API_REQUEST_TIMEOUT_MS,
});

export const setHydratingState = (state: boolean) => {
  isHydrating = state;
};

type TokenInvalidResponse = {
  code?: string;
  detail?: string;
  messages?: Array<{ code?: string }>;
};

const isTokenInvalidResponse = (error: AxiosError<TokenInvalidResponse>): boolean => {
  const data = error.response?.data;
  return (
    data?.code === 'token_not_valid' ||
    data?.detail === 'Given token not valid for any token type' ||
    data?.messages?.some?.((message) => message?.code === 'token_not_valid')
  );
};

// Request interceptor to add access token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData && config.headers) {
      // Let the browser set the multipart boundary for file uploads.
      delete config.headers["Content-Type"];
    }

    const authState = useAuthStore.getState();
    config.headers["X-Wellie-Portal"] = "client";

    if (authState.superAdminApiBaseUrl) {
      config.baseURL = authState.superAdminApiBaseUrl;
      return config;
    }

    const token = authState.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors and refresh tokens
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Skip token refresh during hydration to prevent conflicts
    if (isHydrating) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const authStore = useAuthStore.getState();
    const skipAuthRedirect = Boolean(originalRequest?.skipAuthRedirect);
    const isSuperAdminSession = Boolean(authStore.superAdminApiBaseUrl);
    
    // Skip token refresh for auth-related endpoints
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');
    const isTokenRefresh = originalRequest?.url?.includes('/auth/token/refresh/');
    const isMeEndpoint = originalRequest?.url?.includes('/auth/me/');
    
    // If this is a 401 from the refresh token endpoint, log the user out
    const shouldRefreshToken =
      (error.response?.status === 401 || isTokenInvalidResponse(error)) &&
      !isAuthEndpoint &&
      authStore.isAuthenticated;

    if ((error.response?.status === 401 || isTokenInvalidResponse(error)) && isTokenRefresh) {
      if (skipAuthRedirect) {
        return Promise.reject(error);
      }
      console.error('Refresh token failed, logging out');
      const { authService } = await import('../services/authService');
      await authService.logout();
      window.location.href = '/auth/signin';
      return Promise.reject(error);
    }

    // Backend now reliably returns 401 only for genuine session invalidity (expired/
    // revoked/missing) and 403 for business-rule denials (e.g. read-only mode blocking
    // a write) — so only 401 here means "log out"; a 403 is shown as a normal error
    // by whatever code catches the rejected promise, not treated as session expiry.
    if (error.response?.status === 401 && isSuperAdminSession) {
      // Previously only redirected for /auth/me/, so an expired impersonated session
      // just silently failed every other request (still looked logged in, no data).
      if (!skipAuthRedirect) {
        authStore.logout();
        window.location.href = '/auth/signin';
      }
      return Promise.reject(error);
    }
    
    // Handle 401 errors for non-auth endpoints when we have an active session
    if (shouldRefreshToken) {
      if (skipAuthRedirect) {
        return Promise.reject(error);
      }
      // If this is a retry that failed, log out
      if (originalRequest._retry) {
        console.error('Failed to refresh token after retry, logging out');
        const { authService } = await import('../services/authService');
        await authService.logout();
        window.location.href = '/auth/signin';
        return Promise.reject(error);
      }
      
      // Mark this request to prevent infinite retry loops
      originalRequest._retry = true;
      
      try {
        console.log('Attempting to refresh access token...');
        const { authService } = await import('../services/authService');
        const newAccessToken = await authService.refreshAccessToken();
        
        if (newAccessToken) {
          // Update the authorization header for the original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          // Update the default authorization header for future requests
          axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          
          // For /me endpoint, we need to handle it specially
          if (isMeEndpoint) {
            try {
              const user = await authService.getMe();
              if (user) {
                return { data: user };
              }
            } catch (meError) {
              console.error('Failed to fetch user after token refresh:', meError);
              throw meError;
            }
          }
          
          // For other endpoints, retry the original request with the new token
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        const { authService } = await import('../services/authService');
        await authService.logout();
        window.location.href = '/auth/signin';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
