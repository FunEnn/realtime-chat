/**
 * 类型定义统一导出
 *
 * 推荐使用方式：
 * import type { User, Chat, Message, ApiResponse } from '@/types';
 */

export type { LoginInput, RegisterInput, UserType } from "./auth.type";
// 旧类型（向后兼容）
// @deprecated 请使用新的类型定义
export type {
  ChatType,
  CreateChatInput,
  CreateMessageType,
  MessageType,
  messageToLegacy,
  PublicRoomChatType,
  SendMessageInput,
} from "./chat.type";
// 通用类型
export type {
  ApiError,
  ApiResponse,
  BaseEntity,
  FilterCondition,
  FilterOperator,
  OptionalId,
  PaginatedData,
  PaginatedResponse,
  PaginationParams,
  PartialUpdate,
  SoftDelete,
  SortOrder,
  SortParams,
  Timestamps,
  UUID,
} from "./common";
// DTO 类型
export type {
  ChatListQueryParams,
  ClerkUserSyncDto,
  CreateChatDto,
  CreatePublicRoomDto,
  MessageQueryParams,
  RoomMessageQueryParams,
  SendMessageDto,
  UpdateChatDto,
  UpdatePublicRoomDto,
  UpdateUserProfileDto,
  UserQueryParams,
} from "./dto";
// 实体类型
export type {
  Chat,
  ChatMember,
  ChatWithDetails,
  Message,
  MessageListResult,
  PublicRoom,
  PublicRoomWithDetails,
  RoomMember,
  RoomMessage,
  RoomMessageListResult,
  User,
} from "./entities";
export type {
  CreatePublicRoomInput,
  PublicRoomDetailType,
  PublicRoomType,
} from "./public-room.type";
// Socket 事件类型
export type {
  ChatTypingMap,
  ClientToServerEvents,
  ServerToClientEvents,
  SocketConfig,
  SocketConnectionState,
  SocketError,
  TypingState,
} from "./socket-events";
