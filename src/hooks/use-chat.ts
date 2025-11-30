"use client";

import { isAxiosError } from "axios";
import { toast } from "sonner";
import { create } from "zustand";
import { useAuthStore } from "@/hooks/use-clerk-auth";
import { API } from "@/lib/axios-client";
import type { UserType } from "@/types/auth.type";
import type {
  ChatType,
  CreateChatType,
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
  createChat: (payload: CreateChatType) => Promise<ChatType | null>;
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

const generateUUID = () => crypto.randomUUID();

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
      console.error("Fetch users error:", error);
      toast.error(getErrorMessage(error, "Failed to fetch users"));
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
      console.error("Fetch chats error:", error);
      toast.error(getErrorMessage(error, "Failed to fetch chats"));
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
      console.error("Create chat error:", error);
      toast.error(getErrorMessage(error, "Failed to create chat"));
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

      // 标记聊天为已读
      try {
        await API.post(`/chat/${chatId}/mark-read`);
        // 更新本地聊天列表中的未读数
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat._id === chatId ? { ...chat, unreadCount: 0 } : chat,
          ),
        }));
      } catch (markReadError) {
        console.error("Mark as read error:", markReadError);
      }
    } catch (error) {
      console.error("Fetch single chat error:", error);
      if (!options?.silent) {
        toast.error(getErrorMessage(error, "Failed to fetch chat"));
      }
      set({ singleChat: null });
      throw error; // 重新抛出错误以便调用者处理
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
      console.error("Fetch chat history error:", error);
      toast.error(getErrorMessage(error, "Failed to fetch chat history"));
      return [];
    }
  },

  sendMessage: async (payload) => {
    set({ isSendingMsg: true });
    const { chatId, replyTo, content, image } = payload;
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

    set((state) => {
      if (state.singleChat?.chat._id !== chatId) return state;
      return {
        singleChat: {
          chat: state.singleChat.chat,
          messages: [...state.singleChat.messages, tempMessage],
        },
      };
    });

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

      set((state) => {
        if (!state.singleChat) return state;
        const realMessageExists = state.singleChat.messages.some(
          (msg) => msg._id === data.message._id,
        );
        if (realMessageExists) {
          return {
            singleChat: {
              chat: state.singleChat.chat,
              messages: state.singleChat.messages.filter(
                (msg) => msg._id !== tempId,
              ),
            },
          };
        }
        return {
          singleChat: {
            chat: state.singleChat.chat,
            messages: state.singleChat.messages.map((message) =>
              message._id === tempId ? data.message : message,
            ),
          },
        };
      });
    } catch (error) {
      console.error("Send message error:", error);
      toast.error(getErrorMessage(error, "Failed to send message"));

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
    } finally {
      set({ isSendingMsg: false });
    }
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

      // 如果不是当前用户发送的消息，且不是当前打开的聊天，增加未读数
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
    if (!message || typeof message !== "object" || !message._id) {
      console.error("Invalid message received in addNewMessage:", message);
      return;
    }
    set((state) => {
      if (state.singleChat?.chat._id !== chatId) return state;
      const messageExists = state.singleChat.messages.some(
        (msg) => msg._id === message._id,
      );
      if (messageExists) return state;
      return {
        singleChat: {
          chat: state.singleChat.chat,
          messages: [...state.singleChat.messages, message],
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
      console.error("Update group info error:", error);
      toast.error(getErrorMessage(error, "Failed to update group info"));
      return false;
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  deleteGroupChat: async (chatId) => {
    try {
      await API.delete(`/chat/${chatId}`);

      // 从列表中移除
      set((state) => ({
        chats: state.chats.filter((chat) => chat._id !== chatId),
      }));

      toast.success("Group chat deleted successfully");
      return true;
    } catch (error) {
      console.error("Delete group chat error:", error);
      toast.error(getErrorMessage(error, "Failed to delete group chat"));
      return false;
    }
  },
}));
