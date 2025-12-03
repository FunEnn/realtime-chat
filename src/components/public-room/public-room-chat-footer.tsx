"use client";

import { memo, useTransition } from "react";
import { toast } from "sonner";
import SharedChatFooter from "@/components/shared/shared-chat-footer";
import { sendRoomMessage } from "@/lib/server/actions/public-room";
import type { MessageType } from "@/types/chat.type";

interface PublicRoomChatFooterProps {
  chatId: string | null;
  currentUserId: string | null;
  replyTo: MessageType | null;
  onCancelReply: () => void;
}

const PublicRoomChatFooter = memo(
  ({
    chatId,
    currentUserId,
    replyTo,
    onCancelReply,
  }: PublicRoomChatFooterProps) => {
    const [isPending, startTransition] = useTransition();

    const handleSendMessage = async (payload: {
      chatId: string | null;
      content?: string;
      image?: string;
      replyTo?: MessageType | null;
    }) => {
      if (!payload.chatId) return;

      startTransition(async () => {
        const result = await sendRoomMessage({
          roomId: payload.chatId!,
          content: payload.content,
          image: payload.image,
          replyToId: payload.replyTo?.id,
        });

        if (!result.success) {
          toast.error(result.error || "Failed to send message");
        }
      });
    };

    return (
      <SharedChatFooter
        chatId={chatId}
        currentUserId={currentUserId}
        replyTo={replyTo}
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
