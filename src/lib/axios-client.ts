import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

const API = axios.create({
  baseURL: `${API_BASE_URL}/api` || "/api",
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
        toast.error("Unauthorized, please login");
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
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
