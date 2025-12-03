"use client";

import { usePathname } from "next/navigation";
import { memo, useMemo } from "react";
import AvatarWithBadge from "@/components/shared/avatar-with-badge";
import { useMounted } from "@/hooks/use-mounted";
import { useSocket } from "@/hooks/use-socket";
import { cn } from "@/lib/utils";
import { formatChatTime, getOtherUserAndGroup } from "@/lib/utils/user-utils";
import type { ChatType } from "@/types/chat.type";

interface PropsType {
  chat: ChatType;
  currentUserId: string | null;
  onClick?: () => void;
}

const ChatListItem = memo(({ chat, currentUserId, onClick }: PropsType) => {
  const pathname = usePathname();
  const { lastMessage, createdAt } = chat;
  const isMounted = useMounted();
  const { onlineUsers } = useSocket(); // ✅ 订阅在线用户状态

  const { name, avatar, isOnline, isGroup } = useMemo(
    () => getOtherUserAndGroup(chat, currentUserId, isMounted),
    [chat, currentUserId, isMounted], // ✅ 添加 onlineUsers 依赖
  );

  // 格式化时间（仅在客户端）
  const formattedTime = isMounted
    ? formatChatTime(lastMessage?.updatedAt || createdAt)
    : "";

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
        "w-full flex items-center gap-2 p-1.5 md:p-2 rounded-sm hover:bg-sidebar-accent transition-colors text-left relative",
        pathname.includes(chat.id) && "!bg-sidebar-accent",
      )}
    >
      <div className="relative">
        <AvatarWithBadge
          name={name}
          src={avatar}
          isGroup={isGroup}
          isOnline={isOnline}
          size="w-10 h-10 md:w-11 md:h-11"
        />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold text-white bg-red-500 rounded-full border-2 border-background">
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
