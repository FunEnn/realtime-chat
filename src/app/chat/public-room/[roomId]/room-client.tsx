"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import ChatBody from "@/components/chat/chat-body";
import ChatHeader from "@/components/chat/chat-header";
import EmptyState from "@/components/empty-state";
import PublicRoomChatFooter from "@/components/public-room/public-room-chat-footer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSocket } from "@/hooks/use-socket";
import { joinPublicRoom } from "@/lib/server/actions/public-room";
import type { MessageType, PublicRoomChatType } from "@/types/chat.type";

interface PublicRoomClientProps {
  room: any;
  initialMessages: any[];
  roomId: string;
  currentUserId: string;
  isMember: boolean;
}

export default function PublicRoomClient({
  room,
  initialMessages,
  roomId,
  currentUserId,
  isMember: initialIsMember,
}: PublicRoomClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [replyTo, setReplyTo] = useState<MessageType | null>(null);
  const [isMember, setIsMember] = useState(initialIsMember);
  const [isJoining, startJoinTransition] = useTransition();
  const { socket } = useSocket();

  // 将 Prisma 格式的消息转换为 MessageType
  useEffect(() => {
    const convertedMessages: MessageType[] = initialMessages.map((msg) => ({
      id: msg.id,
      chatId: roomId,
      content: msg.content,
      image: msg.image,
      sender: msg.sender
        ? {
            id: msg.sender.id,
            name: msg.sender.name || "Unknown",
            email: msg.sender.email,
            avatar: msg.sender.avatar || null,
            createdAt:
              msg.sender.createdAt.toISOString?.() || msg.sender.createdAt,
            updatedAt:
              msg.sender.updatedAt.toISOString?.() || msg.sender.updatedAt,
          }
        : null,
      replyTo: null,
      createdAt: msg.createdAt.toISOString?.() || msg.createdAt,
      updatedAt: msg.updatedAt.toISOString?.() || msg.updatedAt,
    }));
    setMessages(convertedMessages);
  }, [initialMessages, roomId]);

  // 构建聊天信息对象
  const chat: PublicRoomChatType = useMemo(
    () => ({
      id: room.id,
      lastMessage: null,
      isGroup: true,
      isAiChat: false,
      createdBy: room.createdById,
      groupName: room.name,
      groupAvatar: room.avatar,
      unreadCount: 0,
      createdAt: room.createdAt.toISOString?.() || room.createdAt,
      updatedAt: room.updatedAt.toISOString?.() || room.updatedAt,
      name: room.name,
      description: room.description || "",
      avatar: room.avatar,
      members: [],
      memberCount: 0,
    }),
    [room],
  );

  // Socket 加入聊天室
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("chat:join", roomId);

    return () => {
      socket.emit("chat:leave", roomId);
    };
  }, [socket, roomId]);

  // Socket 监听新消息
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: MessageType) => {
      if (msg.chatId === roomId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, roomId]);

  const handleJoinRoom = async () => {
    startJoinTransition(async () => {
      const result = await joinPublicRoom(roomId);
      if (result.success) {
        setIsMember(true);
        router.refresh();
        toast.success("Joined room successfully");
      } else {
        toast.error(result.error || "Failed to join room");
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
      />

      <div className="flex-1 overflow-y-auto bg-background">
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
          <ChatBody chatId={roomId} messages={messages} onReply={setReplyTo} />
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
        />
      )}
    </div>
  );
}
