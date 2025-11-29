"use client";

import { usePathname } from "next/navigation";
import { memo, useMemo } from "react";
import { formatChatTime, getOtherUserAndGroup } from "@/lib/helper";
import { cn } from "@/lib/utils";
import type { ChatType } from "@/types/chat.type";
import AvatarWithBadge from "../avatar-with-badge";

interface PropsType {
  chat: ChatType;
  currentUserId: string | null;
  onClick?: () => void;
}

const ChatListItem = memo(({ chat, currentUserId, onClick }: PropsType) => {
  const pathname = usePathname();
  const { lastMessage, createdAt } = chat;

  const { name, avatar, isOnline, isGroup } = useMemo(
    () => getOtherUserAndGroup(chat, currentUserId),
    [chat, currentUserId],
  );

  const getLastMessageText = () => {
    if (!lastMessage) {
      return isGroup
        ? chat.createdBy === currentUserId
          ? "Group created"
          : "You were added"
        : "Send a message";
    }
    if (lastMessage.image) return "📷 Photo";

    if (isGroup && lastMessage.sender) {
      return `${
        lastMessage.sender._id === currentUserId
          ? "You"
          : lastMessage.sender.name
      }: ${lastMessage.content}`;
    }

    return lastMessage.content;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 p-2 rounded-sm hover:bg-sidebar-accent transition-colors text-left",
        pathname.includes(chat._id) && "!bg-sidebar-accent",
      )}
    >
      <AvatarWithBadge
        name={name}
        src={avatar}
        isGroup={isGroup}
        isOnline={isOnline}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h5 className="text-sm font-semibold truncate">{name}</h5>
          <span className="text-xs ml-2 shrink-0 text-muted-foreground">
            {formatChatTime(lastMessage?.updatedAt || createdAt)}
          </span>
        </div>
        <p className="text-xs truncate text-muted-foreground -mt-px">
          {getLastMessageText()}
        </p>
      </div>
    </button>
  );
});

ChatListItem.displayName = "ChatListItem";

export default ChatListItem;
