import { format, isThisWeek, isToday, isYesterday } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "@/hooks/use-socket";
import type { ChatType, PublicRoomChatType } from "@/types/chat.type";

const checkUserOnline = (userId: string, onlineUsers: string[]): boolean =>
  onlineUsers.includes(userId);

export const isUserOnline = (userId?: string): boolean => {
  if (!userId) return false;
  const { onlineUsers } = useSocket.getState();
  return onlineUsers.includes(userId);
};

export const getOtherUserAndGroup = (
  chat: ChatType | PublicRoomChatType,
  currentUserId: string | null,
  isMounted: boolean = true,
) => {
  const onlineUsers = isMounted ? useSocket.getState().onlineUsers : [];
  const isPublicRoom = "members" in chat && "memberCount" in chat;

  if (isPublicRoom) {
    const members = chat.members || [];
    const onlineCount = isMounted
      ? members.filter((memberId: string) =>
          checkUserOnline(memberId, onlineUsers),
        ).length
      : 0;
    const totalMembers = chat.memberCount || members.length || 0;

    return {
      name: chat.name || "Public Room",
      subheading: chat.description || `${totalMembers} members`,
      avatar: chat.avatar || "",
      isGroup: true,
      isOnline: false,
      onlineCount,
      totalMembers,
    };
  }

  const isGroup = chat?.isGroup;

  if (isGroup && "participants" in chat) {
    const onlineCount = isMounted
      ? chat.participants.filter((p) => checkUserOnline(p.id, onlineUsers))
          .length
      : 0;
    const totalMembers = chat.participants.length;

    return {
      name: chat.groupName || "Unnamed Group",
      subheading:
        onlineCount > 0
          ? `${onlineCount} online • ${totalMembers} members`
          : `${totalMembers} members`,
      avatar: chat.groupAvatar || "",
      isGroup,
      onlineCount,
      totalMembers,
    };
  }

  if (!("participants" in chat)) {
    return {
      name: "Unknown",
      subheading: "Offline",
      avatar: "",
      isGroup: false,
      isOnline: false,
    };
  }

  const other = chat.participants.find((p) => p.id !== currentUserId);
  const isOnline = other?.id ? checkUserOnline(other.id, onlineUsers) : false;

  // 调试日志 - 只显示前3个聊天
  if (other && isMounted && Math.random() < 0.1) {
    console.log("[UserUtils] Chat item online check:", {
      chatId: "chatId" in chat ? chat.id : "unknown",
      userName: other?.name,
      userId: other.id,
      onlineUsersCount: onlineUsers.length,
      isInOnlineList: onlineUsers.includes(other.id),
      isOnline,
    });
  }

  return {
    name: other?.name || "Unknown",
    subheading: isOnline ? "Online" : "Offline",
    avatar: other?.avatar || "",
    isGroup: false,
    isOnline,
  };
};

export const formatChatTime = (date: string | Date): string => {
  if (!date) return "";
  const newDate = new Date(date);
  if (Number.isNaN(newDate.getTime())) return "Invalid date";

  if (isToday(newDate)) return format(newDate, "HH:mm");
  if (isYesterday(newDate)) return "Yesterday";
  if (isThisWeek(newDate)) return format(newDate, "EEEE");
  return format(newDate, "M/d");
};

export const generateUUID = (): string => uuidv4();
