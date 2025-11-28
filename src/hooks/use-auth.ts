"use client";

import { isAxiosError } from "axios";
import { toast } from "sonner";
import { create } from "zustand";
import { useSocket } from "@/src/hooks/use-socket";
import { API } from "@/src/lib/axios-client";
import type {
  LoginInput,
  RegisterInput,
  UserType,
} from "@/src/types/auth.type";

interface AuthState {
  user: UserType | null;
  isLoggingIn: boolean;
  isSigningUp: boolean;
  isAuthStatusLoading: boolean;
  register: (payload: RegisterInput) => Promise<boolean>;
  login: (payload: LoginInput) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuthStatus: () => Promise<void>;
  clearUser: () => void;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string })?.message;
    return message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  isLoggingIn: false,
  isSigningUp: false,
  isAuthStatusLoading: false,

  register: async (payload) => {
    set({ isSigningUp: true });
    try {
      const { data } = await API.post<{ user: UserType }>(
        "/auth/register",
        payload,
      );
      set({ user: data.user });
      useSocket.getState().connectSocket();
      toast.success("Register successfully");
      return true;
    } catch (error) {
      console.error("Register error:", error);
      toast.error(getErrorMessage(error, "Register failed"));
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (payload) => {
    set({ isLoggingIn: true });
    try {
      const { data } = await API.post<{ user: UserType }>(
        "/auth/login",
        payload,
      );
      set({ user: data.user });
      useSocket.getState().connectSocket();
      toast.success("Login successfully");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast.error(getErrorMessage(error, "Login failed"));
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await API.post("/auth/logout");
      set({ user: null });
      useSocket.getState().disconnectSocket();
      toast.success("Logout successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(getErrorMessage(error, "Logout failed"));
      set({ user: null });
      useSocket.getState().disconnectSocket();
    }
  },

  refreshAuthStatus: async () => {
    set({ isAuthStatusLoading: true });
    try {
      const { data } = await API.get<{ user: UserType }>("/auth/status");
      set({ user: data.user });
      useSocket.getState().connectSocket();
    } catch (error) {
      console.error("Auth status error:", error);
      set({ user: null });
    } finally {
      set({ isAuthStatusLoading: false });
    }
  },

  clearUser: () => {
    set({ user: null });
    useSocket.getState().disconnectSocket();
  },
}));
