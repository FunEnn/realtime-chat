/**
 * @deprecated 使用 @/types/entities 中的类型定义
 * 此文件保留用于向后兼容，新代码请使用新的类型系统
 */

import type { UserType } from "./auth.type";
import type { Message, User } from "./entities";

/**
 * @deprecated 使用 Message 替代
 */
export type MessageType = {
  id: string;
  chatId: string;
  content: string | null;
  image: string | null;
  sender: UserType | null;
  replyTo: MessageType | null;
  isSystemMessage?: boolean;
  createdAt: string;
  updatedAt: string;
  status?: string;
  streaming?: boolean;
};

/**
 * 兼容性辅助函数：将新类型转换为旧类型
 */
export function messageToLegacy(message: Message, sender?: User): MessageType {
  return {
    id: message.id,
    chatId: message.chatId,
    content: message.content ?? null,
    image: message.image ?? null,
    sender: sender
      ? ({
          id: sender.id,
          clerkId: sender.clerkId,
          email: sender.email,
          name: sender.name ?? undefined,
          avatar: sender.avatar ?? undefined,
          bio: sender.bio ?? undefined,
          createdAt: sender.createdAt,
          updatedAt: sender.updatedAt,
        } as UserType)
      : null,
    replyTo: null, // TODO: 如果需要可以递归转换
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

type BaseChatType = {
  id: string;
  lastMessage: MessageType | null;
  isGroup: boolean;
  isAiChat: boolean;
  createdBy: string;
  groupName?: string;
  groupAvatar?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type ChatType = BaseChatType & {
  participants: UserType[];
};

export type PublicRoomChatType = BaseChatType & {
  name: string;
  description: string;
  avatar?: string;
  members: string[];
  memberCount: number;
};

export type CreateChatInput = {
  participantId?: string;
  participants?: string[];
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
};

export type SendMessageInput = {
  chatId: string;
  content?: string;
  image?: string;
  replyToId?: string;
};

export type CreateMessageType = {
  chatId: string | null;
  content?: string;
  image?: string;
  replyTo?: MessageType | null;
};
