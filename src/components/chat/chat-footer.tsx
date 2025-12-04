"use client";

import { memo, useState } from "react";
import { toast } from "sonner";
import SharedChatFooter from "@/components/shared/shared-chat-footer";
import { sendMessage } from "@/lib/server/actions/chat";
import type { MessageWithSender } from "@/types";

interface ChatFooterProps {
  chatId: string | null;
  currentUserId: string | null;
  replyTo: MessageWithSender | null;
  onCancelReply: () => void;
  onOptimisticMessage?: (payload: {
    content?: string;
    image?: string;
    tempId: string;
  }) => void;
  onMessageFailed?: (tempId: string) => void;
  onMessageSuccess?: (message: MessageWithSender) => void;
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
      replyTo?: MessageWithSender | null;
    }) => {
      if (!payload.chatId) return;

      const tempId = `temp-${Date.now()}-${Math.random()}`;

      if (onOptimisticMessage) {
        onOptimisticMessage({
          content: payload.content,
          image: payload.image,
          tempId,
        });
      }

      setIsSending(true);

      try {
        const result = await sendMessage({
          chatId: payload.chatId,
          content: payload.content,
          image: payload.image,
          replyToId: payload.replyTo?.id,
        });

        if (!result.success) {
          const errorMessage =
            typeof result.error === "string"
              ? result.error
              : result.error?.message || "Failed to send message";
          toast.error(errorMessage);
          if (onMessageFailed) {
            onMessageFailed(tempId);
          }
        } else {
          if (result.data && onMessageSuccess) {
            const fallbackTimer = setTimeout(() => {
              onMessageSuccess(result.data as MessageWithSender);
            }, 500);

            window.__lastMessageTimer = fallbackTimer;
          }
        }
      } catch (error) {
        console.error("Failed to send message:", error);
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
