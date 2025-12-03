"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import * as messageService from "../services/message.service";
import * as publicRoomService from "../services/room.service";
import * as userService from "../services/user.service";

/**
 * 检查当前用户是否为管理员
 */
export async function checkIsAdmin() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return { success: true, isAdmin: false };
    }

    const user = await userService.findUserByClerkId(clerkId);

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
 * 获取所有公共聊天室列表（Server Component 用）
 */
export async function getAllPublicRooms() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const user = await userService.findUserByClerkId(clerkId);

    if (!user) {
      throw new Error("User not found");
    }

    const rooms = await publicRoomService.getAllPublicRooms();

    // 为每个房间添加当前用户是否是成员的信息
    const roomsWithMemberInfo = await Promise.all(
      rooms.map(async (room) => {
        const isMember = await publicRoomService.isUserInRoom(room.id, user.id);
        return {
          ...room,
          isMember,
        };
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
 * 获取公共聊天室详情（Server Component 用）
 */
export async function getPublicRoomById(roomId: string) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const user = await userService.findUserByClerkId(clerkId);

    if (!user) {
      throw new Error("User not found");
    }

    const room = await publicRoomService.findPublicRoomById(roomId);

    if (!room) {
      throw new Error("Public room not found");
    }

    const isMember = await publicRoomService.isUserInRoom(roomId, user.id);

    const messages = isMember
      ? await messageService.findMessagesByRoomId(roomId)
      : undefined;

    return {
      success: true,
      room: {
        ...room,
        isMember,
      },
      messages,
    };
  } catch (error) {
    console.error("Get public room by ID error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get public room",
    };
  }
}

/**
 * 创建公共聊天室（仅管理员）
 */
export async function createPublicRoom(data: {
  name: string;
  avatar?: string;
  description?: string;
}) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const user = await userService.findUserByClerkId(clerkId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isAdmin) {
      throw new Error("Only administrators can create public rooms");
    }

    const room = await publicRoomService.createPublicRoom(user.id, {
      name: data.name,
      avatar: data.avatar,
      description: data.description,
    });

    revalidatePath("/chat/public-room");

    return { success: true, room };
  } catch (error) {
    console.error("Create public room error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create public room",
    };
  }
}

/**
 * 更新公共聊天室信息（仅管理员）
 */
export async function updatePublicRoom(
  roomId: string,
  data: {
    name?: string;
    avatar?: string;
    description?: string;
  },
) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const user = await userService.findUserByClerkId(clerkId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isAdmin) {
      throw new Error("Only administrators can update public rooms");
    }

    const room = await publicRoomService.findPublicRoomById(roomId);

    if (!room) {
      throw new Error("Public room not found");
    }

    const updatedRoom = await publicRoomService.updatePublicRoom(
      roomId,
      user.id,
      {
        name: data.name,
        avatar: data.avatar,
        description: data.description,
      },
    );

    revalidatePath("/chat/public-room");
    revalidatePath(`/chat/public-room/${roomId}`);

    return { success: true, room: updatedRoom };
  } catch (error) {
    console.error("Update public room error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update public room",
    };
  }
}

/**
 * 删除公共聊天室（仅管理员）
 */
export async function deletePublicRoom(roomId: string) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const user = await userService.findUserByClerkId(clerkId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isAdmin) {
      throw new Error("Only administrators can delete public rooms");
    }

    const room = await publicRoomService.findPublicRoomById(roomId);

    if (!room) {
      throw new Error("Public room not found");
    }

    await publicRoomService.deletePublicRoom(roomId, user.id);

    revalidatePath("/chat/public-room");

    return { success: true };
  } catch (error) {
    console.error("Delete public room error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete public room",
    };
  }
}

/**
 * 加入公共聊天室
 */
export async function joinPublicRoom(roomId: string) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const user = await userService.findUserByClerkId(clerkId);

    if (!user) {
      throw new Error("User not found");
    }

    const room = await publicRoomService.findPublicRoomById(roomId);

    if (!room) {
      throw new Error("Public room not found");
    }

    // 检查是否已经是成员
    const isMember = await publicRoomService.isUserInRoom(roomId, user.id);
    if (isMember) {
      throw new Error("Already a member of this room");
    }

    await publicRoomService.joinPublicRoom(roomId, user.id);

    // 重新验证相关页面
    revalidatePath("/chat/public-room");
    revalidatePath(`/chat/public-room/${roomId}`);

    return { success: true };
  } catch (error) {
    console.error("Join public room error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to join public room",
    };
  }
}

/**
 * 离开公共聊天室
 */
export async function leavePublicRoom(roomId: string) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const user = await userService.findUserByClerkId(clerkId);

    if (!user) {
      throw new Error("User not found");
    }

    const room = await publicRoomService.findPublicRoomById(roomId);

    if (!room) {
      throw new Error("Public room not found");
    }

    // 检查是否是成员
    const isMember = await publicRoomService.isUserInRoom(roomId, user.id);
    if (!isMember) {
      throw new Error("Not a member of this room");
    }

    await publicRoomService.leavePublicRoom(roomId, user.id);

    // 重新验证相关页面
    revalidatePath("/chat/public-room");
    revalidatePath(`/chat/public-room/${roomId}`);

    return { success: true };
  } catch (error) {
    console.error("Leave public room error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to leave public room",
    };
  }
}

/**
 * 发送公共聊天室消息
 */
export async function sendRoomMessage(data: {
  roomId: string;
  content?: string;
  image?: string;
  replyToId?: string;
}) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const user = await userService.findUserByClerkId(clerkId);

    if (!user) {
      throw new Error("User not found");
    }

    // 检查是否是成员
    const isMember = await publicRoomService.isUserInRoom(data.roomId, user.id);
    if (!isMember) {
      throw new Error("Not a member of this room");
    }

    const message = await messageService.createRoomMessage(user.id, {
      roomId: data.roomId,
      content: data.content || "",
      contentType: data.image ? "image" : "text",
    });

    // 重新验证房间页面
    revalidatePath(`/chat/public-room/${data.roomId}`);

    return { success: true, message };
  } catch (error) {
    console.error("Send room message error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send message",
    };
  }
}
