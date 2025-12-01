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
import type { UserType } from "@/types/auth.type";
import type {
  ChatType,
  CreateChatInput,
  CreateMessageType,
  MessageType,
} from "@/types/chat.type";

interface SingleChatState {
  chat: ChatType;
  messages: MessageType[];
}

interface ChatState {
  chats: ChatType[];
  users: UserType[];
  singleChat: SingleChatState | null;
  currentAIStreamId: string | null;
  isChatsLoading: boolean;
  isUsersLoading: boolean;
  isCreatingChat: boolean;
  isSingleChatLoading: boolean;
  isSendingMsg: boolean;
  isUpdatingGroup: boolean;
  fetchAllUsers: () => Promise<void>;
  fetchChats: () => Promise<void>;
  createChat: (payload: CreateChatInput) => Promise<ChatType | null>;
  fetchSingleChat: (
    chatId: string,
    options?: { silent?: boolean },
  ) => Promise<void>;
  fetchChatHistory: (chatId: string) => Promise<MessageType[]>;
  sendMessage: (payload: CreateMessageType) => Promise<void>;
  updateGroupInfo: (
    chatId: string,
    payload: { groupName?: string; groupAvatar?: string },
  ) => Promise<boolean>;
  deleteGroupChat: (chatId: string) => Promise<boolean>;
  addNewChat: (chat: ChatType) => void;
  updateChatLastMessage: (chatId: string, lastMessage: MessageType) => void;
  addNewMessage: (chatId: string, message: MessageType) => void;
}

