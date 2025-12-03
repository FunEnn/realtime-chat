"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useEffect, useMemo, useState } from "react";
import AvatarWithBadge from "@/components/shared/avatar-with-badge";
import { useAuth } from "@/hooks/use-clerk-auth";
import { useMounted } from "@/hooks/use-mounted";
import { useSocket } from "@/hooks/use-socket";
import { getOtherUserAndGroup } from "@/lib/utils/user-utils";
import type { ChatType, PublicRoomChatType } from "@/types/chat.type";
import { PublicRoomSettingsDialog } from "../public-room/public-room-settings-dialog";
import ChatHistoryDialog from "./chat-history-dialog";
import { GroupSettingsDialog } from "./group-settings-dialog";

interface ChatHeaderProps {
  chat: ChatType | PublicRoomChatType;
  currentUserId: string | null;
  customActions?: React.ReactNode;
  isPublicRoom?: boolean;
}

const ChatHeader = memo(
  ({
    chat,
    currentUserId,
    customActions,
    isPublicRoom = false,
  }: ChatHeaderProps) => {
    const router = useRouter();
    const isMounted = useMounted();
    const { onlineUsers } = useSocket(); // ✅ 订阅在线用户状态

    const {
      name,
      subheading,
      avatar,
      isOnline,
      isGroup,
      onlineCount,
      totalMembers,
    } = useMemo(
      () => getOtherUserAndGroup(chat, currentUserId, isMounted),
      [chat, currentUserId, isMounted], // ✅ 添加 onlineUsers 依赖
    );

    // 检查当前用户是否为群聊创建者
    const isCreator = useMemo(() => {
      if (!isGroup || !currentUserId || !chat.createdBy) return false;
      return chat.createdBy.toString() === currentUserId.toString();
    }, [chat.createdBy, currentUserId, isGroup]);

    // 检查是否为管理员（用于公共聊天室）
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);

    // 客户端挂载后设置管理员状态，避免 hydration 不匹配
    useEffect(() => {
      setIsAdmin(user?.isAdmin || false);
    }, [user?.isAdmin]);

    const handleBack = () => {
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
          {isGroup && isCreator && !isPublicRoom ? (
            // 普通群聊：创建者点击头像编辑
            <GroupSettingsDialog
              chatId={chat.id}
              currentGroupName={chat.groupName || ""}
              currentGroupAvatar={chat.groupAvatar}
              trigger={
                <button
                  type="button"
                  className="hover:opacity-80 transition-opacity"
                >
                  <AvatarWithBadge
                    name={name}
                    src={avatar}
                    isGroup={isGroup}
                    isOnline={isOnline}
                  />
                </button>
              }
            />
          ) : isPublicRoom && isAdmin ? (
            // 公共聊天室：管理员点击头像编辑
            <PublicRoomSettingsDialog
              roomId={chat.id}
              currentRoomName={
                "name" in chat ? chat.name : chat.groupName || ""
              }
              currentDescription={"description" in chat ? chat.description : ""}
              currentAvatar={"avatar" in chat ? chat.avatar : chat.groupAvatar}
              trigger={
                <button
                  type="button"
                  className="hover:opacity-80 transition-opacity"
                >
                  <AvatarWithBadge
                    name={name}
                    src={avatar}
                    isGroup={isGroup}
                    isOnline={isOnline}
                  />
                </button>
              }
            />
          ) : (
            <AvatarWithBadge
              name={name}
              src={avatar}
              isGroup={isGroup}
              isOnline={isOnline}
            />
          )}
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
          {!isPublicRoom && <ChatHistoryDialog chatId={chat.id} />}
          {customActions}
        </div>
      </div>
    );
  },
);

ChatHeader.displayName = "ChatHeader";

export default ChatHeader;
