import type { Server as HTTPServer } from "node:http";
import { Server, type Socket } from "socket.io";
import * as chatRepository from "@/lib/server/repositories/chat.repository";
import * as roomRepository from "@/lib/server/repositories/room.repository";
import * as userRepository from "@/lib/server/repositories/user.repository";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

declare global {
  var __socketIO: Server | undefined;
  var __onlineUsers: Map<string, string> | undefined;
}

let io: Server | null = global.__socketIO || null;
const onlineUsers: Map<string, string> =
  global.__onlineUsers || new Map<string, string>();

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

  global.__socketIO = io;

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

      try {
        const { verifyToken } = await import("@clerk/backend");
        const verifiedToken = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });

        if (verifiedToken.sub) {
          const user = await userRepository.findUserByClerkId(
            verifiedToken.sub,
          );

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

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    const socketId = socket.id;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    onlineUsers.set(userId, socketId);
    io?.emit("online:users", Array.from(onlineUsers.keys()));
    socket.join(`user:${userId}`);

    socket.on(
      "chat:join",
      async (chatId: string, callback?: (err?: string) => void) => {
        try {
          const isInPrivateChat = await chatRepository.isUserInChat(
            chatId,
            userId,
          );
          const isInPublicRoom = await roomRepository.isUserInRoom(
            chatId,
            userId,
          );
          const publicRoomExists =
            await roomRepository.findPublicRoomById(chatId);

          if (!isInPrivateChat && !isInPublicRoom && !publicRoomExists) {
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

    socket.on("chat:leave", (chatId: string) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
      }
    });

    socket.on("disconnect", () => {
      if (onlineUsers.get(userId) === socketId) {
        onlineUsers.delete(userId);
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
  if (!io && global.__socketIO) {
    io = global.__socketIO;
  }

  if (!io) {
    console.error("[Socket] IO not initialized");
    return;
  }

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:new", chat);
  }
}

/**
 * 向聊天参与者发送聊天删除通知
 */
export function emitChatDeletedToParticipants(
  participantIds: string[] = [],
  chatId: string,
) {
  if (!io && global.__socketIO) {
    io = global.__socketIO;
  }

  if (!io) {
    console.error("[Socket] IO not initialized");
    return;
  }

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:deleted", { chatId });
  }
}

/**
 * 向聊天参与者发送聊天信息更新通知
 */
export function emitChatInfoUpdatedToParticipants(
  participantIds: string[] = [],
  chatData: unknown,
) {
  if (!io && global.__socketIO) {
    io = global.__socketIO;
  }

  if (!io) {
    console.error("[Socket] IO not initialized");
    return;
  }

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:info-updated", chatData);
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
  if (!io && global.__socketIO) {
    io = global.__socketIO;
  }

  if (!io) {
    console.error("[Socket] IO not initialized, cannot emit message");
    return;
  }

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
 * 广播新公共聊天室创建
 */
export function emitNewPublicRoom(roomData: unknown) {
  if (!io && global.__socketIO) {
    io = global.__socketIO;
  }

  if (!io) {
    console.error("[Socket] IO not initialized, cannot emit new room");
    return;
  }

  io.emit("public-room:created", roomData);
}

/**
 * 广播公共聊天室删除
 */
export function emitPublicRoomDeleted(roomId: string) {
  if (!io && global.__socketIO) {
    io = global.__socketIO;
  }

  if (!io) {
    console.error("[Socket] IO not initialized, cannot emit room deleted");
    return;
  }

  io.emit("public-room:deleted", { roomId });
}

/**
 * 广播公共聊天室更新（例如成员数量变化）
 */
export function emitPublicRoomUpdate(_roomId: string, roomData: unknown) {
  if (!io && global.__socketIO) {
    io = global.__socketIO;
  }

  if (!io) {
    console.error("[Socket] IO not initialized, cannot emit room update");
    return;
  }

  io.emit("public-room:updated", roomData);
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
