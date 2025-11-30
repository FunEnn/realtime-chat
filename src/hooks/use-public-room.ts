"use client";

import { isAxiosError } from "axios";
import { toast } from "sonner";
import { create } from "zustand";
import { API } from "@/lib/axios-client";
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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string })?.message;
    return message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

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
      console.error("Fetch public rooms error:", error);
      toast.error(getErrorMessage(error, "Failed to fetch public rooms"));
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
      console.error("Fetch public room error:", error);
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

      // 更新房间列表
      set((state) => ({
        rooms: state.rooms.map((room) =>
          room._id === roomId
            ? { ...room, isMember: true, memberCount: room.memberCount + 1 }
            : room,
        ),
      }));

      // 更新当前房间
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
      console.error("Join room error:", error);
      toast.error(getErrorMessage(error, "Failed to join room"));
      return false;
    } finally {
      set({ isJoining: false });
    }
  },

  leaveRoom: async (roomId) => {
    set({ isLeaving: true });
    try {
      await API.post(`/public-rooms/${roomId}/leave`);

      // 更新房间列表
      set((state) => ({
        rooms: state.rooms.map((room) =>
          room._id === roomId
            ? { ...room, isMember: false, memberCount: room.memberCount - 1 }
            : room,
        ),
      }));

      // 更新当前房间
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
                messages: [], // 离开后清空消息
              }
            : null,
        }));
      }

      toast.success("Left room successfully");
      return true;
    } catch (error) {
      console.error("Leave room error:", error);
      toast.error(getErrorMessage(error, "Failed to leave room"));
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

      // 添加到房间列表
      set((state) => ({
        rooms: [response.room, ...state.rooms],
      }));

      toast.success("Public room created successfully");
      return response.room;
    } catch (error) {
      console.error("Create public room error:", error);
      toast.error(getErrorMessage(error, "Failed to create public room"));
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

      // 更新房间列表
      set((state) => ({
        rooms: state.rooms.map((room) =>
          room._id === roomId ? response.room : room,
        ),
      }));

      // 更新当前房间
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
      console.error("Update public room error:", error);
      toast.error(getErrorMessage(error, "Failed to update public room"));
      return false;
    } finally {
      set({ isUpdating: false });
    }
  },

  sendMessage: async (payload) => {
    set({ isSendingMsg: true });
    const { chatId, content, image, replyTo } = payload;
    const { useAuthStore } = await import("@/hooks/use-clerk-auth");
    const { generateUUID } = await import("@/lib/helper");
    const { user } = useAuthStore.getState();

    if (!chatId || !user?._id) {
      toast.error("Chat or user not available");
      set({ isSendingMsg: false });
      return;
    }

    if (!content?.trim() && !image) {
      toast.error("Message content cannot be empty");
      set({ isSendingMsg: false });
      return;
    }

    const tempId = generateUUID();
    const tempMessage: MessageType = {
      _id: tempId,
      chatId,
      content: content ?? "",
      image: image ?? null,
      sender: user,
      replyTo: replyTo ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "sending...",
    };

    // 乐观更新：立即添加临时消息
    const state = get();
    if (state.currentRoom?.room._id === chatId) {
      set({
        currentRoom: {
          ...state.currentRoom,
          messages: [...state.currentRoom.messages, tempMessage],
        },
      });
    }

    try {
      const { data } = await API.post<{ message: MessageType }>(
        "/chat/message/send",
        {
          chatId,
          content,
          image,
          replyToId: replyTo?._id,
        },
      );

      // 用真实消息替换临时消息
      const currentState = get();
      if (!currentState.currentRoom) {
        set({ isSendingMsg: false });
        return;
      }

      const realMessageExists = currentState.currentRoom.messages.some(
        (msg) => msg._id === data.message._id,
      );

      if (realMessageExists) {
        // 如果真实消息已通过socket收到，移除临时消息
        set({
          currentRoom: {
            ...currentState.currentRoom,
            messages: currentState.currentRoom.messages.filter(
              (msg) => msg._id !== tempId,
            ),
          },
        });
      } else {
        // 否则，替换临时消息为真实消息
        set({
          currentRoom: {
            ...currentState.currentRoom,
            messages: currentState.currentRoom.messages.map((message) =>
              message._id === tempId ? data.message : message,
            ),
          },
        });
      }
    } catch (error) {
      console.error("Send message error:", error);
      toast.error(getErrorMessage(error, "Failed to send message"));

      // 发送失败，移除临时消息
      const currentState = get();
      if (currentState.currentRoom) {
        set({
          currentRoom: {
            ...currentState.currentRoom,
            messages: currentState.currentRoom.messages.filter(
              (message) => message._id !== tempId,
            ),
          },
        });
      }
    } finally {
      set({ isSendingMsg: false });
    }
  },

  addNewMessage: (roomId, message) => {
    const state = get();
    if (state.currentRoom?.room._id === roomId) {
      // 检查消息是否已存在（避免重复）
      const exists = state.currentRoom.messages.some(
        (m) => m._id === message._id,
      );
      if (!exists) {
        set({
          currentRoom: {
            ...state.currentRoom,
            messages: [...state.currentRoom.messages, message],
          },
        });
      }
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

      // 从列表中移除
      set((state) => ({
        rooms: state.rooms.filter((room) => room._id !== roomId),
      }));

      toast.success("Public room deleted successfully");
      return true;
    } catch (error) {
      console.error("Delete public room error:", error);
      toast.error(getErrorMessage(error, "Failed to delete public room"));
      return false;
    }
  },

  clearCurrentRoom: () => {
    set({ currentRoom: null });
  },
}));
