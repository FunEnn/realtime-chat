"use client";

import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { create } from "zustand";
import { useSocket } from "@/hooks/use-socket";
import { API, setAuthToken } from "@/lib/api/axios-client";
import type { UserType } from "@/types/auth.type";

interface ClerkUserData {
  id: string;
  primaryEmailAddress?: { emailAddress: string } | null;
  fullName?: string | null;
  firstName?: string | null;
  imageUrl?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

interface AuthState {
  user: UserType | null;
  isLoading: boolean;
  syncUserWithBackend: (clerkUser: ClerkUserData | null) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserType | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: false,

  syncUserWithBackend: async (clerkUser) => {
    if (!clerkUser) {
      set({ user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await API.post("/auth/clerk-sync", {
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: clerkUser.fullName || clerkUser.firstName || "User",
        avatar: clerkUser.imageUrl,
      });

      const user = response.data?.data || response.data?.user || response.data;
      set({ user });
    } catch (error) {
      console.error("Sync with backend failed:", error);
      set({
        user: {
          id: clerkUser.id,
          name: clerkUser.fullName || clerkUser.firstName || "User",
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          avatar: clerkUser.imageUrl || null,
          createdAt:
            clerkUser.createdAt?.toString() || new Date().toISOString(),
          updatedAt:
            clerkUser.updatedAt?.toString() || new Date().toISOString(),
        },
      });
    } finally {
      useSocket.getState().connectSocket();
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await API.post("/auth/logout");
    } catch (error) {
      console.error("Backend logout error:", error);
    }
    set({ user: null });
    useSocket.getState().disconnectSocket();
  },

  setUser: (user) => set({ user }),
}));

// Hook to use in components
export function useAuth() {
  const {
    isLoaded: clerkLoaded,
    isSignedIn,
    signOut,
    getToken,
  } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const {
    user,
    isLoading,
    syncUserWithBackend,
    logout: storeLogout,
    setUser,
  } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const syncAuth = async () => {
      if (clerkLoaded) {
        if (isSignedIn && clerkUser) {
          try {
            const token = await getToken();
            setAuthToken(token);
            await syncUserWithBackend(clerkUser);
          } catch (error) {
            console.error("Failed to get token:", error);
          }
        } else {
          setAuthToken(null);
          setUser(null);
          useSocket.getState().disconnectSocket();
        }
      }
    };

    syncAuth();
  }, [
    clerkLoaded,
    isSignedIn,
    clerkUser,
    getToken,
    setUser,
    syncUserWithBackend,
  ]);

  useEffect(() => {
    if (!isSignedIn) return;

    const refreshToken = async () => {
      try {
        const token = await getToken();
        setAuthToken(token);
      } catch (error) {
        console.error("Failed to refresh token:", error);
      }
    };

    const interval = setInterval(refreshToken, 30000);
    return () => clearInterval(interval);
  }, [isSignedIn, getToken]);

  const logout = async () => {
    try {
      setAuthToken(null);
      await storeLogout();
      await signOut();
      toast.success("Logout successfully");
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  return {
    user,
    isLoading: !clerkLoaded || isLoading,
    isAuthenticated: isSignedIn && !!user,
    logout,
    setUser,
  };
}
