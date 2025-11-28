"use client";

import { isAxiosError } from "axios";
import { toast } from "sonner";
import { create } from "zustand";
import { useAuth } from "@/src/hooks/use-auth";
import { API } from "@/src/lib/axios-client";
import type { UserType } from "@/src/types/auth.type";
import type {
  ChatType,
  CreateChatType,
  CreateMessageType,
  MessageType,
} from "@/src/types/chat.type";

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
  fetchAllUsers: () => Promise<void>;
  fetchChats: () => Promise<void>;
  createChat: (payload: CreateChatType) => Promise<ChatType | null>;
  fetchSingleChat: (chatId: string) => Promise<void>;
  sendMessage: (payload: CreateMessageType) => Promise<void>;
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

  fetchSingleChat: async (chatId) => {
    set({ isSingleChatLoading: true });
    try {
      const { data } = await API.get<SingleChatState>(`/chat/${chatId}`);
      set({ singleChat: data });
    } catch (error) {
      console.error("Fetch single chat error:", error);
      toast.error(getErrorMessage(error, "Failed to fetch chat"));
      set({ singleChat: null });
    } finally {
      set({ isSingleChatLoading: false });
    }
  },

  sendMessage: async (payload) => {
    set({ isSendingMsg: true });
    const { chatId, replyTo, content, image } = payload;
    const { user } = useAuth.getState();

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
      return {
        chats: [
          { ...chat, lastMessage },
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
          messages: [...state.singleChat.messages, message],
        },
      };
    });
  },
}));