export const useChat = create<ChatState>()((set, get) => ({
  chats: [],
  users: [],
  singleChat: null,
  currentAIStreamId: null,
  isChatsLoading: false,
  isUsersLoading: false,
  isCreatingChat: false,
  isSingleChatLoading: false,
  isSendingMsg: false,
  isUpdatingGroup: false,

  fetchAllUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const { data } = await API.get<{ users: UserType[] }>("/user/all");
      set({ users: data.users });
    } catch (error) {
      handleError(error, "Fetch users", "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  fetchChats: async () => {
    set({ isChatsLoading: true });
    try {
      const { data } = await API.get<{ chats: ChatType[] }>("/chat/all");
      set({ chats: data.chats });
    } catch (error) {
      handleError(error, "Fetch chats", "Failed to fetch chats");
    } finally {
      set({ isChatsLoading: false });
    }
  },

  createChat: async (payload) => {
    set({ isCreatingChat: true });
    try {
      const { data } = await API.post<{ chat: ChatType }>(
        "/chat/create",
        payload,
      );
      get().addNewChat(data.chat);
      toast.success("Chat created successfully");
      return data.chat;
    } catch (error) {
      handleError(error, "Create chat", "Failed to create chat");
      return null;
    } finally {
      set({ isCreatingChat: false });
    }
  },

  fetchSingleChat: async (chatId, options?: { silent?: boolean }) => {
    set({ isSingleChatLoading: true, singleChat: null });
    try {
      const { data } = await API.get<SingleChatState>(`/chat/${chatId}`);
      set({ singleChat: data });

      try {
        await API.post(`/chat/${chatId}/mark-read`);
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat._id === chatId ? { ...chat, unreadCount: 0 } : chat,
          ),
        }));
      } catch (markReadError) {
        logger.error("Mark as read error", { error: markReadError });
      }
    } catch (error) {
      logger.error("Fetch single chat error", { error });
      if (!options?.silent) {
        toast.error(getErrorMessage(error, "Failed to fetch chat"));
      }
      set({ singleChat: null });
      throw error;
    } finally {
      set({ isSingleChatLoading: false });
    }
  },

  fetchChatHistory: async (chatId) => {
    try {
      const { data } = await API.get<{ messages: MessageType[] }>(
        `/chat/${chatId}/messages`,
      );
      return data.messages;
    } catch (error) {
      handleError(error, "Fetch chat history", "Failed to fetch chat history");
      return [];
    }
  },

  sendMessage: async (payload) => {
    set({ isSendingMsg: true });
    const { chatId, replyTo, content, image } = payload;
    const { user } = useAuthStore.getState();

    await sendMessageService(
      { chatId: chatId as string, content, image, replyTo },
      user,
      {
        onOptimisticUpdate: (tempMessage) => {
          set((state) => {
            if (state.singleChat?.chat._id !== chatId) return state;
            return {
              singleChat: {
                chat: state.singleChat.chat,
                messages: [...state.singleChat.messages, tempMessage],
              },
            };
          });
        },
        onSuccess: (realMessage, tempId) => {
          set((state) => {
            if (!state.singleChat) return state;
            return {
              singleChat: {
                chat: state.singleChat.chat,
                messages: replaceOrRemoveTempMessage(
                  state.singleChat.messages,
                  tempId,
                  realMessage,
                ),
              },
            };
          });
        },
        onError: (tempId) => {
          set((state) => {
            if (!state.singleChat) return state;
            return {
              singleChat: {
                chat: state.singleChat.chat,
                messages: state.singleChat.messages.filter(
                  (message) => message._id !== tempId,
                ),
              },
            };
          });
        },
      },
    );

    set({ isSendingMsg: false });
  },

  addNewChat: (chat) => {
    set((state) => {
      const existingIndex = state.chats.findIndex((c) => c._id === chat._id);
      if (existingIndex !== -1) {
        const updatedChats = [...state.chats];
        updatedChats.splice(existingIndex, 1);
        return { chats: [chat, ...updatedChats] };
      }
      return { chats: [chat, ...state.chats] };
    });
  },

  updateChatLastMessage: (chatId, lastMessage) => {
    set((state) => {
      const chat = state.chats.find((c) => c._id === chatId);
      if (!chat) return state;

      const { user } = useAuthStore.getState();
      const currentUserId = user?._id;

      const isCurrentChat = state.singleChat?.chat._id === chatId;
      const isSender = lastMessage.sender?._id === currentUserId;
      const shouldIncrementUnread = !isCurrentChat && !isSender;

      return {
        chats: [
          {
            ...chat,
            lastMessage,
            unreadCount: shouldIncrementUnread
              ? (chat.unreadCount || 0) + 1
              : chat.unreadCount,
          },
          ...state.chats.filter((c) => c._id !== chatId),
        ],
      };
    });
  },

  addNewMessage: (chatId, message) => {
    set((state) => {
      if (state.singleChat?.chat._id !== chatId) return state;
      return {
        singleChat: {
          chat: state.singleChat.chat,
          messages: addMessageIfNotExists(state.singleChat.messages, message),
        },
      };
    });
  },

  updateGroupInfo: async (chatId, payload) => {
    set({ isUpdatingGroup: true });
    try {
      const { data } = await API.patch<{ chat: ChatType }>(
        `/chat/${chatId}`,
        payload,
      );

      set((state) => {
        const updatedChats = state.chats.map((chat) =>
          chat._id === chatId ? { ...chat, ...data.chat } : chat,
        );

        const updatedSingleChat =
          state.singleChat?.chat._id === chatId
            ? {
                chat: { ...state.singleChat.chat, ...data.chat },
                messages: state.singleChat.messages,
              }
            : state.singleChat;

        return {
          chats: updatedChats,
          singleChat: updatedSingleChat,
        };
      });

      return true;
    } catch (error) {
      handleError(error, "Update group info", "Failed to update group info");
      return false;
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  deleteGroupChat: async (chatId) => {
    try {
      await API.delete(`/chat/${chatId}`);

      set((state) => ({
        chats: state.chats.filter((chat) => chat._id !== chatId),
      }));

      toast.success("Group chat deleted successfully");
      return true;
    } catch (error) {
      handleError(error, "Delete group chat", "Failed to delete group chat");
      return false;
    }
  },
}));
