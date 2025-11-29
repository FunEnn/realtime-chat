"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useMemo } from "react";
import { getOtherUserAndGroup } from "@/lib/helper";
import type { ChatType } from "@/types/chat.type";
import AvatarWithBadge from "../avatar-with-badge";

interface ChatHeaderProps {
  chat: ChatType;
  currentUserId: string | null;
}

const ChatHeader = memo(({ chat, currentUserId }: ChatHeaderProps) => {
  const router = useRouter();
  const {
    name,
    subheading,
    avatar,
    isOnline,
    isGroup,
    onlineCount,
    totalMembers,
  } = useMemo(
    () => getOtherUserAndGroup(chat, currentUserId),
    [chat, currentUserId],
  );

  return (
    <div className="sticky top-0 flex items-center gap-5 border-b border-border bg-card px-2 z-50">
      <div className="h-14 px-4 flex items-center">
        <div>
          <ArrowLeft
            className="w-5 h-5 inline-block lg:hidden text-muted-foreground cursor-pointer mr-2"
            onClick={() => router.push("/chat")}
          />
        </div>
        <AvatarWithBadge
          name={name}
          src={avatar}
          isGroup={isGroup}
          isOnline={isOnline}
        />
        <div className="ml-2">
          <h5 className="font-semibold">{name}</h5>
          {isGroup && onlineCount !== undefined ? (
            <p className="text-sm text-muted-foreground">
              {onlineCount > 0 && (
                <>
                  <span className="text-green-500">{onlineCount} online</span>
                  {" • "}
                </>
              )}
              {totalMembers} members
            </p>
          ) : (
            <p
              className={`text-sm ${
                isOnline ? "text-green-500" : "text-muted-foreground"
              }`}
            >
              {subheading}
            </p>
          )}
        </div>
      </div>
      <div>
        <div className="flex-1 text-center py-4 h-full border-b-2 border-primary font-medium text-primary">
          Chat
        </div>
      </div>
    </div>
  );
});

ChatHeader.displayName = "ChatHeader";

export default ChatHeader;
