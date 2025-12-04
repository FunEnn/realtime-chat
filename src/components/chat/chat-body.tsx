"use client";

import { memo, useEffect, useRef } from "react";
import type { MessageWithSender } from "@/types";
import ChatBodyMessage from "./chat-body-message";

interface ChatBodyProps {
  messages: MessageWithSender[];
  onReply: (message: MessageWithSender) => void;
  currentUserId?: string;
}

const ChatBody = memo(({ messages, onReply, currentUserId }: ChatBodyProps) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isFirstRender = useRef(true);

  // Socket 消息监听已移至父组件 (page-client.tsx)
  // 这里只负责展示通过 props 传入的 messages

  useEffect(() => {
    if (!messages.length) return;

    // 首次渲染使用 instant，后续使用 smooth
    bottomRef.current?.scrollIntoView({
      behavior: isFirstRender.current ? "instant" : "smooth",
    });

    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, [messages]);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col px-3 py-2">
      {messages
        .filter((message) => {
          if (!message || typeof message !== "object" || !message.id) {
            console.error("Invalid message object:", message);
            return false;
          }
          return true;
        })
        .map((message) => (
          <ChatBodyMessage
            key={message.id}
            message={message}
            onReply={onReply}
            currentUserId={currentUserId}
          />
        ))}
      <div ref={bottomRef} />
    </div>
  );
});

ChatBody.displayName = "ChatBody";

export default ChatBody;
