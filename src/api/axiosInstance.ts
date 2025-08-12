import axios from "axios";

// Access Vite environment variables using import.meta.env
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1/";

if (!apiBaseUrl) {
  throw new Error("Missing API Base URL configuration");
}

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
