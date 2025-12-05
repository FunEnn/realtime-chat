"use client";

import { Reply } from "lucide-react";
import { memo, useCallback, useRef } from "react";
import AvatarWithBadge from "@/components/shared/avatar-with-badge";
import { useAuth } from "@/hooks/use-clerk-auth";
import { cn } from "@/lib/utils";
import { isFailedMessage, isSendingMessage } from "@/lib/utils/type-guards";
import { formatChatTime } from "@/lib/utils/user-utils";
import type { MessageWithSender } from "@/types";
import { Button } from "../ui/button";

interface Props {
  message: MessageWithSender;
  onReply: (message: MessageWithSender) => void;
  currentUserId?: string;
}

const ChatBodyMessage = memo(({ message, onReply, currentUserId }: Props) => {
  const { user } = useAuth();
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const userId = currentUserId ?? user?.id ?? null;
  const isCurrentUser = !!userId && message.sender?.id === userId;
  const senderName = isCurrentUser ? "You" : message.sender?.name;

  const isSending = isSendingMessage(message);
  const isFailed = isFailedMessage(message);

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

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  if (message.isSystemMessage) {
    return (
      <div className="flex justify-center py-2 px-4">
        <div className="text-xs sm:text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const replySendername =
    message.replyTo?.sender?.id === userId
      ? "You"
      : message.replyTo?.sender?.name;

  const containerClass = cn(
    "group flex gap-2 sm:gap-3 py-2 sm:py-3 px-2 sm:px-4",
    isCurrentUser && "flex-row-reverse text-left",
  );

  const contentWrapperClass = cn(
    "max-w-[75%] sm:max-w-[70%] flex flex-col relative",
    isCurrentUser && "items-end",
  );

  const messageClass = cn(
    "min-w-[150px] sm:min-w-[200px] px-3 sm:px-4 py-2.5 text-xs sm:text-sm break-words shadow-md hover:shadow-lg transition-shadow duration-200",
    isCurrentUser
      ? "bg-accent dark:bg-primary/40 rounded-2xl rounded-tr-md"
      : "bg-[#F5F5F5] dark:bg-accent rounded-2xl rounded-tl-md",
  );

  const replyBoxClass = cn(
    "mb-2 p-2.5 text-xs rounded-lg border-l-4 shadow-sm !text-left",
    isCurrentUser
      ? "bg-primary/20 border-l-primary"
      : "bg-gray-200 dark:bg-secondary border-l-[#CC4A31]",
  );

  return (
    <div className={containerClass}>
      {!isCurrentUser && (
        <div className="shrink-0 flex items-start">
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
            onTouchEnd={clearLongPressTimer}
            onTouchCancel={clearLongPressTimer}
            onTouchMove={clearLongPressTimer}
          >
            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-2.5 mb-1 pb-0.5">
              <span className="text-[11px] sm:text-xs font-semibold">
                {senderName}
              </span>
              <span className="text-[10px] sm:text-[11px] text-gray-600 dark:text-gray-400">
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
                className="rounded-xl max-w-[200px] sm:max-w-xs shadow-md"
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
              "hidden md:flex transition-all duration-200 rounded-full size-9! shadow-md hover:shadow-lg",
              "md:opacity-0 md:group-hover:opacity-100 md:group-hover:scale-110",
            )}
          >
            <Reply
              size={16}
              className={cn(
                "text-gray-500 dark:text-white stroke-[1.9]!",
                isCurrentUser && "scale-x-[-1]",
              )}
            />
          </Button>
        </div>

        {/* 消息状态：发送中、失败 */}
        {(isSending || isFailed || message.status) && (
          <span
            className={cn(
              "block text-[10px] mt-0.5",
              isFailed ? "text-red-500" : "text-gray-400",
            )}
          >
            {isFailed
              ? "Failed to send"
              : isSending
                ? "Sending..."
                : message.status}
          </span>
        )}
      </div>
    </div>
  );
});

ChatBodyMessage.displayName = "ChatBodyMessage";

export default ChatBodyMessage;
