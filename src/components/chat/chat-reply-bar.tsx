"use client";

import { X } from "lucide-react";
import type { MessageType } from "@/types/chat.type";
import { Button } from "../ui/button";

interface Props {
  replyTo: MessageType | null;
  currentUserId: string | null;
  onCancel: () => void;
}

const ChatReplyBar = ({ replyTo, currentUserId, onCancel }: Props) => {
  if (!replyTo) return null;

  const senderName =
    replyTo.sender?.id === currentUserId ? "You" : replyTo.sender?.name;

  return (
    <div className="absolute bottom-[72px] md:bottom-[88px] left-0 right-0 bg-background border-t animate-in slide-in-from-bottom pb-3 md:pb-4 px-3 md:px-6 z-[998]">
      <div className="flex flex-1 justify-between mt-2 p-2 md:p-3 text-xs md:text-sm border-l-4 border-l-primary bg-primary/10 rounded-md shadow-sm">
        <div className="flex-1 min-w-0">
          <h5 className="font-medium truncate">{senderName}</h5>
          {replyTo?.image ? (
            <p className="text-muted-foreground">📷 Photo</p>
          ) : (
            <p className="max-w-4xl truncate text-ellipsis">
              {replyTo.content}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="shrink-0 h-6 w-6"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
};

export default ChatReplyBar;
