import axios from "axios";
import {
  clearStoredAuth,
  setStoredAuthTokens,
  shouldAttemptTokenRefresh,
} from "./authSession.js";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach auth token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle errors globally
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (shouldAttemptTokenRefresh(originalRequest.url || "")) {
        try {
          const { data } = await refreshClient.post("/auth/refresh"); 
          if (data?.accessToken) {
            setStoredAuthTokens(data);
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${data.accessToken}`,
            };
            return axiosClient(originalRequest);
          }
        } catch {
          // fall through to logout redirect
        }
      }
      clearStoredAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
