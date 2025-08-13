import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { authService } from "../services/authService";

// Access Vite environment variables using import.meta.env
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

if (!apiBaseUrl) {
  throw new Error("Missing API Base URL configuration");
}

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // IMPORTANT: This allows cookies to be sent and received
});

// Request interceptor to add the access token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors (token expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Check for 401 error and ensure it's not a retry request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as a retry
      try {
        const newAccessToken = await authService.refreshAccessToken();
        if (newAccessToken) {
          axios.defaults.headers.common["Authorization"] = "Bearer " + newAccessToken;
          originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
          return axiosInstance(originalRequest); // Retry the original request with the new token
        }
      } catch (refreshError) {
        // Refresh failed, logout is handled in authService.refreshAccessToken
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
