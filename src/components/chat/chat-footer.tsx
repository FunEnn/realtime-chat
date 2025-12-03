"use client";

import { memo, useState } from "react";
import { toast } from "sonner";
import SharedChatFooter from "@/components/shared/shared-chat-footer";
import type { MessageType } from "@/types/chat.type";

interface ChatFooterProps {
  chatId: string | null;
  currentUserId: string | null;
  replyTo: MessageType | null;
  onCancelReply: () => void;
  onOptimisticMessage?: (payload: {
    content?: string;
    image?: string;
    tempId: string;
  }) => void;
  onMessageFailed?: (tempId: string) => void;
  onMessageSuccess?: (message: MessageType) => void;
}

const ChatFooter = memo(
  ({
    chatId,
    currentUserId,
    replyTo,
    onCancelReply,
    onOptimisticMessage,
    onMessageFailed,
    onMessageSuccess,
  }: ChatFooterProps) => {
    const [isSending, setIsSending] = useState(false);

    const handleSendMessage = async (payload: {
      chatId: string | null;
      content?: string;
      image?: string;
      replyTo?: MessageType | null;
    }) => {
      if (!payload.chatId) return;

      // 生成临时 ID
      const tempId = `temp-${Date.now()}-${Math.random()}`;

      // 乐观更新：立即显示消息
      if (onOptimisticMessage) {
        onOptimisticMessage({
          content: payload.content,
          image: payload.image,
          tempId,
        });
      }

      setIsSending(true);

      try {
        const response = await fetch(`/api/chat/${payload.chatId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: payload.content,
            image: payload.image,
            replyToId: payload.replyTo?.id,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          console.error("[ChatFooter] Message send failed:", result.error);
          toast.error(result.error?.message || "Failed to send message");
          if (onMessageFailed) {
            onMessageFailed(tempId);
          }
        } else {
          if (result.data && onMessageSuccess) {
            const fallbackTimer = setTimeout(() => {
              onMessageSuccess(result.data as MessageType);
            }, 500);

            // 如果 Socket 正常工作，会先收到消息，这个 timer 会被 cleanup 清除
            (window as any).__lastMessageTimer = fallbackTimer;
          }

          // 主要依赖 Socket 推送真实消息，API 数据作为回退
        }
      } catch (error) {
        console.error("[ChatFooter] API request failed:", error);
        toast.error("Failed to send message");
        if (onMessageFailed) {
          onMessageFailed(tempId);
        }
      } finally {
        setIsSending(false);
      }
    };

    return (
      <SharedChatFooter
        chatId={chatId}
        currentUserId={currentUserId}
        replyTo={replyTo}
        onCancelReply={onCancelReply}
        isSendingMsg={isSending}
        sendMessage={handleSendMessage}
      />
    );
  },
);

ChatFooter.displayName = "ChatFooter";

export default ChatFooter;
