"use client";

import { LogIn } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import ChatBody from "@/components/chat/chat-body";
import ChatHeader from "@/components/chat/chat-header";
import PublicRoomChatFooter from "@/components/chat/public-room-chat-footer";
import EmptyState from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-clerk-auth";
import { usePublicRoom } from "@/hooks/use-public-room";
import { useSocket } from "@/hooks/use-socket";
import type { MessageType, PublicRoomChatType } from "@/types/chat.type";

const PublicRoomPage = () => {
  const params = useParams();
  const roomId = params?.roomId as string;

  const {
    fetchPublicRoom,
    isRoomLoading,
    currentRoom,
    joinRoom,
    isJoining,
    clearCurrentRoom,
    addNewMessage,
  } = usePublicRoom();
  const { socket } = useSocket();
  const { user } = useAuth();

  const [replyTo, setReplyTo] = useState<MessageType | null>(null);

  const currentUserId = useMemo(() => user?._id || null, [user?._id]);
  const _isAdmin = useMemo(() => user?.isAdmin || false, [user?.isAdmin]);

  const chat = useMemo(() => {
    if (!currentRoom?.room) return null;
    const room = currentRoom.room;
    return {
      _id: room._id,
      lastMessage: null,
      isGroup: true,
      isAiChat: false,
      createdBy:
        typeof room.createdBy === "string"
          ? room.createdBy
          : room.createdBy._id,
      groupName: room.name,
      groupAvatar: room.avatar,
      unreadCount: 0,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      name: room.name,
      description: room.description,
      avatar: room.avatar,
      members: room.members,
      memberCount: room.memberCount,
    } as PublicRoomChatType;
  }, [currentRoom?.room]);

  const messages = useMemo(
    () => currentRoom?.messages || [],
    [currentRoom?.messages],
  );

  const isChatMismatch = useMemo(
    () => chat && chat._id !== roomId,
    [chat, roomId],
  );

  const handleCancelReply = useCallback(() => setReplyTo(null), []);

  useEffect(() => {
    if (!roomId) return;

    fetchPublicRoom(roomId);

    return () => {
      clearCurrentRoom();
    };
  }, [roomId, fetchPublicRoom, clearCurrentRoom]);

  // Socket Chat room
  useEffect(() => {
    if (!roomId || !socket) return;

    socket.emit("chat:join", roomId);
    return () => {
      socket.emit("chat:leave", roomId);
    };
  }, [roomId, socket]);

  // Socket message listener
  useEffect(() => {
    if (!roomId || !socket) return;

    const handleNewMessage = (msg: MessageType) => {
      addNewMessage(roomId, msg);
    };

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, roomId, addNewMessage]);

  // 监听自己发送的消息（乐观更新后的真实消息）
  useEffect(() => {
    if (!roomId || !socket || !user) return;

    const handleOwnMessage = (msg: MessageType) => {
      if (msg.sender && msg.sender._id === user._id) {
        addNewMessage(roomId, msg);
      }
    };

    // 监听发送成功的消息
    socket.on("message:sent", handleOwnMessage);
    return () => {
      socket.off("message:sent", handleOwnMessage);
    };
  }, [socket, roomId, user, addNewMessage]);

  const isMember = currentRoom?.room.isMember || false;

  const handleJoinRoom = async () => {
    if (roomId) {
      const success = await joinRoom(roomId);
      if (success) {
        // 重新获取房间信息
        fetchPublicRoom(roomId);
      }
    }
  };

  if (isRoomLoading || isChatMismatch) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner className="w-11 h-11 text-primary!" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg">Room not found</p>
      </div>
    );
  }

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
          replyTo={replyTo}
          chatId={roomId}
          currentUserId={currentUserId}
          onCancelReply={handleCancelReply}
        />
      )}
    </div>
  );
};

export default PublicRoomPage;
