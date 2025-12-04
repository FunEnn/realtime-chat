/**
 * 类型守卫工具函数
 * 用于安全地检查和断言类型，避免使用 as any
 */

import type {
  ChatWithDetails,
  MessageWithSender,
  PublicRoomDisplay,
} from "@/types";

/**
 * 检查是否为 PublicRoomDisplay
 */
export function isPublicRoomDisplay(
  chat: ChatWithDetails | PublicRoomDisplay,
): chat is PublicRoomDisplay {
  return "creator" in chat && "_count" in chat;
}

/**
 * 检查是否为 ChatWithDetails
 */
export function isChatWithDetails(
  chat: ChatWithDetails | PublicRoomDisplay,
): chat is ChatWithDetails {
  return !isPublicRoomDisplay(chat);
}

/**
 * 检查聊天是否有 participants 字段
 */
export function hasParticipants(
  chat: ChatWithDetails | PublicRoomDisplay,
): chat is ChatWithDetails & {
  participants: Array<{ id: string; name: string | null }>;
} {
  return "participants" in chat && Array.isArray((chat as any).participants);
}

/**
 * 检查聊天是否有 lastMessage 字段
 */
export function hasLastMessage(
  chat: ChatWithDetails | PublicRoomDisplay,
): chat is ChatWithDetails & { lastMessage: MessageWithSender | null } {
  return "lastMessage" in chat;
}

/**
 * 检查聊天是否为群聊
 */
export function isGroupChat(
  chat: ChatWithDetails | PublicRoomDisplay,
): boolean {
  if ("isGroup" in chat) {
    return chat.isGroup === true;
  }
  return false;
}

/**
 * 安全获取聊天的 groupName
 */
export function getGroupName(
  chat: ChatWithDetails | PublicRoomDisplay,
): string | null | undefined {
  if ("groupName" in chat) {
    return chat.groupName;
  }
  if ("name" in chat) {
    return chat.name;
  }
  return undefined;
}

/**
 * 安全获取聊天的 groupAvatar
 */
export function getGroupAvatar(
  chat: ChatWithDetails | PublicRoomDisplay,
): string | null | undefined {
  if ("groupAvatar" in chat) {
    return chat.groupAvatar;
  }
  if ("avatar" in chat) {
    return chat.avatar;
  }
  return undefined;
}

/**
 * 安全获取聊天的 createdBy/createdById
 */
export function getCreatorId(
  chat: ChatWithDetails | PublicRoomDisplay,
): string | undefined {
  if ("createdBy" in chat) {
    return chat.createdBy;
  }
  if ("createdById" in chat) {
    return chat.createdById;
  }
  return undefined;
}

/**
 * 安全获取参与者列表
 */
export function getParticipants(
  chat: ChatWithDetails | PublicRoomDisplay,
): Array<{ id: string; name: string | null; avatar?: string | null }> {
  if (hasParticipants(chat)) {
    return chat.participants;
  }
  // 从 members 中提取
  if ("members" in chat && Array.isArray(chat.members)) {
    return chat.members
      .map((m: any) => {
        // 支持两种数据结构：{ user: {...} } 或直接是用户对象
        if (m?.user) {
          return m.user;
        }
        if (m?.id && m?.name !== undefined) {
          return m;
        }
        return null;
      })
      .filter(Boolean);
  }
  return [];
}

/**
 * 安全获取最后一条消息
 */
export function getLastMessage(
  chat: ChatWithDetails | PublicRoomDisplay,
): MessageWithSender | null | undefined {
  if (hasLastMessage(chat)) {
    return chat.lastMessage;
  }
  // 从 messages 数组获取
  if (
    "messages" in chat &&
    Array.isArray((chat as any).messages) &&
    (chat as any).messages.length > 0
  ) {
    return (chat as any).messages[0];
  }
  return null;
}

/**
 * 检查消息是否为乐观更新消息
 */
export function isOptimisticMessage(
  message: MessageWithSender,
): message is MessageWithSender & { _optimistic: true } {
  return "_optimistic" in message && message._optimistic === true;
}

/**
 * 检查消息是否正在发送中
 */
export function isSendingMessage(
  message: MessageWithSender,
): message is MessageWithSender & { _sending: true } {
  return "_sending" in message && message._sending === true;
}

/**
 * 检查消息是否发送失败
 */
export function isFailedMessage(
  message: MessageWithSender,
): message is MessageWithSender & { _failed: true } {
  return "_failed" in message && message._failed === true;
}
