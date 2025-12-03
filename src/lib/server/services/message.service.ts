import { assert } from "@/lib/errors/app-error";
import * as chatRepo from "../repositories/chat.repository";
import * as messageRepo from "../repositories/message.repository";
import * as roomRepo from "../repositories/room.repository";
import * as userRepo from "../repositories/user.repository";

export async function findMessagesByChatId(
  chatId: string,
  options?: {
    skip?: number;
    take?: number;
  },
) {
  return messageRepo.findMessagesByChatId(chatId, options);
}

export async function findMessagesByRoomId(
  roomId: string,
  options?: {
    skip?: number;
    take?: number;
  },
) {
  return messageRepo.findMessagesByRoomId(roomId, options);
}

export async function getChatMessages(
  chatId: string,
  userId: string,
  options?: {
    skip?: number;
    take?: number;
  },
) {
  const isMember = await chatRepo.isUserInChat(chatId, userId);
  assert.authorized(isMember, "Not a member of this chat");
  return messageRepo.findMessagesByChatId(chatId, options);
}

export async function getRoomMessages(
  roomId: string,
  userId: string,
  options?: {
    skip?: number;
    take?: number;
  },
) {
  const isMember = await roomRepo.isUserInRoom(roomId, userId);
  assert.authorized(isMember, "Not a member of this room");
  return messageRepo.findMessagesByRoomId(roomId, options);
}

export async function createChatMessage(
  userId: string,
  data: {
    chatId: string;
    content: string;
    contentType: string;
  },
) {
  const user = await userRepo.findUserById(userId);
  assert.exists(user, "User");

  const isMember = await chatRepo.isUserInChat(data.chatId, userId);
  assert.authorized(isMember, "Not a member of this chat");

  const message = await messageRepo.createChatMessage({
    content: data.content,
    sender: {
      connect: { id: userId },
    },
    chat: {
      connect: { id: data.chatId },
    },
  });

  await chatRepo.incrementUnreadCount(data.chatId, userId);
  return message;
}

export async function createRoomMessage(
  userId: string,
  data: {
    roomId: string;
    content: string;
    contentType: string;
  },
) {
  const user = await userRepo.findUserById(userId);
  assert.exists(user, "User");

  const isMember = await roomRepo.isUserInRoom(data.roomId, userId);
  assert.authorized(isMember, "Not a member of this room");

  return messageRepo.createRoomMessage({
    content: data.content,
    sender: {
      connect: { id: userId },
    },
    room: {
      connect: { id: data.roomId },
    },
  });
}
