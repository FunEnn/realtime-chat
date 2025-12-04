"use client";

import { memo, useTransition } from "react";
import { toast } from "sonner";
import SharedChatFooter from "@/components/shared/shared-chat-footer";
import { sendRoomMessage } from "@/lib/server/actions/public-room";
import type { MessageWithSender, RoomMessageWithSender } from "@/types";

interface PublicRoomChatFooterProps {
  chatId: string | null;
  currentUserId: string | null;
  replyTo: RoomMessageWithSender | null;
  onCancelReply: () => void;
  onOptimisticMessage?: (data: {
    content?: string;
    image?: string;
    tempId: string;
  }) => void;
  onMessageSuccess?: (message: RoomMessageWithSender) => void;
  onMessageFailed?: (tempId: string) => void;
}

const PublicRoomChatFooter = memo(
  ({
    chatId,
    currentUserId,
    replyTo,
    onCancelReply,
    onOptimisticMessage,
    onMessageSuccess,
    onMessageFailed,
  }: PublicRoomChatFooterProps) => {
    const [isPending, startTransition] = useTransition();

    const handleSendMessage = async (payload: {
      chatId: string | null;
      content?: string;
      image?: string;
      replyTo?: MessageWithSender | null;
    }) => {
      const roomId = payload.chatId;
      if (!roomId) return;

      const tempId = `temp-${Date.now()}-${Math.random()}`;

      // 乐观更新
      if (onOptimisticMessage) {
        onOptimisticMessage({
          content: payload.content,
          image: payload.image,
          tempId,
        });
      }

      startTransition(async () => {
        const result = await sendRoomMessage({
          roomId,
          content: payload.content,
          image: payload.image,
          replyToId: payload.replyTo?.id,
        });

        if (!result.success) {
          const errorMsg =
            typeof result.error === "string"
              ? result.error
              : "Failed to send message";
          toast.error(errorMsg);
          if (onMessageFailed) {
            onMessageFailed(tempId);
          }
        } else {
          if (result.data && onMessageSuccess) {
            onMessageSuccess(result.data as RoomMessageWithSender);
          }
        }
      });
    };

    return (
      <SharedChatFooter
        chatId={chatId}
        currentUserId={currentUserId}
        replyTo={
          replyTo
            ? ({
                ...replyTo,
                chatId: replyTo.roomId,
              } as MessageWithSender)
            : null
        }
        onCancelReply={onCancelReply}
        isSendingMsg={isPending}
        sendMessage={handleSendMessage}
        showReplyBar={true}
      />
    );
  },
);

PublicRoomChatFooter.displayName = "PublicRoomChatFooter";

export default PublicRoomChatFooter;
