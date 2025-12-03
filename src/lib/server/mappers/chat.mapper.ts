/**
 * Chat Mapper - 数据转换层
 * 将 Prisma 返回的数据转换为前端期望的格式
 */

import type { UserType } from "@/types/auth.type";
import type { ChatType, MessageType } from "@/types/chat.type";

// Prisma 返回的类型（Date 对象）
type PrismaUser = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  clerkId: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
};

type PrismaMessage = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  chatId: string;
  senderId: string;
  content: string | null;
  image: string | null;
  replyToId: string | null;
  sender?: PrismaUser;
};

type PrismaChatMember = {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  chatId: string;
  userId: string;
  unreadCount: number;
  lastReadAt: Date | null;
  joinedAt: Date;
  user: PrismaUser;
};

type PrismaChat = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string | null;
  avatar: string | null;
  description: string | null;
  isGroup: boolean;
  createdById: string;
  creator?: PrismaUser;
  members?: PrismaChatMember[];
  messages?: PrismaMessage[];
  lastMessage?: PrismaMessage | null;
  unreadCount?: number;
};

/**
 * 将 User 转换为 UserType
 */
export function mapUserToUserType(user: PrismaUser): UserType {
  if (!user) {
    console.error("[Mapper] mapUserToUserType received null/undefined user");
    throw new Error("User is required for mapping");
  }

  if (!user.id || !user.email) {
    console.error("[Mapper] Invalid user data:", user);
    throw new Error("User must have id and email");
  }

  try {
    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name ?? "Unknown",
      avatar: user.avatar ?? null,
      bio: user.bio ?? undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("[Mapper] Error mapping user:", error);
    console.error("[Mapper] User data:", JSON.stringify(user, null, 2));
    throw error;
  }
}

/**
 * 将 Message 转换为 MessageType
 */
export function mapMessageToMessageType(message: PrismaMessage): MessageType {
  return {
    id: message.id,
    chatId: message.chatId,
    content: message.content ?? null,
    image: message.image ?? null,
    sender: message.sender ? mapUserToUserType(message.sender) : null,
    replyTo: null, // 如果需要可以递归转换
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

/**
 * 将 Chat 转换为 ChatType
 */
export function mapChatToChatType(chat: PrismaChat): ChatType {
  try {
    // 提取参与者（不包括创建者自己）
    const participants: UserType[] = [];

    if (chat.members) {
      for (const member of chat.members) {
        if (member?.user) {
          participants.push(mapUserToUserType(member.user));
        }
      }
    }

    // 获取最后一条消息
    let lastMessage: MessageType | null = null;
    if (chat.lastMessage) {
      lastMessage = mapMessageToMessageType(chat.lastMessage);
    } else if (chat.messages && chat.messages.length > 0) {
      lastMessage = mapMessageToMessageType(chat.messages[0]);
    }

    const result: ChatType = {
      id: chat.id,
      lastMessage,
      isGroup: chat.isGroup || false,
      isAiChat: false,
      createdBy: chat.createdById,
      groupName: chat.isGroup ? (chat.name ?? undefined) : undefined,
      groupAvatar: chat.isGroup ? (chat.avatar ?? undefined) : undefined,
      unreadCount: chat.unreadCount ?? 0,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
      participants,
    };

    return result;
  } catch (error) {
    console.error("[Mapper] Error mapping chat:", error);
    console.error("[Mapper] Chat data:", JSON.stringify(chat, null, 2));
    throw error;
  }
}

/**
 * 批量转换 Chat 列表
 */
export function mapChatsToChatTypes(chats: PrismaChat[]): ChatType[] {
  return chats.map(mapChatToChatType);
}

/**
 * 批量转换 User 列表
 */
export function mapUsersToUserTypes(users: PrismaUser[]): UserType[] {
  return users.map(mapUserToUserType);
}
