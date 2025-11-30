"use client";

import { LogIn, LogOut, Send, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-clerk-auth";
import { usePublicRoom } from "@/hooks/use-public-room";
import { useSocket } from "@/hooks/use-socket";
import { API } from "@/lib/axios-client";
import type { MessageType } from "@/types/chat.type";

export default function PublicRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { user } = useAuth();
  const { socket } = useSocket();
  const {
    currentRoom,
    isRoomLoading,
    isJoining,
    isLeaving,
    fetchPublicRoom,
    joinRoom,
    leaveRoom,
    addNewMessage,
    clearCurrentRoom,
  } = usePublicRoom();

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (roomId) {
      fetchPublicRoom(roomId);
    }

    return () => {
      clearCurrentRoom();
    };
  }, [roomId, fetchPublicRoom, clearCurrentRoom]);

  // Socket监听
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleNewMessage = (message: MessageType) => {
      if (message.chatId === roomId) {
        addNewMessage(roomId, message);
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, roomId, addNewMessage]);

  const handleJoinRoom = async () => {
    const success = await joinRoom(roomId);
    if (success) {
      // 重新获取房间信息以获取消息
      fetchPublicRoom(roomId);
    }
  };

  const handleLeaveRoom = async () => {
    const success = await leaveRoom(roomId);
    if (success) {
      router.push("/chat");
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentRoom?.room.isMember) return;

    setIsSending(true);
    try {
      await API.post("/chat/message/send", {
        chatId: roomId,
        content: messageText.trim(),
      });
      setMessageText("");
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isRoomLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Room not found</p>
          <Button
            variant="outline"
            onClick={() => router.push("/chat")}
            className="mt-4"
          >
            Back to Chat
          </Button>
        </div>
      </div>
    );
  }

  const { room, messages } = currentRoom;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {room.avatar ? (
              <img
                src={room.avatar}
                alt={room.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Users className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h2 className="font-semibold">{room.name}</h2>
            <p className="text-xs text-muted-foreground">
              {room.memberCount} members
            </p>
          </div>
        </div>

        {room.isMember && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLeaveRoom}
            disabled={isLeaving}
          >
            {isLeaving ? (
              <Spinner className="w-4 h-4 mr-2" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            Leave
          </Button>
        )}
      </div>

      {/* Description */}
      {room.description && (
        <div className="border-b px-4 py-2 bg-muted/30">
          <p className="text-sm text-muted-foreground">{room.description}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!room.isMember ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Join this room to view and send messages
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${
                message.sender?._id === user?._id
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.sender?._id === user?._id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.sender?._id !== user?._id && (
                  <p className="text-xs font-semibold mb-1">
                    {message.sender?.name}
                  </p>
                )}
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="border-t px-4 py-3">
        {room.isMember ? (
          <div className="flex items-end gap-2">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="resize-none"
              rows={1}
              disabled={isSending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || isSending}
              size="icon"
            >
              {isSending ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleJoinRoom}
            disabled={isJoining}
            className="w-full"
          >
            {isJoining ? (
              <Spinner className="w-4 h-4 mr-2" />
            ) : (
              <LogIn className="w-4 h-4 mr-2" />
            )}
            Join Room
          </Button>
        )}
      </div>
    </div>
  );
}
