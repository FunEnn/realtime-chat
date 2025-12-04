import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

const API = axios.create({
  baseURL: "/api",
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token storage for client-side requests
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

API.interceptors.request.use(
  async (config) => {
    // Add auth token to requests if available
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const config = error.config as RetryConfig;
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (config && status && status >= 500) {
      config._retryCount = config._retryCount || 0;

      if (config._retryCount < 2) {
        config._retryCount += 1;
        const delay = config._retryCount * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return API.request(config);
      }
    }

    switch (status) {
      case 401:
        toast.error("登录已过期，请重新登录");
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
        break;
      case 403:
        toast.error("Access denied");
        break;
      case 404:
        toast.error("Resource not found");
        break;
      case 500:
        toast.error("Server error");
        break;
      default:
        if (message) {
          toast.error(message);
        }
    }

    return Promise.reject(error);
  },
);

export { API };
export type { AxiosInstance };
