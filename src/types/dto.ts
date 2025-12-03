/**
 * 数据传输对象 (DTO) 类型定义
 * 用于 API 请求和响应
 */

/**
 * 创建聊天 DTO
 */
export interface CreateChatDto {
  participantId?: string;
  isGroup?: boolean;
  memberIds?: string[];
  name?: string;
  avatar?: string;
  description?: string;
}

/**
 * 更新聊天 DTO
 */
export interface UpdateChatDto {
  name?: string;
  avatar?: string;
  description?: string;
}

/**
 * 发送消息 DTO
 */
export interface SendMessageDto {
  content?: string;
  image?: string;
  replyToId?: string;
}

/**
 * 创建公共聊天室 DTO
 */
export interface CreatePublicRoomDto {
  name: string;
  description?: string;
  avatar?: string;
}

/**
 * 更新公共聊天室 DTO
 */
export interface UpdatePublicRoomDto {
  name?: string;
  description?: string;
  avatar?: string;
}

/**
 * 更新用户资料 DTO
 */
export interface UpdateUserProfileDto {
  name?: string;
  avatar?: string;
  bio?: string;
}

/**
 * Clerk 用户同步 DTO
 */
export interface ClerkUserSyncDto {
  clerkId: string;
  email: string;
  name?: string;
  avatar?: string;
}

/**
 * 消息查询参数
 */
export interface MessageQueryParams {
  chatId?: string;
  limit?: number;
  cursor?: string;
  before?: string;
  after?: string;
}

/**
 * 聊天室消息查询参数
 */
export interface RoomMessageQueryParams {
  roomId?: string;
  limit?: number;
  cursor?: string;
  before?: string;
  after?: string;
}

/**
 * 聊天列表查询参数
 */
export interface ChatListQueryParams {
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
}

/**
 * 用户查询参数
 */
export interface UserQueryParams {
  search?: string;
  limit?: number;
  cursor?: string;
  exclude?: string[];
}
