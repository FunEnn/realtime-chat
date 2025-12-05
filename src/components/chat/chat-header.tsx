"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useEffect, useMemo, useState } from "react";
import AvatarWithBadge from "@/components/shared/avatar-with-badge";
import { useAuth } from "@/hooks/use-clerk-auth";
import { useMounted } from "@/hooks/use-mounted";
import { useSocket } from "@/hooks/use-socket";
import {
  getCreatorId,
  getGroupAvatar,
  getGroupName,
} from "@/lib/utils/type-guards";
import { getOtherUserAndGroup } from "@/lib/utils/user-utils";
import type { ChatWithDetails, PublicRoomDisplay, User } from "@/types";
import { PublicRoomInfoDialog } from "../public-room/public-room-info-dialog";
import { PublicRoomSettingsDialog } from "../public-room/public-room-settings-dialog";
import ChatHistoryDialog from "./chat-history-dialog";
import { GroupInfoDialog } from "./group-info-dialog";
import { GroupSettingsDialog } from "./group-settings-dialog";
import { InviteUsersDialog } from "./invite-users-dialog";
import { PrivateChatInfoDialog } from "./private-chat-info-dialog";

interface ChatHeaderProps {
  chat: ChatWithDetails | PublicRoomDisplay;
  currentUserId: string | null;
  customActions?: React.ReactNode;
  isPublicRoom?: boolean;
  isMember?: boolean;
  allUsers?: User[];
}

const ChatHeader = memo(
  ({
    chat,
    currentUserId,
    customActions,
    isPublicRoom = false,
    isMember = true,
    allUsers = [],
  }: ChatHeaderProps) => {
    const router = useRouter();
    const isMounted = useMounted();
    const { onlineUsers } = useSocket();

    const {
      name,
      subheading,
      avatar,
      isOnline,
      isGroup,
      onlineCount,
      totalMembers,
      otherUser,
    } = useMemo(
      () => getOtherUserAndGroup(chat, currentUserId, isMounted, onlineUsers),
      [chat, currentUserId, isMounted, onlineUsers],
    );

    // 检查当前用户是否为群聊创建者
    const isCreator = useMemo(() => {
      const creatorId = getCreatorId(chat);
      if (!isGroup || !currentUserId || !creatorId) return false;
      return creatorId.toString() === currentUserId.toString();
    }, [chat, currentUserId, isGroup]);

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
      <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-3 md:px-4 z-50 shadow-sm">
        <div className="h-14 md:h-16 px-2 md:px-4 flex items-center flex-1 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="lg:hidden mr-3 p-2 rounded-full hover:bg-accent active:bg-accent/80 transition-all duration-200 hover:scale-110"
            aria-label="Back to chat list"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          {isGroup && isCreator && !isPublicRoom ? (
            // 普通群聊：创建者点击头像编辑
            <GroupSettingsDialog
              chatId={chat.id}
              currentGroupName={getGroupName(chat) || ""}
              currentGroupAvatar={getGroupAvatar(chat) || undefined}
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
          ) : isGroup && !isPublicRoom && "participants" in chat ? (
            // 普通群聊：非创建者点击头像查看群信息
            <GroupInfoDialog
              chatId={chat.id}
              groupName={getGroupName(chat) || "Group"}
              groupDescription={
                "description" in chat
                  ? chat.description || undefined
                  : undefined
              }
              groupAvatar={getGroupAvatar(chat) || undefined}
              members={chat.participants || []}
              currentUserId={currentUserId || ""}
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
              currentRoomName={getGroupName(chat) || ""}
              currentDescription={
                "description" in chat ? chat.description || "" : ""
              }
              currentAvatar={getGroupAvatar(chat) || undefined}
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
          ) : isPublicRoom ? (
            // 公共聊天室：非管理员点击头像查看信息
            <PublicRoomInfoDialog
              roomId={chat.id}
              roomName={getGroupName(chat) || ""}
              roomDescription={
                "description" in chat ? chat.description || "" : ""
              }
              roomAvatar={getGroupAvatar(chat) || undefined}
              memberCount={
                "_count" in chat && chat._count
                  ? chat._count.members
                  : undefined
              }
              isMember={isMember}
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
          ) : !isGroup && otherUser ? (
            // 私聊：点击头像查看用户信息
            <PrivateChatInfoDialog
              chatId={chat.id}
              userName={otherUser.name || otherUser.email}
              userEmail={otherUser.email}
              userBio={otherUser.bio || undefined}
              userAvatar={otherUser.avatar || undefined}
              isOnline={isOnline}
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
                    size="w-10 h-10 md:w-11 md:h-11"
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
              size="w-10 h-10 md:w-11 md:h-11"
            />
          )}
          <div className="ml-3 min-w-0 flex-1">
            <h5 className="font-semibold text-sm md:text-base truncate">
              {name}
            </h5>
            {isGroup && onlineCount !== undefined ? (
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                {typeof onlineCount === "number" && onlineCount > 0 ? (
                  <>
                    <span className="text-green-500">{onlineCount} online</span>
                    {" • "}
                  </>
                ) : null}
                {String(totalMembers ?? 0)} members
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
          {isGroup &&
            !isPublicRoom &&
            allUsers.length > 0 &&
            "participants" in chat && (
              <InviteUsersDialog
                chatId={chat.id}
                chatName={getGroupName(chat) || "Group"}
                currentMembers={chat.participants || []}
                allUsers={allUsers}
              />
            )}
          {customActions}
        </div>
      </div>
    );
  },
);

ChatHeader.displayName = "ChatHeader";

export default ChatHeader;
