/**
 * Prisma 扩展类型定义
 * 使用 Prisma.GetPayload 工具类型生成类型安全的查询结果类型
 */

import type { Prisma } from "@prisma/client";

// ==================== User 类型 ====================

/**
 * 基础用户类型（包含所有字段）
 */
export type User = Prisma.UserGetPayload<Record<string, never>>;

/**
 * 用户公开信息（用于列表展示）
 */
export type UserPublic = Pick<
  User,
  "id" | "name" | "email" | "avatar" | "bio" | "isAdmin"
>;

// ==================== Chat 类型 ====================

/**
 * 聊天基础类型
 */
export type Chat = Prisma.ChatGetPayload<Record<string, never>>;

/**
 * 聊天 + 成员信息
 */
export type ChatWithMembers = Prisma.ChatGetPayload<{
  include: {
    members: {
      include: {
        user: true;
      };
    };
    creator: true;
  };
}>;

/**
 * 聊天 + 消息
 */
export type ChatWithMessages = Prisma.ChatGetPayload<{
  include: {
    messages: {
      include: {
        sender: true;
        replyTo: true;
      };
      orderBy: {
        createdAt: "desc";
      };
    };
  };
}>;

/**
 * 聊天详情（包含成员和最后一条消息）
 */
export type ChatWithDetails = Prisma.ChatGetPayload<{
  include: {
    members: {
      include: {
        user: true;
      };
    };
    messages: {
      take: 1;
      orderBy: {
        createdAt: "desc";
      };
      include: {
        sender: true;
      };
    };
    creator: true;
  };
}> & {
  unreadCount?: number;
  lastMessage?: MessageWithSender | null;
  participants?: User[];
  groupName?: string | null;
  groupAvatar?: string | null;
  createdBy?: string;
};

/**
 * 用户的聊天列表项
 */
export type UserChatListItem = Prisma.ChatMemberGetPayload<{
  include: {
    chat: {
      include: {
        members: {
          include: {
            user: true;
          };
        };
        messages: {
          take: 1;
          orderBy: {
            createdAt: "desc";
          };
          include: {
            sender: true;
          };
        };
        creator: true;
      };
    };
  };
}>;

// ==================== Message 类型 ====================

/**
 * 消息基础类型
 */
export type Message = Prisma.MessageGetPayload<Record<string, never>>;

/**
 * 消息 + 发送者
 */
export type MessageWithSender = Prisma.MessageGetPayload<{
  include: {
    sender: true;
  };
}> & {
  replyTo?: MessageWithSender | null;
  isSystemMessage?: boolean;
  status?: string;
};

/**
 * 消息 + 发送者 + 回复消息
 */
export type MessageWithDetails = Prisma.MessageGetPayload<{
  include: {
    sender: true;
    replyTo: {
      include: {
        sender: true;
      };
    };
  };
}>;

// ==================== PublicRoom 类型 ====================

/**
 * 公共聊天室基础类型
 */
export type PublicRoom = Prisma.PublicRoomGetPayload<Record<string, never>>;

/**
 * 公共聊天室 + 创建者
 */
export type PublicRoomWithCreator = Prisma.PublicRoomGetPayload<{
  include: {
    creator: true;
  };
}>;

/**
 * 公共聊天室 + 成员
 */
export type PublicRoomWithMembers = Prisma.PublicRoomGetPayload<{
  include: {
    creator: true;
    members: {
      include: {
        user: true;
      };
    };
  };
}>;

/**
 * 公共聊天室详情（包含统计）
 */
export type PublicRoomWithDetails = Prisma.PublicRoomGetPayload<{
  include: {
    creator: true;
    members: {
      include: {
        user: true;
      };
    };
    _count: {
      select: {
        members: true;
        messages: true;
      };
    };
  };
}>;

/**
 * 聊天室消息
 */
export type RoomMessage = Prisma.RoomMessageGetPayload<Record<string, never>>;

/**
 * 聊天室消息 + 发送者
 */
export type RoomMessageWithSender = Prisma.RoomMessageGetPayload<{
  include: {
    sender: true;
  };
}>;

/**
 * 聊天室消息详情
 */
export type RoomMessageWithDetails = Prisma.RoomMessageGetPayload<{
  include: {
    sender: true;
    replyTo: {
      include: {
        sender: true;
      };
    };
  };
}>;

// ==================== 扩展类型（客户端使用） ====================

/**
 * 临时消息类型（客户端乐观更新）
 */
export type OptimisticMessage = MessageWithSender & {
  _optimistic?: boolean;
  _sending?: boolean;
  _failed?: boolean;
};

/**
 * 聊天或聊天室的联合类型
 */
export type ChatOrRoom = ChatWithDetails | PublicRoomDisplay;

/**
 * 工具类型：提取参与者
 */
export type WithParticipants<T> = T & {
  participants: User[];
};

/**
 * 工具类型：提取最后一条消息
 */
export type WithLastMessage<T> = T & {
  lastMessage: MessageWithSender | null;
};

// ==================== 辅助类型 ====================

/**
 * 聊天成员
 */
export type ChatMember = Prisma.ChatMemberGetPayload<Record<string, never>>;

/**
 * 聊天成员 + 用户信息
 */
export type ChatMemberWithUser = Prisma.ChatMemberGetPayload<{
  include: {
    user: true;
  };
}>;

/**
 * 聊天室成员
 */
export type RoomMember = Prisma.RoomMemberGetPayload<Record<string, never>>;

/**
 * 聊天室成员 + 用户信息
 */
export type RoomMemberWithUser = Prisma.RoomMemberGetPayload<{
  include: {
    user: true;
  };
}>;

// ==================== DTO 辅助类型 ====================

/**
 * 创建聊天输入
 */
export interface CreateChatInput {
  participantId?: string;
  participants?: string[];
  isGroup?: boolean;
  name?: string | null;
  avatar?: string | null;
  description?: string | null;
}

/**
 * 创建消息输入
 */
export interface CreateMessageInput {
  chatId?: string;
  roomId?: string;
  content?: string | null;
  image?: string | null;
  replyToId?: string | null;
}

/**
 * 创建公共聊天室输入
 */
export interface CreatePublicRoomInput {
  name: string;
  description?: string | null;
  avatar?: string | null;
}

/**
 * 更新用户资料输入
 */
export interface UpdateUserProfileInput {
  name?: string;
  avatar?: string;
  bio?: string;
}

// ==================== 扩展类型 ====================

/**
 * 带有扩展字段的聊天室类型
 */
export type PublicRoomDisplay = PublicRoomWithDetails & {
  isMember: boolean;
  unreadCount?: number;
  hasUnread?: boolean;
};
