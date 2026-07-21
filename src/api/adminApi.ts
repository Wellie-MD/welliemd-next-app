import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

if (!apiBaseUrl) {
  throw new Error("Missing API Base URL configuration");
}

const adminApi = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add access token and handle super admin sessions
adminApi.interceptors.request.use(
  (config) => {
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

export default adminApi;
