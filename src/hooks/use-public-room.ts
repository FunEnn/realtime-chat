"use client";

import { toast } from "sonner";
import { create } from "zustand";
import { useAuthStore } from "@/hooks/use-clerk-auth";
import { API } from "@/lib/api/axios-client";
import { sendMessageService } from "@/lib/services/message/message-service";
import {
  addMessageIfNotExists,
  replaceOrRemoveTempMessage,
} from "@/lib/services/message/message-state-utils";
import { getErrorMessage, handleError } from "@/lib/utils/error-handler";
import { logger } from "@/lib/utils/logger";
import type { MessageType } from "@/types/chat.type";
import type {
  CreatePublicRoomInput,
  PublicRoomDetailType,
  PublicRoomType,
} from "@/types/public-room.type";

interface PublicRoomState {
  rooms: PublicRoomType[];
  currentRoom: PublicRoomDetailType | null;
  isRoomsLoading: boolean;
  isRoomLoading: boolean;
  isJoining: boolean;
  isLeaving: boolean;
  isUpdating: boolean;
  isSendingMsg: boolean;
  fetchPublicRooms: () => Promise<void>;
  fetchPublicRoom: (
    roomId: string,
    options?: { silent?: boolean },
  ) => Promise<void>;
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: (roomId: string) => Promise<boolean>;
  createPublicRoom: (
    data: CreatePublicRoomInput,
  ) => Promise<PublicRoomType | null>;
  updatePublicRoom: (
    roomId: string,
    data: Partial<CreatePublicRoomInput>,
  ) => Promise<boolean>;
  deletePublicRoom: (roomId: string) => Promise<boolean>;
  sendMessage: (payload: {
    chatId: string;
    content?: string;
    image?: string;
    replyTo?: MessageType | null;
  }) => Promise<void>;
  addNewMessage: (roomId: string, message: MessageType) => void;
  removeMessage: (roomId: string, messageId: string) => void;
  updateMessage: (
    roomId: string,
    tempId: string,
    realMessage: MessageType,
  ) => void;
  clearCurrentRoom: () => void;
}

