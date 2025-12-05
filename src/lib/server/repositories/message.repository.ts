/**
 * Message Repository - 消息数据访问层
 * 职责：仅负责数据库操作，不包含业务逻辑
 */

import type { Prisma } from "@prisma/client";
import prisma from "../prisma";

/**
 * 根据聊天 ID 查找消息列表
 * @param chatId - 聊天 ID
 * @param options - 查询选项
 */
export async function findMessagesByChatId(
  chatId: string,
  options?: {
    skip?: number;
    take?: number;
  },
) {
  const messages = await prisma.message.findMany({
    where: { chatId },
    include: {
      sender: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    skip: options?.skip,
    take: options?.take,
  });

  // 手动获取引用的消息
  const replyToIds = messages
    .map((m) => m.replyToId)
    .filter((id): id is string => !!id);

  const replyToMessages =
    replyToIds.length > 0
      ? await prisma.message.findMany({
          where: { id: { in: replyToIds } },
          include: { sender: true },
        })
      : [];

  const replyToMap = new Map(replyToMessages.map((m) => [m.id, m]));

  // 组装消息数据
  const messagesWithReply = messages.map((msg) => ({
    ...msg,
    replyTo: msg.replyToId ? replyToMap.get(msg.replyToId) || null : null,
  }));

  const total = await prisma.message.count({
    where: { chatId },
  });

  return {
    messages: messagesWithReply,
    total,
    hasMore: options?.take ? total > (options.skip || 0) + options.take : false,
  };
}

/**
 * 根据公共聊天室 ID 查找消息列表
 * @param roomId - 公共聊天室 ID
 * @param options - 查询选项
 */
export async function findMessagesByRoomId(
  roomId: string,
  options?: {
    skip?: number;
    take?: number;
  },
) {
  const messages = await prisma.roomMessage.findMany({
    where: { roomId },
    include: {
      sender: true,
    },
    orderBy: {
      createdAt: "asc",
    },
    skip: options?.skip,
    take: options?.take,
  });

  // 手动获取引用的消息
  const replyToIds = messages
    .map((m) => m.replyToId)
    .filter((id): id is string => !!id);

  const replyToMessages =
    replyToIds.length > 0
      ? await prisma.roomMessage.findMany({
          where: { id: { in: replyToIds } },
          include: { sender: true },
        })
      : [];

  const replyToMap = new Map(replyToMessages.map((m) => [m.id, m]));

  // 组装消息数据
  const messagesWithReply = messages.map((msg) => ({
    ...msg,
    replyTo: msg.replyToId ? replyToMap.get(msg.replyToId) || null : null,
  }));

  const total = await prisma.roomMessage.count({
    where: { roomId },
  });

  return {
    messages: messagesWithReply,
    total,
    hasMore: options?.take ? total > (options.skip || 0) + options.take : false,
  };
}

/**
 * 根据 ID 查找消息
 * @param messageId - 消息 ID
 */
export async function findMessageById(messageId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      sender: true,
    },
  });

  if (!message) return null;

  // 如果有引用消息，手动获取
  if (message.replyToId) {
    const replyTo = await prisma.message.findUnique({
      where: { id: message.replyToId },
      include: { sender: true },
    });
    return {
      ...message,
      replyTo,
    };
  }

  return {
    ...message,
    replyTo: null,
  };
}

/**
 * 创建聊天消息
 * @param data - 消息数据
 */
export async function createChatMessage(data: Prisma.MessageCreateInput) {
  const message = await prisma.message.create({
    data,
    include: {
      sender: true,
    },
  });

  // 如果有引用消息，手动获取
  if (message.replyToId) {
    const replyTo = await prisma.message.findUnique({
      where: { id: message.replyToId },
      include: { sender: true },
    });
    return {
      ...message,
      replyTo,
    };
  }

  return {
    ...message,
    replyTo: null,
  };
}

/**
 * 创建聊天室消息
 * @param data - 消息数据
 */
