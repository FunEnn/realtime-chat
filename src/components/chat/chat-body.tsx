"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import type { MessageType } from "@/types/chat.type";
import ChatBodyMessage from "./chat-body-message";

interface ChatBodyProps {
  chatId: string | null;
  messages: MessageType[];
  onReply: (message: MessageType) => void;
}

const ChatBody = memo(({ chatId, messages, onReply }: ChatBodyProps) => {
  const { socket } = useSocket();
  const { addNewMessage } = useChat();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handleNewMessage = useCallback(
    (msg: MessageType) => {
      if (chatId) addNewMessage(chatId, msg);
    },
    [chatId, addNewMessage],
  );

  useEffect(() => {
    if (!chatId || !socket) return;

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, chatId, handleNewMessage]);

  useEffect(() => {
    if (!messages.length) return;
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col px-3 py-2">
      {messages
        .filter((message) => {
          if (!message || typeof message !== "object" || !message._id) {
            console.error("Invalid message object:", message);
            return false;
          }
          return true;
        })
        .map((message) => (
          <ChatBodyMessage
            key={message._id}
            message={message}
            onReply={onReply}
          />
        ))}
      <div ref={bottomRef} />
    </div>
  );
});

ChatBody.displayName = "ChatBody";

export default ChatBody;
