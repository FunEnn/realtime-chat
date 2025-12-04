"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { assert, createError } from "@/lib/errors/app-error";
import {
  createSuccessResponse,
  handleServerActionError,
} from "@/lib/errors/error-handler";
import {
  emitLastMessageToParticipants,
  emitNewMessageToChatRoom,
  emitNewPublicRoom,
  emitPublicRoomDeleted,
  emitPublicRoomUpdate,
} from "@/lib/socket";
import type { ApiResponse } from "@/types/common";
import type {
  CreateMessageInput,
  CreatePublicRoomInput,
} from "@/types/prisma.types";
import * as messageRepository from "../repositories/message.repository";
import * as roomRepository from "../repositories/room.repository";
import * as userRepository from "../repositories/user.repository";

/**
 * 检查当前用户是否为管理员
 */
export async function checkIsAdmin() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { success: true, isAdmin: false };
    }

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) {
      return { success: true, isAdmin: false };
    }

    return { success: true, isAdmin: user.isAdmin || false };
  } catch (error) {
    console.error("Check admin status error:", error);
    return { success: false, isAdmin: false };
  }
}

/**
 * 获取所有公共聊天室列表
 */
export async function getAllPublicRooms() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    const rooms = await roomRepository.getAllPublicRooms();

    // 添加成员信息
    const roomsWithMemberInfo = await Promise.all(
      rooms.map(async (room) => {
        const isMember = await roomRepository.isUserInRoom(room.id, user.id);
        return { ...room, isMember };
      }),
    );

    return { success: true, rooms: roomsWithMemberInfo };
  } catch (error) {
    console.error("Get all public rooms error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get public rooms",
    };
  }
}

/**
 * 获取公共聊天室详情
 */
export async function getPublicRoomById(roomId: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    const room = await roomRepository.findPublicRoomById(roomId);
    if (!room) throw new Error("Public room not found");

    const isMember = await roomRepository.isUserInRoom(roomId, user.id);

    return { success: true, room: { ...room, isMember } };
  } catch (error) {
    console.error("Get public room error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get room",
    };
  }
}

/**
 * 获取聊天室消息
 */