export async function createRoomMessage(data: Prisma.RoomMessageCreateInput) {
  const message = await prisma.roomMessage.create({
    data,
    include: {
      sender: true,
    },
  });

  // 如果有引用消息，手动获取
  if (message.replyToId) {
    const replyTo = await prisma.roomMessage.findUnique({
      where: { id: message.replyToId },
      include: { sender: true },
    });
    return {
      ...message,
      replyTo,
    };
  }

  return {
    ...message,
    replyTo: null,
  };
}

/**
 * 删除消息
 * @param messageId - 消息 ID
 */
export async function deleteMessage(messageId: string) {
  return prisma.message.delete({
    where: { id: messageId },
  });
}

/**
 * 删除聊天室消息
 * @param messageId - 消息 ID
 */
export async function deleteRoomMessage(messageId: string) {
  return prisma.roomMessage.delete({
    where: { id: messageId },
  });
}

/**
 * 根据聊天 ID 获取最新消息
 * @param chatId - 聊天 ID
 */
export async function getLatestMessage(chatId: string) {
  const message = await prisma.message.findFirst({
    where: { chatId },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sender: true,
    },
  });

  if (!message) return null;

  // 如果有引用消息，手动获取
  if (message.replyToId) {
    const replyTo = await prisma.message.findUnique({
      where: { id: message.replyToId },
      include: { sender: true },
    });
    return {
      ...message,
      replyTo,
    };
  }

  return {
    ...message,
    replyTo: null,
  };
}

/**
 * 根据聊天室 ID 获取最新消息
 * @param roomId - 聊天室 ID
 */
export async function getLatestRoomMessage(roomId: string) {
  const message = await prisma.roomMessage.findFirst({
    where: { roomId },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sender: true,
    },
  });

  if (!message) return null;

  // 如果有引用消息，手动获取
  if (message.replyToId) {
    const replyTo = await prisma.roomMessage.findUnique({
      where: { id: message.replyToId },
      include: { sender: true },
    });
    return {
      ...message,
      replyTo,
    };
  }

  return {
    ...message,
    replyTo: null,
  };
}

/**
 * 搜索聊天消息
 * @param chatId - 聊天 ID
 * @param query - 搜索关键词
 */
export async function searchMessages(chatId: string, query: string) {
  const messages = await prisma.message.findMany({
    where: {
      chatId,
      content: {
        contains: query,
        mode: "insensitive",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sender: true,
    },
    take: 50,
  });

  // 手动获取引用的消息
  const replyToIds = messages
    .map((m) => m.replyToId)
    .filter((id): id is string => !!id);

  const replyToMessages =
    replyToIds.length > 0
      ? await prisma.message.findMany({
          where: { id: { in: replyToIds } },
          include: { sender: true },
        })
      : [];

  const replyToMap = new Map(replyToMessages.map((m) => [m.id, m]));

  return messages.map((msg) => ({
    ...msg,
    replyTo: msg.replyToId ? replyToMap.get(msg.replyToId) || null : null,
  }));
}

/**
 * 搜索聊天室消息
 * @param roomId - 聊天室 ID
 * @param query - 搜索关键词
 */
export async function searchRoomMessages(roomId: string, query: string) {
  const messages = await prisma.roomMessage.findMany({
    where: {
      roomId,
      content: {
        contains: query,
        mode: "insensitive",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sender: true,
    },
    take: 50,
  });

  // 手动获取引用的消息
  const replyToIds = messages
    .map((m) => m.replyToId)
    .filter((id): id is string => !!id);

  const replyToMessages =
    replyToIds.length > 0
      ? await prisma.roomMessage.findMany({
          where: { id: { in: replyToIds } },
          include: { sender: true },
        })
      : [];

  const replyToMap = new Map(replyToMessages.map((m) => [m.id, m]));

  return messages.map((msg) => ({
    ...msg,
    replyTo: msg.replyToId ? replyToMap.get(msg.replyToId) || null : null,
  }));
}

/**
 * 获取未读消息数
 * @param chatId - 聊天 ID
 * @param lastReadAt - 最后阅读时间
 */
export async function getUnreadMessageCount(
  chatId: string,
  lastReadAt?: Date | null,
) {
  if (!lastReadAt) {
    return prisma.message.count({
      where: { chatId },
    });
  }

  return prisma.message.count({
    where: {
      chatId,
      createdAt: {
        gt: lastReadAt,
      },
    },
  });
}
