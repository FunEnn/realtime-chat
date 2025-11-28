"use client";

import { io, type Socket } from "socket.io-client";
import { create } from "zustand";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";

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

  connectSocket: () => {
    const existingSocket = get().socket;
    if (existingSocket?.connected) return;

    if (existingSocket && !existingSocket.connected) {
      existingSocket.removeAllListeners();
      existingSocket.disconnect();
    }

    const newSocket = io(SOCKET_URL || undefined, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
    });

    set({ socket: newSocket, reconnectAttempts: 0 });

    newSocket.on("connect", () => {
      console.log("Socket connected", newSocket.id);
      set({ isConnected: true, reconnectAttempts: 0 });
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      set({ isConnected: false });
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
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
