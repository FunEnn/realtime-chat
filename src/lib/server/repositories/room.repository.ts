/**
 * Room Repository - 公共聊天室数据访问层
 * 职责：仅负责数据库操作，不包含业务逻辑
 */

import type { Prisma } from "@prisma/client";
import prisma from "../prisma";

/**
 * 获取所有公共聊天室
 */
export async function getAllPublicRooms() {
  return prisma.publicRoom.findMany({
    include: {
      creator: true,
      members: true,
      _count: {
        select: {
          members: true,
          messages: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * 根据 ID 查找公共聊天室
 * @param roomId - 聊天室 ID
 */
export async function findPublicRoomById(roomId: string) {
  return prisma.publicRoom.findUnique({
    where: { id: roomId },
    include: {
      creator: true,
      members: {
        include: {
          user: true,
        },
      },
      _count: {
        select: {
          members: true,
          messages: true,
        },
      },
    },
  });
}

/**
 * 创建公共聊天室（自动加入创建者）
 * @param data - 聊天室数据
 */
export async function createPublicRoom(data: Prisma.PublicRoomCreateInput) {
  return prisma.$transaction(async (tx) => {
    const room = await tx.publicRoom.create({
      data,
      include: {
        creator: true,
      },
    });

    await tx.roomMember.create({
      data: {
        roomId: room.id,
        userId: room.createdById,
      },
    });

    return tx.publicRoom.findUnique({
      where: { id: room.id },
      include: {
        creator: true,
        members: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });
  });
}

/**
 * 更新公共聊天室信息
 * @param roomId - 聊天室 ID
 * @param data - 更新数据
 */
export async function updatePublicRoom(
  roomId: string,
  data: Prisma.PublicRoomUpdateInput,
) {
  return prisma.publicRoom.update({
    where: { id: roomId },
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
 * 删除公共聊天室
 * @param roomId - 聊天室 ID
 */
export async function deletePublicRoom(roomId: string) {
  return prisma.publicRoom.delete({
    where: { id: roomId },
  });
}

/**
 * 检查用户是否是聊天室成员
 * @param roomId - 聊天室 ID
 * @param userId - 用户 ID
 */
export async function isUserInRoom(roomId: string, userId: string) {
  const member = await prisma.roomMember.findUnique({
    where: {
      roomId_userId: {
        roomId,
        userId,
      },
    },
  });

  return !!member;
}

/**
 * 用户加入聊天室
 * @param roomId - 聊天室 ID
 * @param userId - 用户 ID
 */
export async function joinRoom(roomId: string, userId: string) {
  return prisma.roomMember.create({
    data: {
      roomId,
      userId,
    },
    include: {
      user: true,
      room: true,
    },
  });
}

/**
 * 用户离开聊天室
 * @param roomId - 聊天室 ID
 * @param userId - 用户 ID
 */
export async function leaveRoom(roomId: string, userId: string) {
  return prisma.roomMember.delete({
    where: {
      roomId_userId: {
        roomId,
        userId,
      },
    },
  });
}

/**
 * 获取聊天室成员列表
 * @param roomId - 聊天室 ID
 */
export async function getRoomMembers(roomId: string) {
  return prisma.roomMember.findMany({
    where: { roomId },
    include: {
      user: true,
    },
  });
}

/**
 * 获取用户加入的所有聊天室
 * @param userId - 用户 ID
 */
export async function getUserRooms(userId: string) {
  const memberships = await prisma.roomMember.findMany({
    where: { userId },
    include: {
      room: {
        include: {
          creator: true,
          _count: {
            select: {
              members: true,
              messages: true,
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
    orderBy: {
      joinedAt: "desc",
    },
  });

  return memberships.map((m) => ({
    ...m.room,
    lastMessage: m.room.messages[0] || null,
    joinedAt: m.joinedAt,
  }));
}

/**
 * 获取聊天室成员 ID 列表
 * @param roomId - 聊天室 ID
 */
export async function getRoomMemberIds(roomId: string): Promise<string[]> {
  const members = await prisma.roomMember.findMany({
    where: { roomId },
    select: { userId: true },
  });

  return members.map((member) => member.userId);
}

/**
 * 获取聊天室成员数量
 * @param roomId - 聊天室 ID
 */
export async function getRoomMemberCount(roomId: string) {
  return prisma.roomMember.count({
    where: { roomId },
  });
}

/**
 * 获取聊天室消息数量
 * @param roomId - 聊天室 ID
 */
export async function getRoomMessageCount(roomId: string) {
  return prisma.roomMessage.count({
    where: { roomId },
  });
}

/**
 * 获取用户在聊天室的未读消息数
 */
export async function getRoomUnreadCount(roomId: string, userId: string) {
  const member = await prisma.roomMember.findUnique({
    where: {
      roomId_userId: {
        roomId,
        userId,
      },
    },
    select: { unreadCount: true },
  });

  return member?.unreadCount || 0;
}

/**
 * 标记聊天室为已读
 */
export async function markRoomAsRead(roomId: string, userId: string) {
  return prisma.roomMember.update({
    where: {
      roomId_userId: {
        roomId,
        userId,
      },
    },
    data: {
      unreadCount: 0,
      lastReadAt: new Date(),
    },
  });
}

/**
 * 增加聊天室未读消息数
 */
export async function incrementRoomUnreadCount(
  roomId: string,
  excludeUserId?: string,
) {
  return prisma.roomMember.updateMany({
    where: {
      roomId,
      ...(excludeUserId && { userId: { not: excludeUserId } }),
    },
    data: {
      unreadCount: {
        increment: 1,
      },
    },
  });
}
