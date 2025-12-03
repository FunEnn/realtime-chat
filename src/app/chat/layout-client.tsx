"use client";

import { useEffect, useState } from "react";
import AppWrapper from "@/components/app-wrapper";
import AsideBar from "@/components/aside-bar";
import ChatListDisplay from "@/components/chat/chat-list-display";
import { useChatId } from "@/hooks/use-chat-id";
import { useSocket } from "@/hooks/use-socket";
import { cn } from "@/lib/utils";
import type { UserType } from "@/types/auth.type";
import type { ChatType, MessageType } from "@/types/chat.type";

interface ChatLayoutClientProps {
  children: React.ReactNode;
  initialChats: ChatType[];
  allUsers: UserType[];
  currentUser: UserType;
}

export default function ChatLayoutClient({
  children,
  initialChats,
  allUsers,
  currentUser,
}: ChatLayoutClientProps) {
  const chatId = useChatId();
  const { socket } = useSocket();

  // 过滤掉无效的聊天
  const validInitialChats = initialChats.filter((chat) => chat?.id);
  const [chats, setChats] = useState(validInitialChats);
  const [mounted, setMounted] = useState(false);

  // 调试：检查初始数据
  useEffect(() => {
    if (initialChats.length !== validInitialChats.length) {
      console.warn("[Layout] Found invalid chats:", {
        total: initialChats.length,
        valid: validInitialChats.length,
        invalid: initialChats.filter((c) => !c || !c.id),
      });
    }
  }, [initialChats, validInitialChats]);

  // 确保在客户端挂载后再应用条件样式
  useEffect(() => {
    setMounted(true);
  }, []);

  // 当进入聊天时，立即清除未读数（乐观更新）
  useEffect(() => {
    if (!chatId) return;

    setChats((prev) => {
      // 过滤掉无效的聊天记录
      const validChats = prev.filter((c) => c?.id);

      const chatIndex = validChats.findIndex((c) => c.id === chatId);
      if (chatIndex === -1) return validChats;

      // 如果已经是 0，不需要更新
      if (validChats[chatIndex].unreadCount === 0) return validChats;

      const updatedChats = [...validChats];
      updatedChats[chatIndex] = {
        ...updatedChats[chatIndex],
        unreadCount: 0,
      };

      return updatedChats;
    });
  }, [chatId]);

  // 监听标记已读事件（备用机制）
  useEffect(() => {
    const handleChatRead = (event: CustomEvent) => {
      const { chatId: readChatId } = event.detail;

      setChats((prev) => {
        // 过滤掉无效的聊天记录
        const validChats = prev.filter((c) => c?.id);

        const chatIndex = validChats.findIndex((c) => c.id === readChatId);
        if (chatIndex === -1) return validChats;

        const updatedChats = [...validChats];
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          unreadCount: 0,
        };

        return updatedChats;
      });
    };

    window.addEventListener("chat:read", handleChatRead as EventListener);

    return () => {
      window.removeEventListener("chat:read", handleChatRead as EventListener);
    };
  }, []);

  // Socket 监听新聊天
  useEffect(() => {
    if (!socket || !socket.connected) {
      return;
    }

    const handleNewChat = (newChat: ChatType) => {
      setChats((prev) => {
        if (prev.some((c) => c.id === newChat.id)) {
          return prev;
        }
        return [newChat, ...prev];
      });
    };

    const handleChatUpdate = (data: {
      chatId: string;
      lastMessage: MessageType;
    }) => {
      setChats((prev) => {
        // 过滤掉无效的聊天记录
        const validChats = prev.filter((c) => c?.id);

        const chatIndex = validChats.findIndex((c) => c.id === data.chatId);
        if (chatIndex === -1) {
          return validChats;
        }

        const updatedChats = [...validChats];
        const chat = updatedChats[chatIndex];

        // 判断是否增加未读数
        const isCurrentChat = chatId === data.chatId;
        const isSender = data.lastMessage.sender?.id === currentUser.id;
        const shouldIncrementUnread = !isCurrentChat && !isSender;

        const updatedChat = {
          ...chat,
          lastMessage: data.lastMessage,
          unreadCount: shouldIncrementUnread
            ? (chat.unreadCount || 0) + 1
            : chat.unreadCount,
        };

        // 移到列表顶部
        updatedChats.splice(chatIndex, 1);
        return [updatedChat, ...updatedChats];
      });
    };

    socket.on("chat:new", handleNewChat);
    socket.on("chat:update", handleChatUpdate);

    return () => {
      socket.off("chat:new", handleNewChat);
      socket.off("chat:update", handleChatUpdate);
    };
  }, [socket, socket?.connected, chatId, currentUser.id]);

  return (
    <AppWrapper>
      <div
        className={cn("lg:block", mounted && chatId ? "hidden" : "block")}
        suppressHydrationWarning
      >
        <AsideBar />
      </div>

      <div className={cn("h-full flex ml-14 md:ml-16 lg:ml-14")}>
        <div
          className={cn(
            "lg:block lg:w-auto",
            mounted && chatId ? "hidden" : "block w-full",
          )}
          suppressHydrationWarning
        >
          <ChatListDisplay
            chats={chats}
            users={allUsers}
            currentUser={currentUser}
          />
        </div>

        <div
          className={cn(
            "lg:flex-1 lg:block",
            mounted && chatId ? "block w-full" : "hidden",
          )}
          suppressHydrationWarning
        >
          {children}
        </div>
      </div>
    </AppWrapper>
  );
}
