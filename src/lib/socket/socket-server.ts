import type { Server as HTTPServer } from "node:http";
import { Server, type Socket } from "socket.io";
import * as chatService from "@/lib/server/services/chat.service";
import * as userService from "@/lib/server/services/user.service";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

// 使用 global 来跨进程共享 Socket.IO 实例
declare global {
  var __socketIO: Server | undefined;
  var __onlineUsers: Map<string, string> | undefined;
}

let io: Server | null = global.__socketIO || null;
const onlineUsers: Map<string, string> =
  global.__onlineUsers || new Map<string, string>();

// 确保全局变量被设置
if (!global.__onlineUsers) {
  global.__onlineUsers = onlineUsers;
}

export function initializeSocket(httpServer: HTTPServer) {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/api/socket/io",
  });

  // 保存到全局变量以跨进程共享
  global.__socketIO = io;

  // Socket.IO 认证中间件
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const authToken = socket.handshake.auth?.token;
      const authHeader = socket.handshake.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : null;

      const token = authToken || bearerToken;

      if (!token) {
        return next(new Error("Unauthorized: No token provided"));
      }

      // 使用 Clerk 验证 token
      try {
        const { verifyToken } = await import("@clerk/backend");
        const verifiedToken = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });

        if (verifiedToken.sub) {
          const user = await userService.findUserByClerkId(verifiedToken.sub);

          if (user) {
            socket.userId = user.id;
            return next();
          }
        }
      } catch (clerkError) {
        console.error("Clerk token verification failed:", clerkError);
        return next(new Error("Unauthorized: Invalid token"));
      }

      return next(new Error("Unauthorized: User not found"));
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Unauthorized"));
    }
  });

  // Socket.IO 连接处理
  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    const socketId = socket.id;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // 注册用户的 socket
    onlineUsers.set(userId, socketId);

    // 广播在线用户列表
    io?.emit("online:users", Array.from(onlineUsers.keys()));

    // 创建用户的个人房间
    socket.join(`user:${userId}`);

    // 加入聊天室
    socket.on(
      "chat:join",
      async (chatId: string, callback?: (err?: string) => void) => {
        try {
          // 验证用户是否有权限加入
          const isInChat = await chatService.isUserInChat(chatId, userId);

          if (!isInChat) {
            callback?.("You are not a member of this chat");
            return;
          }

          socket.join(`chat:${chatId}`);
          callback?.();
        } catch (error) {
          console.error("[Socket Server] Error joining chat:", error);
          callback?.("Error joining chat");
        }
      },
    );

    // 离开聊天室
    socket.on("chat:leave", (chatId: string) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
      }
    });

    // 断开连接
    socket.on("disconnect", () => {
      if (onlineUsers.get(userId) === socketId) {
        onlineUsers.delete(userId);

        // 广播更新的在线用户列表
        io?.emit("online:users", Array.from(onlineUsers.keys()));
      }
    });
  });

  return io;
}

export function getIO() {
  // 尝试从全局变量获取
  if (!io && global.__socketIO) {
    io = global.__socketIO;
  }

  if (!io) {
    throw new Error("Socket.IO not initialized. Call initializeSocket first.");
  }
  return io;
}

export function isIOInitialized(): boolean {
  return io !== null;
}

/**
 * 向聊天参与者发送新聊天通知
 */
export function emitNewChatToParticipants(
  participantIds: string[] = [],
  chat: unknown,
) {
  // 尝试从全局变量获取
  if (!io && global.__socketIO) {
    io = global.__socketIO;
  }

  if (!io) {
    console.error("[Socket] IO not initialized");
    return;
  }

  console.log(
    "[Socket] Emitting new chat to participants:",
    participantIds,
    "chat:",
    chat,
  );

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:new", chat);
    console.log(`[Socket] Emitted to user:${participantId}`);
  }
}

/**
 * 向聊天室发送新消息
 */
export function emitNewMessageToChatRoom(
  _senderId: string,
  chatId: string,
  message: unknown,
) {
  // 尝试从全局变量获取
  if (!io && global.__socketIO) {
    io = global.__socketIO;
  }

  if (!io) {
    return;
  }

  // 发送给房间内所有人，包括发送者
  io.to(`chat:${chatId}`).emit("message:new", message);
}

/**
 * 向聊天参与者发送最后一条消息更新
 */
export function emitLastMessageToParticipants(
  participantIds: string[],
  chatId: string,
  lastMessage: unknown,
) {
  if (!io) {
    return;
  }

  const payload = { chatId, lastMessage };

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:update", payload);
  }
}

/**
 * 向聊天室发送系统消息
 */
export function emitSystemMessage(chatId: string, message: string) {
  const io = getIO();
  io.to(`chat:${chatId}`).emit("system:message", { message });
}

/**
 * 获取在线用户列表
 */
export function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

/**
 * 检查用户是否在线
 */
export function isUserOnline(userId: string) {
  return onlineUsers.has(userId);
}
