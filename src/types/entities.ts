/**
 * 实体类型定义
 * 统一使用 'id' 而不是 '_id'
 * 与数据库模型保持一致
 */

import type { BaseEntity } from "./common";

/**
 * 用户实体
 */
export interface User extends BaseEntity {
  clerkId: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  bio?: string | null;
}

/**
 * 聊天实体
 */
export interface Chat extends BaseEntity {
  name?: string | null;
  avatar?: string | null;
  description?: string | null;
  isGroup: boolean;
  createdById: string;
  creator?: User;
  members?: ChatMember[];
  messages?: Message[];
  lastMessage?: Message | null;
}

/**
 * 聊天成员实体
 */
export interface ChatMember extends BaseEntity {
  chatId: string;
  userId: string;
  unreadCount: number;
  lastReadAt?: string | null;
  joinedAt: string;
  user?: User;
  chat?: Chat;
}

/**
 * 消息实体
 */
export interface Message extends BaseEntity {
  chatId: string;
  senderId: string;
  content?: string | null;
  image?: string | null;
  replyToId?: string | null;
  sender?: User;
  replyTo?: Message | null;
  replies?: Message[];
  chat?: Chat;
}

/**
 * 公共聊天室实体
 */
export interface PublicRoom extends BaseEntity {
  name: string;
  avatar?: string | null;
  description?: string | null;
  isActive: boolean;
  createdById: string;
  creator?: User;
  members?: RoomMember[];
  messages?: RoomMessage[];
}

/**
 * 聊天室成员实体
 */
export interface RoomMember extends BaseEntity {
  roomId: string;
  userId: string;
  joinedAt: string;
  user?: User;
  room?: PublicRoom;
}

/**
 * 聊天室消息实体
 */
export interface RoomMessage extends BaseEntity {
  roomId: string;
  senderId: string;
  content?: string | null;
  image?: string | null;
  replyToId?: string | null;
  replyTo?: RoomMessage | null;
  replies?: RoomMessage[];
  room?: PublicRoom;
}

/**
 * 扩展的聊天类型（包含额外信息）
 */
export interface ChatWithDetails extends Chat {
  unreadCount: number;
  lastReadAt?: string | null;
  memberCount: number;
  participants: User[];
}

/**
 * 扩展的公共聊天室类型
 */
export interface PublicRoomWithDetails extends PublicRoom {
  memberCount: number;
  messageCount: number;
  isMember: boolean;
}

/**
 * 消息列表查询结果
 */
export interface MessageListResult {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string | null;
  total?: number;
}

/**
 * 聊天室消息列表查询结果
 */
export interface RoomMessageListResult {
  messages: RoomMessage[];
  hasMore: boolean;
  nextCursor?: string | null;
  total?: number;
}
