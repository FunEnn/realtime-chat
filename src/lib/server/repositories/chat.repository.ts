/**
 * Chat Repository - 聊天数据访问层
 * 职责：仅负责数据库操作，不包含业务逻辑
 */

import type { Prisma } from "@prisma/client";
import prisma from "../prisma";

/**
 * 根据用户 ID 查找聊天列表
 * @param userId - 用户 ID
 */
export async function findChatsByUserId(userId: string) {
  const chatMembers = await prisma.chatMember.findMany({
    where: { userId },
    include: {
      chat: {
        include: {
          creator: true,
          members: {
            include: {
              user: true,
            },
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
            include: {
              sender: true,
            },
          },
        },
      },
    },
  });

  return chatMembers
    .filter((chatMember) => chatMember.chat !== null)
    .map((chatMember) => ({
      ...chatMember.chat!,
      unreadCount: chatMember.unreadCount,
      lastReadAt: chatMember.lastReadAt,
      lastMessage: chatMember.chat?.messages[0] || null,
    }));
}

/**
 * 根据 ID 查找聊天
 * @param chatId - 聊天 ID
 */
export async function findChatById(chatId: string) {
  return prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      creator: true,
      members: {
        include: {
          user: true,
        },
      },
    },
  });
}

/**
 * 创建聊天（包含成员）
 * @param data - 聊天数据
 * @param memberIds - 成员 ID 列表
 */
export async function createChat(
  data: Prisma.ChatCreateInput,
  memberIds: string[],
) {
  return prisma.$transaction(async (tx) => {
    const chat = await tx.chat.create({
      data,
      include: {
        creator: true,
      },
    });

    await tx.chatMember.createMany({
      data: memberIds.map((userId) => ({
        chatId: chat.id,
        userId,
      })),
    });

    return tx.chat.findUnique({
      where: { id: chat.id },
      include: {
        creator: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  });
}

/**
 * 获取聊天参与者 ID 列表
 * @param chatId - 聊天 ID
 */
export async function getChatParticipantIds(chatId: string): Promise<string[]> {
  const members = await prisma.chatMember.findMany({
    where: { chatId },
    select: { userId: true },
  });

  return members.map((member) => member.userId);
}

/**
 * 更新聊天时间戳
 * @param chatId - 聊天 ID
 */
export async function updateChatTimestamp(chatId: string) {
  return prisma.chat.update({
    where: { id: chatId },
    data: {
      updatedAt: new Date(),
    },
  });
}

/**
 * 添加聊天成员
 * @param chatId - 聊天 ID
 * @param userId - 用户 ID
 */
export async function addChatMember(chatId: string, userId: string) {
  return prisma.chatMember.create({
    data: {
      chatId,
      userId,
    },
    include: {
      user: true,
    },
  });
}

/**
 * 移除聊天成员
 * @param chatId - 聊天 ID
 * @param userId - 用户 ID
 */
export async function removeChatMember(chatId: string, userId: string) {
  return prisma.chatMember.delete({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
  });
}

/**
 * 获取聊天成员信息
 * @param chatId - 聊天 ID
 * @param userId - 用户 ID
 */
export async function getChatMember(chatId: string, userId: string) {
  return prisma.chatMember.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
    include: {
      user: true,
      chat: true,
    },
  });
}

/**
 * 更新聊天信息
 * @param chatId - 聊天 ID
 * @param data - 更新数据
 */
export async function updateChat(chatId: string, data: Prisma.ChatUpdateInput) {
  return prisma.chat.update({
    where: { id: chatId },
    data,
    include: {
      creator: true,
      members: {
        include: {
          user: true,
        },
      },
    },
  });
}

/**
 * 删除聊天（级联删除成员和消息）
 * @param chatId - 聊天 ID
 */
export async function deleteChat(chatId: string) {
  return prisma.$transaction(async (tx) => {
    // 先删除聊天消息
    await tx.message.deleteMany({
      where: { chatId },
    });

    // 删除聊天成员
    await tx.chatMember.deleteMany({
      where: { chatId },
    });

    // 最后删除聊天
    return tx.chat.delete({
      where: { id: chatId },
    });
  });
}

/**
 * 标记聊天为已读
 * @param chatId - 聊天 ID
 * @param userId - 用户 ID
 */
export async function markChatAsRead(chatId: string, userId: string) {
  return prisma.chatMember.updateMany({
    where: {
      chatId,
      userId,
    },
    data: {
      unreadCount: 0,
      lastReadAt: new Date(),
    },
  });
}

/**
 * 检查用户是否是聊天成员
 * @param chatId - 聊天 ID
 * @param userId - 用户 ID
 */
export async function isUserInChat(chatId: string, userId: string) {
  const chatMember = await prisma.chatMember.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
  });

  return !!chatMember;
}

/**
 * 增加未读消息数
 * @param chatId - 聊天 ID
 * @param excludeUserId - 排除的用户 ID（发送者）
 */
export async function incrementUnreadCount(
  chatId: string,
  excludeUserId: string,
) {
  return prisma.chatMember.updateMany({
    where: {
      chatId,
      userId: {
        not: excludeUserId,
      },
    },
    data: {
      unreadCount: {
        increment: 1,
      },
    },
  });
}

/**
 * 检查一对一聊天是否已存在
 * @param userId1 - 用户 1 ID
 * @param userId2 - 用户 2 ID
 */
export async function findExistingOneOnOneChat(
  userId1: string,
  userId2: string,
) {
  const chats = await prisma.chat.findMany({
    where: {
      isGroup: false,
      members: {
        every: {
          userId: {
            in: [userId1, userId2],
          },
        },
      },
    },
    include: {
      members: true,
    },
  });

  // 检查是否是精确的两人聊天
  return chats.find((chat) => chat.members.length === 2);
}