export async function getRoomMessages(roomId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 验证是否是成员
    const isMember = await roomRepository.isUserInRoom(roomId, user.id);
    assert.authorized(isMember, "Not a member of this room");

    // 获取消息
    const result = await messageRepository.findMessagesByRoomId(roomId);

    return createSuccessResponse(
      { messages: result.messages },
      "Messages fetched successfully",
    );
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 创建公共聊天室
 */
export async function createPublicRoom(
  input: CreatePublicRoomInput,
): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 验证输入
    if (!input.name || input.name.trim().length === 0) {
      throw createError.validation("Room name is required");
    }

    // 创建聊天室
    const room = await roomRepository.createPublicRoom({
      name: input.name,
      avatar: input.avatar,
      description: input.description,
      creator: {
        connect: { id: user.id },
      },
    });

    if (!room) {
      throw new Error("Failed to create room");
    }

    // 通知其他用户新聊天室已创建
    emitNewPublicRoom(room);

    revalidatePath("/chat");

    return createSuccessResponse(room, "Room created successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 更新聊天室信息
 */
export async function updatePublicRoom(
  roomId: string,
  data: {
    name?: string;
    avatar?: string;
    description?: string;
  },
): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 获取聊天室
    const room = await roomRepository.findPublicRoomById(roomId);
    if (!room) throw new Error("Room not found");

    // 验证权限（只有创建者或管理员可以更新）
    const isCreator = room.createdById === user.id;
    const isAdmin = user.isAdmin || false;

    assert.authorized(
      isCreator || isAdmin,
      "Only creator or admin can update room",
    );

    // 更新聊天室
    const updatedRoom = await roomRepository.updatePublicRoom(roomId, data);

    // 通知更新
    emitPublicRoomUpdate(roomId, updatedRoom);

    revalidatePath(`/chat/public-room/${roomId}`);

    return createSuccessResponse(updatedRoom, "Room updated successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 删除聊天室（仅管理员可操作）
 */
export async function deletePublicRoom(roomId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 验证管理员权限
    assert.authorized(user.isAdmin, "Only admin can delete public rooms");

    // 获取聊天室
    const room = await roomRepository.findPublicRoomById(roomId);
    if (!room) throw new Error("Room not found");

    // 删除聊天室（级联删除成员和消息）
    await roomRepository.deletePublicRoom(roomId);

    // 通知所有客户端
    emitPublicRoomDeleted(roomId);

    revalidatePath("/chat");

    return createSuccessResponse(null, "Room deleted successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 加入聊天室
 */
export async function joinPublicRoom(roomId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 检查聊天室是否存在
    const room = await roomRepository.findPublicRoomById(roomId);
    if (!room) throw new Error("Room not found");

    // 检查是否已经是成员
    const isMember = await roomRepository.isUserInRoom(roomId, user.id);
    if (isMember) {
      return createSuccessResponse(null, "Already a member");
    }

    // 加入聊天室
    await roomRepository.joinRoom(roomId, user.id);

    // 通知更新
    const updatedRoom = await roomRepository.findPublicRoomById(roomId);
    if (updatedRoom) {
      emitPublicRoomUpdate(roomId, updatedRoom);
    }

    // 发送系统消息通知其他用户
    const systemMessage = {
      id: `system-${Date.now()}`,
      content: `${user.name || "Someone"} joined the room`,
      chatId: roomId,
      senderId: user.id,
      sender: user,
      image: null,
      replyToId: null,
      replyTo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystemMessage: true,
    };
    emitNewMessageToChatRoom(user.id, roomId, systemMessage);

    revalidatePath(`/chat/public-room/${roomId}`);

    return createSuccessResponse(null, "Joined room successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 离开聊天室
 */
export async function leavePublicRoom(roomId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 检查是否是成员
    const isMember = await roomRepository.isUserInRoom(roomId, user.id);
    if (!isMember) {
      throw createError.validation("Not a member of this room");
    }

    // 离开聊天室
    await roomRepository.leaveRoom(roomId, user.id);

    // 通知更新
    const room = await roomRepository.findPublicRoomById(roomId);
    if (room) {
      emitPublicRoomUpdate(roomId, room);
    }

    // 发送系统消息通知其他用户
    const systemMessage = {
      id: `system-${Date.now()}`,
      content: `${user.name || "Someone"} left the room`,
      chatId: roomId,
      senderId: user.id,
      sender: user,
      image: null,
      replyToId: null,
      replyTo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystemMessage: true,
    };
    emitNewMessageToChatRoom(user.id, roomId, systemMessage);

    revalidatePath("/chat");

    return createSuccessResponse(null, "Left room successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 发送聊天室消息
 */
export async function sendRoomMessage(
  input: CreateMessageInput & { roomId: string },
): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 验证权限
    const isMember = await roomRepository.isUserInRoom(input.roomId, user.id);
    assert.authorized(isMember, "Not a member of this room");

    // 验证输入
    if (!input.content?.trim() && !input.image) {
      throw createError.validation("Message must have content or image");
    }

    // 创建消息
    const message = await messageRepository.createRoomMessage({
      room: { connect: { id: input.roomId } },
      sender: { connect: { id: user.id } },
      content: input.content,
      image: input.image,
      replyToId: input.replyToId,
    });

    // 获取聊天室成员
    const memberIds = await roomRepository.getRoomMemberIds(input.roomId);

    // 实时推送
    emitNewMessageToChatRoom(user.id, input.roomId, message);
    emitLastMessageToParticipants(memberIds, input.roomId, message);

    revalidatePath(`/chat/public-room/${input.roomId}`);

    return createSuccessResponse(message, "Message sent successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 标记聊天室消息为已读
 */
export async function markRoomAsRead(roomId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 验证权限
    const isMember = await roomRepository.isUserInRoom(roomId, user.id);
    assert.authorized(isMember, "Not a member of this room");

    // 标记已读
    await roomRepository.markRoomAsRead(roomId, user.id);

    revalidatePath(`/chat/public-room/${roomId}`);

    return createSuccessResponse(null, "Room marked as read");
  } catch (error) {
    return handleServerActionError(error);
  }
}
