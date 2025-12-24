"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChatBody from "@/components/chat/chat-body";
import ChatFooter from "@/components/chat/chat-footer";
import ChatHeader from "@/components/chat/chat-header";
import EmptyState from "@/components/empty-state";
import { useSocket } from "@/hooks/use-socket";
import { getChatMessagesPage, markChatAsRead } from "@/lib/server/actions/chat";
import type {
  ChatWithDetails,
  MessageWithSender,
  OptimisticMessage,
  User,
} from "@/types";

const PAGE_SIZE = 30;

// Extend Window interface to include custom properties
declare global {
  interface Window {
    __lastMessageTimer?: NodeJS.Timeout | null;
  }
}

interface SingleChatClientProps {
  initialChat: ChatWithDetails;
  initialMessages: MessageWithSender[];
  initialHasMore: boolean;
  initialStartIndex: number;
  chatId: string;
  currentUserId: string;
  allUsers?: User[];
}

export default function SingleChatClient({
  initialChat,
  initialMessages,
  initialHasMore,
  initialStartIndex,
  chatId,
  currentUserId,
  allUsers = [],
}: SingleChatClientProps) {
  const [messages, setMessages] =
    useState<MessageWithSender[]>(initialMessages);
  const [replyTo, setReplyTo] = useState<MessageWithSender | null>(null);
  const { socket } = useSocket();

  const [hasMore, setHasMore] = useState(initialHasMore);
  const [startIndex, setStartIndex] = useState(initialStartIndex);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const addOptimisticMessage = useCallback(
    (payload: { content?: string; image?: string; tempId: string }) => {
      const optimisticMessage: OptimisticMessage = {
        id: payload.tempId,
        chatId,
        senderId: currentUserId,
        content: payload.content || "",
        image: payload.image || null,
        sender: {
          id: currentUserId,
          clerkId: "",
          name: "You",
          email: "",
          avatar: null,
          bio: null,
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        replyToId: null,
        replyTo: null,
        isSystemMessage: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        _optimistic: true,
        _sending: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      return optimisticMessage;
    },
    [chatId, currentUserId],
  );

  const addRealMessage = useCallback((realMessage: MessageWithSender) => {
    if (typeof window !== "undefined" && window.__lastMessageTimer) {
      clearTimeout(window.__lastMessageTimer);
      window.__lastMessageTimer = null;
    }

    setMessages((prev) => {
      if (prev.some((m) => m.id === realMessage.id)) {
        return prev;
      }

      const withoutOptimistic = prev.filter(
        (m) => !("_optimistic" in m && (m as OptimisticMessage)._optimistic),
      );
      return [...withoutOptimistic, realMessage];
    });
  }, []);

  const markMessageAsFailed = useCallback((tempId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === tempId && "_sending" in m) {
          return { ...m, _sending: false, _failed: true } as OptimisticMessage;
        }
        return m;
      }),
    );
  }, []);

  const loadOlderMessages = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    const prevScrollTop = container?.scrollTop ?? 0;

    setIsLoadingMore(true);
    setShouldAutoScroll(false);

    try {
      const take = PAGE_SIZE;
      const nextStartIndex = Math.max(0, startIndex - take);
      const nextTake = Math.max(0, startIndex - nextStartIndex);

      const result = await getChatMessagesPage(chatId, {
        skip: nextStartIndex,
        take: nextTake,
      });

      if (result.success && result.data) {
        const data = result.data as {
          messages: MessageWithSender[];
          hasMore: boolean;
          total: number;
        };

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newUnique = data.messages.filter((m) => !existingIds.has(m.id));
          return [...newUnique, ...prev];
        });

        setStartIndex(nextStartIndex);
        setHasMore(nextStartIndex > 0 && data.hasMore);
      }
    } finally {
      setIsLoadingMore(false);

      if (typeof window !== "undefined") {
        requestAnimationFrame(() => {
          const el = scrollContainerRef.current;
          if (!el) return;
          const newScrollHeight = el.scrollHeight;
          el.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
        });
      }
    }
  }, [chatId, hasMore, isLoadingMore, startIndex]);

  useEffect(() => {
    if (!socket || !chatId || !socket.connected) return;

    socket.emit("chat:join", chatId);

    return () => {
      socket.emit("chat:leave", chatId);
    };
  }, [socket?.connected, chatId, socket]);

  useEffect(() => {
    if (!chatId) return;

    let cancelled = false;

    markChatAsRead(chatId)
      .then(() => {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("chat:read", { detail: { chatId } }),
          );
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    if (!socket || !socket.connected) return;

    const handleNewMessage = (message: MessageWithSender) => {
      if (typeof window !== "undefined" && window.__lastMessageTimer) {
        clearTimeout(window.__lastMessageTimer);
        window.__lastMessageTimer = null;
      }

      if (message.chatId === chatId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) {
            return prev;
          }

          const withoutOptimistic = prev.filter(
            (m) =>
              !("_optimistic" in m && (m as OptimisticMessage)._optimistic),
          );
          return [...withoutOptimistic, message];
        });
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket?.connected, chatId, socket]);

  return (
    <div
      className="relative h-svh flex flex-col animate-slide-in-left lg:animate-none"
      data-chat-container
    >
      <ChatHeader
        chat={initialChat}
        currentUserId={currentUserId}
        allUsers={allUsers}
      />

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-background"
        onScroll={() => {
          const el = scrollContainerRef.current;
          if (!el) return;
          const distanceToBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight;
          setShouldAutoScroll(distanceToBottom < 120);
        }}
      >
        {messages.length === 0 ? (
          <EmptyState
            title="Start a conversation"
            description="No messages yet. Send the first message"
          />
        ) : (
          <ChatBody
            messages={messages}
            onReply={setReplyTo}
            currentUserId={currentUserId}
            showLoadMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadOlderMessages}
            shouldAutoScroll={shouldAutoScroll}
            scrollElementRef={scrollContainerRef}
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
