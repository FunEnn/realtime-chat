"use client";

import { Reply } from "lucide-react";
import { memo, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-clerk-auth";
import { formatChatTime } from "@/lib/helper";
import { cn } from "@/lib/utils";
import type { MessageType } from "@/types/chat.type";
import AvatarWithBadge from "../avatar-with-badge";
import { Button } from "../ui/button";

interface Props {
  message: MessageType;
  onReply: (message: MessageType) => void;
}

const ChatBodyMessage = memo(({ message, onReply }: Props) => {
  const { user } = useAuth();
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const userId = user?._id || null;
  const isCurrentUser = message.sender?._id === userId;
  const senderName = isCurrentUser ? "You" : message.sender?.name;

  const replySendername =
    message.replyTo?.sender?._id === userId
      ? "You"
      : message.replyTo?.sender?.name;

  const containerClass = cn(
    "group flex gap-1.5 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4",
    isCurrentUser && "flex-row-reverse text-left",
  );

  const contentWrapperClass = cn(
    "max-w-[75%] sm:max-w-[70%] flex flex-col relative",
    isCurrentUser && "items-end",
  );

  const messageClass = cn(
    "min-w-[150px] sm:min-w-[200px] px-2.5 sm:px-3 py-2 text-xs sm:text-sm break-words shadow-sm",
    isCurrentUser
      ? "bg-accent dark:bg-primary/40 rounded-tr-xl rounded-l-xl"
      : "bg-[#F5F5F5] dark:bg-accent rounded-bl-xl rounded-r-xl",
  );

  const replyBoxClass = cn(
    "mb-2 p-2 text-xs rounded-md border-l-4 shadow-md !text-left",
    isCurrentUser
      ? "bg-primary/20 border-l-primary"
      : "bg-gray-200 dark:bg-secondary border-l-[#CC4A31]",
  );

  const handleTouchStart = useCallback(() => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onReply(message);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  }, [message, onReply]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  return (
    <div className={containerClass}>
      {!isCurrentUser && (
        <div className="flex-shrink-0 flex items-start">
          <AvatarWithBadge
            name={message.sender?.name || "No name"}
            src={message.sender?.avatar || undefined}
          />
        </div>
      )}

      <div className={contentWrapperClass}>
        <div
          className={cn(
            "flex items-center gap-1",
            isCurrentUser && "flex-row-reverse",
          )}
        >
          <div
            className={messageClass}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onTouchMove={handleTouchCancel}
          >
            {/* Header */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 pb-1">
              <span className="text-[11px] sm:text-xs font-semibold">
                {senderName}
              </span>
              <span className="text-[10px] sm:text-[11px] text-gray-700 dark:text-gray-300">
                {formatChatTime(message?.createdAt)}
              </span>
            </div>

            {/* Reply To Box */}
            {message.replyTo && (
              <div className={replyBoxClass}>
                <h5 className="font-medium text-[11px] sm:text-xs">
                  {replySendername}
                </h5>
                <p className="font-normal text-muted-foreground max-w-[200px] sm:max-w-[250px] truncate text-[10px] sm:text-xs">
                  {message?.replyTo?.content ||
                    (message?.replyTo?.image ? "📷 Photo" : "")}
                </p>
              </div>
            )}

            {message?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={message?.image || ""}
                alt="Message attachment"
                className="rounded-lg max-w-[200px] sm:max-w-xs"
              />
            )}

            {message.content && (
              <p className="text-xs sm:text-sm">{message.content}</p>
            )}
          </div>

          {/* Reply Icon Button - 桌面端显示 */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onReply(message)}
            className={cn(
              "hidden md:flex transition-opacity rounded-full !size-8",
              "md:opacity-0 md:group-hover:opacity-100",
            )}
          >
            <Reply
              size={16}
              className={cn(
                "text-gray-500 dark:text-white !stroke-[1.9]",
                isCurrentUser && "scale-x-[-1]",
              )}
            />
          </Button>
        </div>

        {message.status && (
          <span className="block text-[10px] text-gray-400 mt-0.5">
            {message.status}
          </span>
        )}
      </div>
    </div>
  );
});

ChatBodyMessage.displayName = "ChatBodyMessage";

export default ChatBodyMessage;
