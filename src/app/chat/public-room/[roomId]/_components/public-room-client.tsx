"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import ChatBody from "@/components/chat/chat-body";
import ChatHeader from "@/components/chat/chat-header";
import EmptyState from "@/components/empty-state";
import PublicRoomChatFooter from "@/components/public-room/public-room-chat-footer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSocket } from "@/hooks/use-socket";
import {
  getRoomMessagesPage,
  joinPublicRoom,
  markRoomAsRead,
} from "@/lib/server/actions/public-room";
import type { PublicRoomWithDetails, RoomMessageWithSender } from "@/types";

const PAGE_SIZE = 30;

interface PublicRoomClientProps {
  room: PublicRoomWithDetails;
  initialMessages: RoomMessageWithSender[];
  roomId: string;
  currentUserId: string;
  isMember: boolean;
  initialHasMore: boolean;
  initialStartIndex: number;
}

interface RoomMember {
  userId?: string;
  user?: {
    id: string;
  };
}

interface RoomUpdateData {
  id: string;
  name?: string;
  avatar?: string;
  description?: string;
  members?: RoomMember[];
  memberCount?: number;
  _count?: {
    members: number;
  };
}

export default function PublicRoomClient({
  room,
  initialMessages,
  roomId,
  currentUserId,
  isMember: initialIsMember,
  initialHasMore,
  initialStartIndex,
}: PublicRoomClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<RoomMessageWithSender[]>([]);
  const [replyTo, setReplyTo] = useState<RoomMessageWithSender | null>(null);
  const [isMember, setIsMember] = useState(initialIsMember);
  const [isJoining, startJoinTransition] = useTransition();
  const [roomData, setRoomData] = useState(room);
  const { socket } = useSocket();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [startIndex, setStartIndex] = useState(initialStartIndex);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // 使用稳定的连接状态值
  const socketConnected = socket?.connected ?? false;

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

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

      const result = await getRoomMessagesPage(roomId, {
        skip: nextStartIndex,
        take: nextTake,
      });

      if (result.success && result.data) {
        const data = result.data as {
          messages: RoomMessageWithSender[];
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
  }, [hasMore, isLoadingMore, roomId, startIndex]);

  // 添加乐观消息
  const addOptimisticMessage = (
    content?: string,
    image?: string,
    tempId?: string,
  ) => {
    if (!content && !image) return null;

    const optimisticMessage = {
      id: tempId || `temp-${Date.now()}-${Math.random()}`,
      content: content || "",
      image: image || null,
      roomId: roomId,
      senderId: currentUserId,
      sender: {
        id: currentUserId,
        name: "You",
        email: "",
        avatar: null,
        bio: null,
        clerkId: "",
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      replyToId: null,
      isSystemMessage: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      _optimistic: true,
      _sending: true,
    } as RoomMessageWithSender & {
      _optimistic: boolean;
      _sending: boolean;
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    return optimisticMessage;
  };

  // 添加真实消息
  const addRealMessage = useCallback((realMessage: RoomMessageWithSender) => {
    setMessages((prev) => {
      // 移除乐观消息
      const withoutOptimistic = prev.filter((m) => {
        const isOptimistic = "_optimistic" in m && m._optimistic;
        return !isOptimistic;
      });
      // 检查是否已存在
      if (withoutOptimistic.some((m) => m.id === realMessage.id)) {
        return withoutOptimistic;
      }
      return [...withoutOptimistic, realMessage];
    });
  }, []);

  // 标记消息发送失败
  const markMessageAsFailed = (tempId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === tempId && "_sending" in m) {
          return {
            ...m,
            _sending: false,
            _failed: true,
          };
        }
        return m;
      }),
    );
  };

  const chat = useMemo(
    () => ({
      ...roomData,
      isMember,
    }),
    [roomData, isMember],
  );

  // 加入房间并监听消息
  useEffect(() => {
    if (!socketConnected || !socket || !roomId) return;

    socket.emit("chat:join", roomId, (error?: string) => {
      if (error) {
        console.error("[Room Client] Failed to join room:", error);
        toast.error("Failed to join room");
      }
    });

    // 监听新消息
    const handleNewMessage = (msg: RoomMessageWithSender) => {
      if (msg.roomId === roomId) {
        addRealMessage(msg);
      }
    };

    socket.on("message:new", handleNewMessage);

    // 清理函数
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.emit("chat:leave", roomId);
    };
  }, [socketConnected, socket, roomId, addRealMessage]);

  useEffect(() => {
    if (!roomId || !isMember) return;

    const markAsRead = async () => {
      await markRoomAsRead(roomId).catch(() => {});
    };

    markAsRead();
  }, [roomId, isMember]);

  useEffect(() => {
    if (!socketConnected || !socket) return;

    const handleRoomUpdated = (updatedRoom: RoomUpdateData) => {
      if (updatedRoom.id === roomId) {
        setRoomData((prev) => {
          // members 可能是完整的对象数组，需要保持原始结构
          const members =
            (updatedRoom.members as typeof prev.members) || prev.members;

          // 获取成员数量：优先使用 _count.members，其次使用数组长度
          const memberCount =
            updatedRoom._count?.members ||
            updatedRoom.memberCount ||
            (Array.isArray(members) ? members.length : 0);

          // 检查当前用户是否在成员列表中
          if (Array.isArray(members) && members.length > 0) {
            const isCurrentUserMember = members.some((member: RoomMember) => {
              // 支持两种数据结构：{ userId: string } 或 { user: { id: string } }
              const memberId = member.userId || member.user?.id;
              return memberId === currentUserId;
            });
            setIsMember(isCurrentUserMember);
          }

          return {
            ...prev,
            name: updatedRoom.name || prev.name,
            avatar: updatedRoom.avatar || prev.avatar,
            description: updatedRoom.description ?? prev.description,
            members,
            memberCount,
            _count: {
              ...prev._count,
              members: memberCount,
            },
          };
        });
      }
    };

    socket.on("public-room:updated", handleRoomUpdated);

    return () => {
      socket.off("public-room:updated", handleRoomUpdated);
    };
  }, [socketConnected, roomId, socket, currentUserId]);

  const handleJoinRoom = async () => {
    startJoinTransition(async () => {
      const result = await joinPublicRoom(roomId);
      if (result.success) {
        setIsMember(true);
        router.refresh();
        toast.success(`Welcome to ${chat.name}!`, {
          description: "You can now send messages in this room",
        });
      } else {
        const errorMsg =
          typeof result.error === "string"
            ? result.error
            : "Failed to join room";
        toast.error(errorMsg);
      }
    });
  };

  return (
    <div
      className="relative h-svh flex flex-col animate-slide-in-left lg:animate-none"
      data-chat-container
    >
      <ChatHeader
        chat={chat}
        currentUserId={currentUserId}
        isPublicRoom={true}
        isMember={isMember}
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
            title={isMember ? "Start a conversation" : "No messages yet"}
            description={
              isMember
                ? "No messages yet. Send the first message"
                : "Be the first to join and send a message"
            }
          />
        ) : (
          <ChatBody
            messages={messages.map((msg) => ({
              ...msg,
              chatId: msg.roomId,
            }))}
            onReply={(msg) => {
              const roomMsg: RoomMessageWithSender = {
                ...msg,
                roomId: msg.chatId,
              };
              setReplyTo(roomMsg);
            }}
            currentUserId={currentUserId}
            scrollElementRef={scrollContainerRef}
            showLoadMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadOlderMessages}
            shouldAutoScroll={shouldAutoScroll}
          />
        )}
      </div>

      {!isMember ? (
        <div className="border-t px-4 py-3 bg-background">
          <Button
            onClick={handleJoinRoom}
            disabled={isJoining}
            className="w-full"
            size="lg"
          >
            {isJoining && <Spinner className="mr-2 w-4 h-4" />}
            <LogIn className="w-4 h-4 mr-2" />
            Join Room to Send Messages
          </Button>
        </div>
      ) : (
        <PublicRoomChatFooter
          chatId={roomId}
          currentUserId={currentUserId}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onOptimisticMessage={({
            content,
            image,
            tempId,
          }: {
            content?: string;
            image?: string;
            tempId: string;
          }) => addOptimisticMessage(content, image, tempId)}
          onMessageSuccess={(msg: RoomMessageWithSender) => addRealMessage(msg)}
          onMessageFailed={(tempId: string) => markMessageAsFailed(tempId)}
        />
      )}
    </div>
  );
}
