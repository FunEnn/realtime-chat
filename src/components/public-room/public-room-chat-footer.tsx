"use client";

import { memo } from "react";
import SharedChatFooter from "@/components/shared/shared-chat-footer";
import { usePublicRoom } from "@/hooks/use-public-room";
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
    const { sendMessage, isSendingMsg } = usePublicRoom();

    return (
      <SharedChatFooter
        chatId={chatId}
        currentUserId={currentUserId}
        replyTo={replyTo}
        onCancelReply={onCancelReply}
        isSendingMsg={isSendingMsg}
        sendMessage={sendMessage}
        showReplyBar={true}
      />
    );
  },
);

PublicRoomChatFooter.displayName = "PublicRoomChatFooter";

export default PublicRoomChatFooter;
