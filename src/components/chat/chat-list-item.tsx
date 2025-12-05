"use client";

import { usePathname } from "next/navigation";
import { memo, useMemo } from "react";
import AvatarWithBadge from "@/components/shared/avatar-with-badge";
import { useMounted } from "@/hooks/use-mounted";
import { useSocket } from "@/hooks/use-socket";
import { cn } from "@/lib/utils";
import { getCreatorId, getLastMessage } from "@/lib/utils/type-guards";
import { formatChatTime, getOtherUserAndGroup } from "@/lib/utils/user-utils";
import type { ChatWithDetails } from "@/types";

interface PropsType {
  chat: ChatWithDetails;
  currentUserId: string | null;
  onClick?: () => void;
}

const ChatListItem = memo(({ chat, currentUserId, onClick }: PropsType) => {
  const pathname = usePathname();
  const lastMessage = getLastMessage(chat);
  const { createdAt } = chat;
  const isMounted = useMounted();
  const { onlineUsers } = useSocket();

  const { name, avatar, isOnline, isGroup } = useMemo(
    () => getOtherUserAndGroup(chat, currentUserId, isMounted, onlineUsers),
    [chat, currentUserId, isMounted, onlineUsers],
  );

  // 格式化时间（仅在客户端）
  const formattedTime = isMounted
    ? formatChatTime(lastMessage?.updatedAt || createdAt)
    : "";

  const getLastMessageText = () => {
    if (!lastMessage) {
      const creatorId = getCreatorId(chat);
      return isGroup
        ? creatorId === currentUserId
          ? "Group created"
          : "You were added"
        : "Send a message";
    }
    if (lastMessage.image) return "📷 Photo";

    if (isGroup && lastMessage.sender) {
      return `${
        lastMessage.sender.id === currentUserId
          ? "You"
          : lastMessage.sender.name
      }: ${lastMessage.content}`;
    }

    return lastMessage.content;
  };

  const unreadCount = chat.unreadCount || 0;
  const hasUnread = unreadCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 md:gap-3 p-2.5 md:p-3 rounded-xl hover:bg-sidebar-accent hover:shadow-md transition-all duration-200 text-left relative",
        pathname.includes(chat.id) && "bg-sidebar-accent! shadow-md",
      )}
    >
      <div className="relative">
        <AvatarWithBadge
          name={name}
          src={avatar}
          isGroup={isGroup}
          isOnline={isOnline}
          size="w-11 h-11 md:w-12 md:h-12"
        />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[10px] font-semibold text-white bg-red-500 rounded-full border-2 border-background shadow-md">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h5
            className={cn(
              "text-xs md:text-sm truncate",
              hasUnread ? "font-bold" : "font-semibold",
            )}
          >
            {name}
          </h5>
          <span
            className={cn(
              "text-[10px] md:text-xs ml-2 shrink-0",
              hasUnread
                ? "text-foreground font-semibold"
                : "text-muted-foreground",
            )}
            suppressHydrationWarning
          >
            {formattedTime}
          </span>
        </div>
        <p
          className={cn(
            "text-[10px] md:text-xs truncate -mt-px",
            hasUnread ? "text-foreground font-medium" : "text-muted-foreground",
          )}
        >
          {getLastMessageText()}
        </p>
      </div>
    </button>
  );
});

ChatListItem.displayName = "ChatListItem";

export default ChatListItem;
