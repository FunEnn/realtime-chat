"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppWrapper from "@/components/app-wrapper";
import AsideBar from "@/components/aside-bar";
import ChatListDisplay from "@/components/chat/chat-list-display";
import { useChatId } from "@/hooks/use-chat-id";
import { useSocket } from "@/hooks/use-socket";
import { cn } from "@/lib/utils";
import type { ChatWithDetails, MessageWithSender, User } from "@/types";

interface ChatLayoutClientProps {
  children: React.ReactNode;
  initialChats: ChatWithDetails[];
  allUsers: User[];
  currentUser: User;
}

export default function ChatLayoutClient({
  children,
  initialChats,
  allUsers,
  currentUser,
}: ChatLayoutClientProps) {
  const router = useRouter();
  const chatId = useChatId();
  const { socket } = useSocket();

  // 过滤掉无效的聊天
  const validInitialChats = initialChats.filter((chat) => chat?.id);
  const [chats, setChats] = useState(validInitialChats);
  const [mounted, setMounted] = useState(false);

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

    const handleNewChat = (newChat: ChatWithDetails) => {
      setChats((prev) => {
        if (prev.some((c) => c.id === newChat.id)) {
          return prev;
        }
        return [newChat, ...prev];
      });
    };

    const handleChatUpdate = (data: {
      chatId: string;
      lastMessage: MessageWithSender;
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

    const handleChatDeleted = (data: { chatId: string }) => {
      setChats((prev) => prev.filter((c) => c.id !== data.chatId));

      // 如果用户正在被删除的聊天中，跳转到聊天列表
      if (chatId === data.chatId) {
        router.push("/chat");
      }
    };

    const handleChatInfoUpdated = (updatedChat: ChatWithDetails) => {
      setChats((prev) => {
        const validChats = prev.filter((c) => c?.id);
        const chatIndex = validChats.findIndex((c) => c.id === updatedChat.id);

        if (chatIndex === -1) {
          return validChats;
        }

        const updatedChats = [...validChats];
        // 保留未读数和最后消息，只更新基本信息
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          name: updatedChat.name,
          avatar: updatedChat.avatar,
          description: updatedChat.description,
          groupName: updatedChat.groupName,
          groupAvatar: updatedChat.groupAvatar,
          participants: updatedChat.participants,
        };

        return updatedChats;
      });
    };

    socket.on("chat:new", handleNewChat);
    socket.on("chat:update", handleChatUpdate);
    socket.on("chat:deleted", handleChatDeleted);
    socket.on("chat:info-updated", handleChatInfoUpdated);

    return () => {
      socket.off("chat:new", handleNewChat);
      socket.off("chat:update", handleChatUpdate);
      socket.off("chat:deleted", handleChatDeleted);
      socket.off("chat:info-updated", handleChatInfoUpdated);
    };
  }, [socket, socket?.connected, chatId, currentUser.id, router]);

  return (
    <AppWrapper>
      <div
        className={cn(
          "lg:block",
          !mounted ? "block" : chatId ? "hidden" : "block",
        )}
        suppressHydrationWarning
      >
        <AsideBar />
      </div>

      <div className={cn("h-full flex ml-14 md:ml-16 lg:ml-14")}>
        <div
          className={cn(
            "lg:block lg:w-auto",
            !mounted ? "block w-full" : chatId ? "hidden" : "block w-full",
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
            !mounted ? "hidden" : chatId ? "block w-full" : "hidden",
          )}
          suppressHydrationWarning
        >
          {children}
        </div>
      </div>
    </AppWrapper>
  );
}
