// Prisma 类型系统

// 类型守卫工具
export * from "../lib/utils/type-guards";

// 通用类型
export type { ApiError, ApiResponse } from "./common";
export type {
  // Message 通用类型
  AnyMessage,
  // Chat 类型
  Chat,
  // Member 类型
  ChatMember,
  ChatMemberWithUser,
  ChatOrRoom,
  ChatWithDetails,
  ChatWithMembers,
  ChatWithMessages,
  // Input DTO 类型
  CreateChatInput,
  CreateMessageInput,
  CreatePublicRoomInput,
  // Message 类型
  Message,
  MessageWithDetails,
  MessageWithSender,
  // 扩展类型
  OptimisticMessage,
  // PublicRoom 类型
  PublicRoom,
  PublicRoomDisplay,
  PublicRoomWithCreator,
  PublicRoomWithDetails,
  PublicRoomWithMembers,
  RoomMember,
  RoomMemberWithUser,
  // RoomMessage 类型
  RoomMessage,
  RoomMessageWithDetails,
  RoomMessageWithSender,
  UpdateUserProfileInput,
  // User 类型
  User,
  UserChatListItem,
  UserPublic,
  WithLastMessage,
  WithParticipants,
} from "./prisma.types";

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
