import { assert, createError } from "@/lib/errors/app-error";
import * as roomRepo from "../repositories/room.repository";
import * as userRepo from "../repositories/user.repository";

export async function findPublicRoomById(roomId: string) {
  return roomRepo.findPublicRoomById(roomId);
}

export async function getAllPublicRooms() {
  return roomRepo.getAllPublicRooms();
}

export async function getRoomMemberIds(roomId: string) {
  return roomRepo.getRoomMemberIds(roomId);
}

export async function isUserInRoom(roomId: string, userId: string) {
  return roomRepo.isUserInRoom(roomId, userId);
}

/**
 * 获取所有公共聊天室（包含用户成员信息）
 * @param userId - 用户 ID
 */
export async function getAllRoomsWithMemberInfo(userId: string) {
  const rooms = await roomRepo.getAllPublicRooms();

  // 为每个房间添加当前用户是否是成员的信息
  const roomsWithInfo = await Promise.all(
    rooms.map(async (room) => {
      const isMember = await roomRepo.isUserInRoom(room.id, userId);
      return {
        ...room,
        isMember,
      };
    }),
  );

  return roomsWithInfo;
}

/**
 * 获取聊天室详情（包含成员信息）
 * @param roomId - 聊天室 ID
 * @param userId - 用户 ID
 */
export async function getRoomWithMemberInfo(roomId: string, userId: string) {
  const room = await roomRepo.findPublicRoomById(roomId);
  assert.exists(room, "Public room");

  const isMember = await roomRepo.isUserInRoom(roomId, userId);

  return {
    ...room,
    isMember,
  };
}

export async function createPublicRoom(
  userId: string,
  data: {
    name: string;
    avatar?: string;
    description?: string;
  },
) {
  const user = await userRepo.findUserById(userId);
  assert.exists(user, "User");

  if (!data.name || data.name.trim().length === 0) {
    throw createError.validation("Room name is required");
  }

  return roomRepo.createPublicRoom({
    name: data.name,
    avatar: data.avatar,
    description: data.description,
    creator: {
      connect: { id: userId },
    },
  });
}

export async function updatePublicRoom(
  roomId: string,
  userId: string,
  data: {
    name?: string;
    avatar?: string;
    description?: string;
  },
) {
  const roomOrNull = await roomRepo.findPublicRoomById(roomId);
  const room = assert.exists(roomOrNull, "Public room");

  assert.authorized(
    room.createdById === userId,
    "Only creator can update this room",
  );

  return roomRepo.updatePublicRoom(roomId, data);
}

export async function deletePublicRoom(roomId: string, userId: string) {
  const roomOrNull = await roomRepo.findPublicRoomById(roomId);
  const room = assert.exists(roomOrNull, "Public room");

  assert.authorized(
    room.createdById === userId,
    "Only creator can delete this room",
  );

  return roomRepo.deletePublicRoom(roomId);
}

export async function joinPublicRoom(roomId: string, userId: string) {
  const user = await userRepo.findUserById(userId);
  assert.exists(user, "User");

  const roomOrNull = await roomRepo.findPublicRoomById(roomId);
  assert.exists(roomOrNull, "Public room");

  const isMember = await roomRepo.isUserInRoom(roomId, userId);
  if (isMember) {
    throw createError.conflict("Already a member of this room");
  }

  return roomRepo.joinRoom(roomId, userId);
}

export async function leavePublicRoom(roomId: string, userId: string) {
  const user = await userRepo.findUserById(userId);
  assert.exists(user, "User");

  const roomOrNull2 = await roomRepo.findPublicRoomById(roomId);
  const room = assert.exists(roomOrNull2, "Public room");

  const isMember = await roomRepo.isUserInRoom(roomId, userId);
  if (!isMember) {
    throw createError.notFound("Not a member of this room");
  }

  if (room.createdById === userId) {
    throw createError.forbidden("Creator cannot leave the room");
  }

  return roomRepo.leaveRoom(roomId, userId);
}
