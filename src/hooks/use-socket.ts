"use client";

import { io, type Socket } from "socket.io-client";
import { create } from "zustand";
import { getAuthToken } from "@/lib/api/axios-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000");

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  isConnected: boolean;
  reconnectAttempts: number;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useSocket = create<SocketState>()((set, get) => ({
  socket: null,
  onlineUsers: [],
  isConnected: false,
  reconnectAttempts: 0,

  connectSocket: async () => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) {
      return;
    }

    if (existingSocket && !existingSocket.connected) {
      existingSocket.removeAllListeners();
      existingSocket.disconnect();
    }

    const token = getAuthToken();
    if (!token) {
      return;
    }

    const socketConfig = {
      path: "/api/socket/io",
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      auth: async (cb: (data: { token: string }) => void) => {
        const freshToken = getAuthToken();
        cb({ token: freshToken || token });
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    };

    const newSocket = io(SOCKET_URL || undefined, socketConfig);

    set({ socket: newSocket, reconnectAttempts: 0 });

    newSocket.on("connect", () => {
      set({ isConnected: true, reconnectAttempts: 0 });
    });

    newSocket.on("disconnect", () => {
      set({ isConnected: false });
    });

    newSocket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error.message);
      set((state) => ({
        reconnectAttempts: state.reconnectAttempts + 1,
        isConnected: false,
      }));
    });

    newSocket.on("online:users", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    const existingSocket = get().socket;
    if (existingSocket) {
      existingSocket.removeAllListeners();
      existingSocket.disconnect();
      set({ socket: null, isConnected: false, onlineUsers: [] });
    }
  },
}));
