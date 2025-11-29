"use client";

import { ArrowLeft, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getOtherUserAndGroup } from "@/lib/helper";
import type { ChatType } from "@/types/chat.type";
import AvatarWithBadge from "../avatar-with-badge";
import ChatHistoryDialog from "./chat-history-dialog";

interface ChatHeaderProps {
  chat: ChatType;
  currentUserId: string | null;
}

const ChatHeader = memo(({ chat, currentUserId }: ChatHeaderProps) => {
  const router = useRouter();
  const [_isLeaving, setIsLeaving] = useState(false);
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

  const handleBack = () => {
    setIsLeaving(true);
    const chatContainer = document.querySelector("[data-chat-container]");
    if (chatContainer) {
      chatContainer.classList.add("animate-slide-out-right");
    }
    setTimeout(() => {
      router.push("/chat");
    }, 300);
  };

  return (
    <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-2 md:px-2 z-50">
      <div className="h-12 md:h-14 px-2 md:px-4 flex items-center flex-1 min-w-0">
        <button
          type="button"
          onClick={handleBack}
          className="lg:hidden mr-2 p-1 rounded-full hover:bg-accent active:bg-accent/80 transition-colors"
          aria-label="Back to chat list"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <AvatarWithBadge
          name={name}
          src={avatar}
          isGroup={isGroup}
          isOnline={isOnline}
        />
        <div className="ml-2 min-w-0 flex-1">
          <h5 className="font-semibold text-sm md:text-base truncate">
            {name}
          </h5>
          {isGroup && onlineCount !== undefined ? (
            <p className="text-xs md:text-sm text-muted-foreground truncate">
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
              className={`text-xs md:text-sm truncate ${
                isOnline ? "text-green-500" : "text-muted-foreground"
              }`}
            >
              {subheading}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 md:gap-2 mr-2 md:mr-4">
        <ChatHistoryDialog
          chatId={chat._id}
          trigger={
            <Button variant="ghost" size="sm" className="h-8 md:h-9">
              <History className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">History</span>
            </Button>
          }
        />
      </div>
    </div>
  );
});

ChatHeader.displayName = "ChatHeader";

export default ChatHeader;
