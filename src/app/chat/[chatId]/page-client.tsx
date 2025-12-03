"use client";

import { useCallback, useEffect, useState } from "react";
import ChatBody from "@/components/chat/chat-body";
import ChatFooter from "@/components/chat/chat-footer";
import ChatHeader from "@/components/chat/chat-header";
import EmptyState from "@/components/empty-state";
import { useSocket } from "@/hooks/use-socket";
import { markChatAsRead } from "@/lib/server/actions/chat";
import type { ChatType, MessageType } from "@/types/chat.type";

interface SingleChatClientProps {
  initialChat: ChatType;
  initialMessages: MessageType[];
  chatId: string;
  currentUserId: string;
}

export default function SingleChatClient({
  initialChat,
  initialMessages,
  chatId,
  currentUserId,
}: SingleChatClientProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [replyTo, setReplyTo] = useState<MessageType | null>(null);
  const { socket } = useSocket();

  // 乐观更新：立即添加消息到界面
  const addOptimisticMessage = useCallback(
    (payload: { content?: string; image?: string; tempId: string }) => {
      const optimisticMessage: MessageType = {
        id: payload.tempId,
        chatId,
        content: payload.content || "",
        image: payload.image || null,
        sender: {
          id: currentUserId,
          name: "You",
          email: "",
          avatar: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        replyTo: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // @ts-expect-error - 临时标记
        _optimistic: true,
        _sending: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      return optimisticMessage;
    },
    [chatId, currentUserId],
  );

  // 替换乐观消息为真实消息（暂时未使用，保留以备将来使用）
  // const replaceOptimisticMessage = useCallback(
  //   (tempId: string, realMessage: MessageType) => {
  //     setMessages((prev) => {
  //       const updated = prev.map((m) => (m._id === tempId ? realMessage : m));
  //       return updated;
  //     });
  //   },
  //   [],
  // );

  // 添加真实消息（用于 Server Action 回退）
  const addRealMessage = useCallback((realMessage: MessageType) => {
    // 清除回退 timer（如果有的话）
    if (typeof window !== "undefined" && (window as any).__lastMessageTimer) {
      clearTimeout((window as any).__lastMessageTimer);
      (window as any).__lastMessageTimer = null;
    }

    setMessages((prev) => {
      // 检查是否已存在
      if (prev.some((m) => m.id === realMessage.id)) {
        return prev;
      }

      // 移除所有乐观消息，添加真实消息
      // @ts-expect-error
      const withoutOptimistic = prev.filter((m) => !m._optimistic);
      return [...withoutOptimistic, realMessage];
    });
  }, []);

  // 标记消息发送失败
  const markMessageAsFailed = useCallback((tempId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === tempId ? { ...m, _sending: false, _failed: true } : m,
      ),
    );
  }, []);

  // Socket 加入聊天室
  useEffect(() => {
    if (!socket || !chatId || !socket.connected) {
      return;
    }

    socket.emit("chat:join", chatId, (error?: string) => {
      if (error) {
        console.error("[Socket] Failed to join chat:", error);
      }
    });

    return () => {
      socket.emit("chat:leave", chatId);
    };
  }, [socket, socket?.connected, chatId]);

  // 标记已读（只执行一次，当组件挂载时）
  useEffect(() => {
    if (!chatId) return;

    let cancelled = false;

    markChatAsRead(chatId)
      .then(() => {
        if (cancelled) return;

        // 通知父组件清除未读数
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("chat:read", {
              detail: { chatId },
            }),
          );
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[Chat] Failed to mark as read:", err);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]); // 只执行一次，chatId 通过 key prop 控制组件重新挂载

  // Socket 监听新消息
  useEffect(() => {
    if (!socket || !socket.connected) {
      return;
    }

    const handleNewMessage = (message: MessageType) => {
      // 清除回退 timer（Socket 正常工作）
      if (typeof window !== "undefined" && (window as any).__lastMessageTimer) {
        clearTimeout((window as any).__lastMessageTimer);
        (window as any).__lastMessageTimer = null;
      }

      if (message.chatId === chatId) {
        setMessages((prev) => {
          // 检查是否已存在（避免重复）
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }

          // 如果是自己发送的消息，可能已经作为乐观更新存在
          // 移除所有乐观消息，添加真实消息
          // @ts-expect-error
          const withoutOptimistic = prev.filter((m) => !m._optimistic);
          return [...withoutOptimistic, message];
        });
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, socket?.connected, chatId]);

  return (
    <div
      className="relative h-svh flex flex-col animate-slide-in-left lg:animate-none"
      data-chat-container
    >
      <ChatHeader chat={initialChat} currentUserId={currentUserId} />

      <div className="flex-1 overflow-y-auto bg-background">
        {messages.length === 0 ? (
          <EmptyState
            title="Start a conversation"
            description="No messages yet. Send the first message"
          />
        ) : (
          <ChatBody
            chatId={chatId}
            messages={messages}
            onReply={setReplyTo}
            currentUserId={currentUserId}
          />
        )}
      </div>

      <ChatFooter
        replyTo={replyTo}
        chatId={chatId}
        currentUserId={currentUserId}
        onCancelReply={() => setReplyTo(null)}
        onOptimisticMessage={addOptimisticMessage}
        onMessageFailed={markMessageAsFailed}
        onMessageSuccess={addRealMessage}
      />
    </div>
  );
}
