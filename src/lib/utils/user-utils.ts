import { format, isThisWeek, isToday, isYesterday } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "@/hooks/use-socket";
import type { ChatWithDetails, PublicRoomDisplay } from "@/types";
import {
  getGroupAvatar,
  getGroupName,
  getParticipants,
  hasParticipants,
} from "./type-guards";

const checkUserOnline = (userId: string, onlineUsers: string[]): boolean =>
  onlineUsers.includes(userId);

export const isUserOnline = (userId?: string): boolean => {
  if (!userId) return false;
  const { onlineUsers } = useSocket.getState();
  return onlineUsers.includes(userId);
};

export const getOtherUserAndGroup = (
  chat: ChatWithDetails | PublicRoomDisplay | null | undefined,
  currentUserId: string | null,
  isMounted: boolean = true,
  providedOnlineUsers?: string[],
) => {
  if (!chat) {
    return {
      name: "Unknown",
      subheading: "Offline",
      avatar: "",
      isGroup: false,
      isOnline: false,
    };
  }

  const onlineUsers =
    providedOnlineUsers ?? (isMounted ? useSocket.getState().onlineUsers : []);

  // 检查是否为公共聊天室
  const isPublicRoom =
    "members" in chat && ("memberCount" in chat || "_count" in chat);

  if (isPublicRoom) {
    const members = chat.members || [];

    const sampleMember = members.length > 0 ? members[0] : null;
    const memberType = typeof sampleMember;
    const isStringArray = memberType === "string";

    const memberIds = isStringArray
      ? members
      : members.map((m: any) => m?.userId || m?.user?.id).filter(Boolean);

    const onlineCount = isMounted
      ? memberIds.filter((memberId: string) =>
          checkUserOnline(memberId, onlineUsers),
        ).length
      : 0;

    // 支持两种数据结构：memberCount 和 _count.members
    const totalMembers =
      ("memberCount" in chat
        ? chat.memberCount
        : (chat as any)._count?.members) ||
      members.length ||
      0;

    return {
      name: chat.name || "Public Room",
      subheading:
        onlineCount > 0
          ? `${onlineCount} online • ${totalMembers} members`
          : chat.description || `${totalMembers} members`,
      avatar: chat.avatar || "",
      isGroup: true,
      isOnline: false,
      onlineCount,
      totalMembers,
    };
  }

  const isGroup = "isGroup" in chat ? chat.isGroup : false;

  if (isGroup && chat) {
    // 获取参与者列表，优先从 participants，其次从 members
    const participants = getParticipants(chat);
    const onlineCount = isMounted
      ? participants.filter((p) => checkUserOnline(p.id, onlineUsers)).length
      : 0;
    const totalMembers = participants.length;

    return {
      name: getGroupName(chat) || "Unnamed Group",
      subheading:
        onlineCount > 0
          ? `${onlineCount} online • ${totalMembers} members`
          : `${totalMembers} members`,
      avatar: getGroupAvatar(chat) || "",
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

  if (!chat || !hasParticipants(chat)) {
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
