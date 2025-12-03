/**
 * Socket.IO 事件类型定义
 * 确保客户端和服务端事件类型安全
 */

import type { Chat, Message, PublicRoom, RoomMessage } from "./entities";

/**
 * 服务端向客户端发送的事件
 */
export interface ServerToClientEvents {
  /**
   * 在线用户列表更新
   * @param userIds - 在线用户的 ID 列表
   */
  "online:users": (userIds: string[]) => void;

  /**
   * 新消息推送
   * @param message - 新消息对象
   */
  "message:new": (message: Message | RoomMessage) => void;

  /**
   * 聊天更新（最后一条消息）
   * @param data - 包含 chatId 和 lastMessage 的对象
   */
  "chat:update": (data: { chatId: string; lastMessage: Message }) => void;

  /**
   * 新聊天创建通知
   * @param chat - 新创建的聊天对象
   */
  "chat:new": (chat: Chat) => void;

  /**
   * 公共聊天室更新
   * @param room - 更新后的聊天室对象
   */
  "room:update": (room: PublicRoom) => void;

  /**
   * 系统消息
   * @param data - 系统消息内容
   */
  "system:message": (data: {
    message: string;
    type?: "info" | "warning" | "error";
  }) => void;

  /**
   * 用户开始输入
   * @param data - 包含 chatId 和 userId 的对象
   */
  "typing:start": (data: {
    chatId: string;
    userId: string;
    userName: string;
  }) => void;

  /**
   * 用户停止输入
   * @param data - 包含 chatId 和 userId 的对象
   */
  "typing:stop": (data: { chatId: string; userId: string }) => void;

  /**
   * 消息已读回执
   * @param data - 包含 chatId、messageId 和 userId 的对象
   */
  "message:read": (data: {
    chatId: string;
    messageId: string;
    userId: string;
  }) => void;

  /**
   * 用户被踢出聊天室
   * @param data - 包含 chatId 和原因的对象
   */
  "chat:kicked": (data: { chatId: string; reason?: string }) => void;
}

/**
 * 客户端向服务端发送的事件
 */
export interface ClientToServerEvents {
  /**
   * 加入聊天室
   * @param chatId - 聊天室 ID
   * @param callback - 回调函数，失败时返回错误信息
   */
  "chat:join": (chatId: string, callback?: (error?: string) => void) => void;

  /**
   * 离开聊天室
   * @param chatId - 聊天室 ID
   */
  "chat:leave": (chatId: string) => void;

  /**
   * 开始输入
   * @param data - 包含 chatId 的对象
   */
  "typing:start": (data: { chatId: string }) => void;

  /**
   * 停止输入
   * @param data - 包含 chatId 的对象
   */
  "typing:stop": (data: { chatId: string }) => void;

  /**
   * 标记消息已读
   * @param data - 包含 chatId 和 messageId 的对象
   */
  "message:read": (data: { chatId: string; messageId: string }) => void;

  /**
   * Ping (用于心跳检测)
   * @param callback - 返回 pong 时间戳
   */
  ping: (callback?: (timestamp: number) => void) => void;
}

/**
 * Socket 连接状态
 */
export type SocketConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

/**
 * Socket 错误类型
 */
export interface SocketError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Socket 连接配置
 */
export interface SocketConfig {
  url: string;
  path: string;
  token: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

/**
 * 输入状态
 */
export interface TypingState {
  userId: string;
  userName: string;
  startedAt: number;
}

/**
 * 聊天室输入状态映射
 */
export type ChatTypingMap = Map<string, TypingState[]>;