export const usePublicRoom = create<PublicRoomState>()((set, get) => ({
  rooms: [],
  currentRoom: null,
  isRoomsLoading: false,
  isRoomLoading: false,
  isJoining: false,
  isLeaving: false,
  isUpdating: false,
  isSendingMsg: false,

  fetchPublicRooms: async () => {
    set({ isRoomsLoading: true });
    try {
      const { data } = await API.get<{ rooms: PublicRoomType[] }>(
        "/public-rooms/all",
      );
      set({ rooms: data.rooms });
    } catch (error) {
      handleError(error, "Fetch public rooms", "Failed to fetch public rooms");
    } finally {
      set({ isRoomsLoading: false });
    }
  },

  fetchPublicRoom: async (roomId, options?: { silent?: boolean }) => {
    set({ isRoomLoading: true });
    // 如果是不同的房间才清空数据
    const currentRoomId = get().currentRoom?.room._id;
    if (currentRoomId !== roomId) {
      set({ currentRoom: null });
    }

    try {
      const { data } = await API.get<PublicRoomDetailType>(
        `/public-rooms/${roomId}`,
      );
      set({ currentRoom: data });
    } catch (error) {
      logger.error("Fetch public room error", { error });
      if (!options?.silent) {
        toast.error(getErrorMessage(error, "Failed to fetch public room"));
      }
      set({ currentRoom: null });
      throw error;
    } finally {
      set({ isRoomLoading: false });
    }
  },

  joinRoom: async (roomId) => {
    set({ isJoining: true });
    try {
      await API.post(`/public-rooms/${roomId}/join`);

      set((state) => ({
        rooms: state.rooms.map((room) =>
          room._id === roomId
            ? { ...room, isMember: true, memberCount: room.memberCount + 1 }
            : room,
        ),
      }));

      if (get().currentRoom?.room._id === roomId) {
        set((state) => ({
          currentRoom: state.currentRoom
            ? {
                ...state.currentRoom,
                room: {
                  ...state.currentRoom.room,
                  isMember: true,
                  memberCount: state.currentRoom.room.memberCount + 1,
                },
              }
            : null,
        }));
      }

      toast.success("Joined room successfully");
      return true;
    } catch (error) {
      handleError(error, "Join room", "Failed to join room");
      return false;
    } finally {
      set({ isJoining: false });
    }
  },

  leaveRoom: async (roomId) => {
    set({ isLeaving: true });
    try {
      await API.post(`/public-rooms/${roomId}/leave`);

      set((state) => ({
        rooms: state.rooms.map((room) =>
          room._id === roomId
            ? { ...room, isMember: false, memberCount: room.memberCount - 1 }
            : room,
        ),
      }));

      if (get().currentRoom?.room._id === roomId) {
        set((state) => ({
          currentRoom: state.currentRoom
            ? {
                ...state.currentRoom,
                room: {
                  ...state.currentRoom.room,
                  isMember: false,
                  memberCount: state.currentRoom.room.memberCount - 1,
                },
                messages: [],
              }
            : null,
        }));
      }

      toast.success("Left room successfully");
      return true;
    } catch (error) {
      handleError(error, "Leave room", "Failed to leave room");
      return false;
    } finally {
      set({ isLeaving: false });
    }
  },

  createPublicRoom: async (data) => {
    try {
      const { data: response } = await API.post<{ room: PublicRoomType }>(
        "/public-rooms/create",
        data,
      );

      set((state) => ({
        rooms: [response.room, ...state.rooms],
      }));

      toast.success("Public room created successfully");
      return response.room;
    } catch (error) {
      handleError(error, "Create public room", "Failed to create public room");
      return null;
    }
  },

  updatePublicRoom: async (roomId, data) => {
    set({ isUpdating: true });
    try {
      const { data: response } = await API.patch<{ room: PublicRoomType }>(
        `/public-rooms/${roomId}`,
        data,
      );

      set((state) => ({
        rooms: state.rooms.map((room) =>
          room._id === roomId ? response.room : room,
        ),
      }));

      if (get().currentRoom?.room._id === roomId) {
        set((state) => ({
          currentRoom: state.currentRoom
            ? { ...state.currentRoom, room: response.room }
            : null,
        }));
      }

      toast.success("Public room updated successfully");
      return true;
    } catch (error) {
      handleError(error, "Update public room", "Failed to update public room");
      return false;
    } finally {
      set({ isUpdating: false });
    }
  },

  sendMessage: async (payload) => {
    set({ isSendingMsg: true });
    const { chatId, content, image, replyTo } = payload;
    const { user } = useAuthStore.getState();

    await sendMessageService({ chatId, content, image, replyTo }, user, {
      onOptimisticUpdate: (tempMessage) => {
        const state = get();
        if (state.currentRoom?.room._id === chatId) {
          set({
            currentRoom: {
              ...state.currentRoom,
              messages: [...state.currentRoom.messages, tempMessage],
            },
          });
        }
      },
      onSuccess: (realMessage, tempId) => {
        const state = get();
        if (state.currentRoom) {
          set({
            currentRoom: {
              ...state.currentRoom,
              messages: replaceOrRemoveTempMessage(
                state.currentRoom.messages,
                tempId,
                realMessage,
              ),
            },
          });
        }
      },
      onError: (tempId) => {
        const state = get();
        if (state.currentRoom) {
          set({
            currentRoom: {
              ...state.currentRoom,
              messages: state.currentRoom.messages.filter(
                (message) => message._id !== tempId,
              ),
            },
          });
        }
      },
    });

    set({ isSendingMsg: false });
  },

  addNewMessage: (roomId, message) => {
    const state = get();
    if (state.currentRoom?.room._id === roomId) {
      set({
        currentRoom: {
          ...state.currentRoom,
          messages: addMessageIfNotExists(state.currentRoom.messages, message),
        },
      });
    }
  },

  removeMessage: (roomId, messageId) => {
    const state = get();
    if (state.currentRoom?.room._id === roomId) {
      set({
        currentRoom: {
          ...state.currentRoom,
          messages: state.currentRoom.messages.filter(
            (m) => m._id !== messageId,
          ),
        },
      });
    }
  },

  updateMessage: (roomId, tempId, realMessage) => {
    const state = get();
    if (state.currentRoom?.room._id === roomId) {
      set({
        currentRoom: {
          ...state.currentRoom,
          messages: state.currentRoom.messages.map((m) =>
            m._id === tempId ? realMessage : m,
          ),
        },
      });
    }
  },

  deletePublicRoom: async (roomId) => {
    try {
      await API.delete(`/public-rooms/${roomId}`);

      set((state) => ({
        rooms: state.rooms.filter((room) => room._id !== roomId),
      }));

      toast.success("Public room deleted successfully");
      return true;
    } catch (error) {
      handleError(error, "Delete public room", "Failed to delete public room");
      return false;
    }
  },

  clearCurrentRoom: () => {
    set({ currentRoom: null });
  },
}));
