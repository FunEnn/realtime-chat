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

  const total = await prisma.message.count({
    where: { chatId },
  });

  return {
    messages,
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

  const total = await prisma.roomMessage.count({
    where: { roomId },
  });

  return {
    messages,
    total,
    hasMore: options?.take ? total > (options.skip || 0) + options.take : false,
  };
}

/**
 * 根据 ID 查找消息
 * @param messageId - 消息 ID
 */
export async function findMessageById(messageId: string) {
  return prisma.message.findUnique({
    where: { id: messageId },
    include: {
      sender: true,
    },
  });
}

/**
 * 创建聊天消息
 * @param data - 消息数据
 */
export async function createChatMessage(data: Prisma.MessageCreateInput) {
  return prisma.message.create({
    data,
    include: {
      sender: true,
    },
  });
}

/**
 * 创建聊天室消息
 * @param data - 消息数据
 */
export async function createRoomMessage(data: Prisma.RoomMessageCreateInput) {
  return prisma.roomMessage.create({
    data,
    include: {
      sender: true,
    },
  });
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
  return prisma.message.findFirst({
    where: { chatId },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sender: true,
    },
  });
}

/**
 * 根据聊天室 ID 获取最新消息
 * @param roomId - 聊天室 ID
 */
export async function getLatestRoomMessage(roomId: string) {
  return prisma.roomMessage.findFirst({
    where: { roomId },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sender: true,
    },
  });
}

/**
 * 搜索聊天消息
 * @param chatId - 聊天 ID
 * @param query - 搜索关键词
 */
export async function searchMessages(chatId: string, query: string) {
  return prisma.message.findMany({
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
}

/**
 * 搜索聊天室消息
 * @param roomId - 聊天室 ID
 * @param query - 搜索关键词
 */
export async function searchRoomMessages(roomId: string, query: string) {
  return prisma.roomMessage.findMany({
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
