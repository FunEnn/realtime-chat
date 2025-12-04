"use client";

import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { create } from "zustand";
import { useSocket } from "@/hooks/use-socket";
import { API, setAuthToken } from "@/lib/api-client";
import type { User } from "@/types";

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
  user: User | null;
  isLoading: boolean;
  lastSyncedClerkId: string | null;
  syncUserWithBackend: (clerkUser: ClerkUserData | null) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: false,
  lastSyncedClerkId: null,

  syncUserWithBackend: async (clerkUser) => {
    if (!clerkUser) {
      set({ user: null, lastSyncedClerkId: null });
      return;
    }

    const { lastSyncedClerkId, user: currentUser } = get();

    // 如果已经同步过相同的用户，跳过
    if (lastSyncedClerkId === clerkUser.id && currentUser) {
      return;
    }

    set({ isLoading: true });

    try {
      const { data } = await API.post("/auth/clerk-sync", {
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: clerkUser.fullName || clerkUser.firstName || "User",
        avatar: clerkUser.imageUrl,
      });

      const user = data?.user || data?.data || data;
      set({ user, lastSyncedClerkId: clerkUser.id });
    } catch {
      set({
        user: {
          id: clerkUser.id,
          clerkId: clerkUser.id,
          name: clerkUser.fullName || clerkUser.firstName || "User",
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          avatar: clerkUser.imageUrl || null,
          bio: null,
          isAdmin: false,
          createdAt: new Date(clerkUser.createdAt || Date.now()),
          updatedAt: new Date(clerkUser.updatedAt || Date.now()),
        },
        lastSyncedClerkId: clerkUser.id,
      });
    } finally {
      useSocket.getState().connectSocket();
      set({ isLoading: false });
    }
  },

  logout: async () => {
    // 不需要调用后端，只需清理客户端状态
    set({ user: null, lastSyncedClerkId: null });
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
          } catch {
            // Token 获取失败，稍后重试
          }
        } else {
          setAuthToken(null);
          setUser(null);
          useSocket.getState().disconnectSocket();
        }
      }
    };

    syncAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    clerkLoaded,
    isSignedIn,
    clerkUser?.id,
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
      } catch {
        // Token 刷新失败
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
    } catch {
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
