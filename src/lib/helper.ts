import { format, isThisWeek, isToday, isYesterday } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "@/hooks/use-socket";
import type { ChatType, PublicRoomChatType } from "@/types/chat.type";

export const isUserOnline = (userId?: string, isMounted: boolean = true) => {
  if (!userId || !isMounted) return false;
  const { onlineUsers } = useSocket.getState();
  return onlineUsers.includes(userId);
};

export const getOtherUserAndGroup = (
  chat: ChatType | PublicRoomChatType,
  currentUserId: string | null,
  isMounted: boolean = true,
) => {
  const isPublicRoom = "members" in chat && "memberCount" in chat;

  if (isPublicRoom) {
    const members = chat.members || [];
    const onlineCount = isMounted
      ? members.filter((memberId: string) => isUserOnline(memberId, isMounted))
          .length
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
      ? chat.participants.filter((p) => isUserOnline(p._id, isMounted)).length
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

  const other = chat.participants.find((p) => p._id !== currentUserId);
  const isOnline = isUserOnline(other?._id ?? "", isMounted);

  return {
    name: other?.name || "Unknown",
    subheading: isOnline ? "Online" : "Offline",
    avatar: other?.avatar || "",
    isGroup: false,
    isOnline,
  };
};

export const formatChatTime = (date: string | Date) => {
  if (!date) return "";
  const newDate = new Date(date);
  if (Number.isNaN(newDate.getTime())) return "Invalid date";

  if (isToday(newDate)) return format(newDate, "HH:mm");
  if (isYesterday(newDate)) return "Yesterday";
  if (isThisWeek(newDate)) return format(newDate, "EEEE");
  return format(newDate, "M/d");
};

export function generateUUID(): string {
  return uuidv4();
}
