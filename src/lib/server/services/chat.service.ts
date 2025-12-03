import { assert, createError } from "@/lib/errors/app-error";
import * as chatRepo from "../repositories/chat.repository";
import * as userRepo from "../repositories/user.repository";

export async function findChatById(chatId: string) {
  return chatRepo.findChatById(chatId);
}

export async function findChatsByUserId(userId: string) {
  return chatRepo.findChatsByUserId(userId);
}

export async function getChatParticipantIds(chatId: string) {
  return chatRepo.getChatParticipantIds(chatId);
}

export async function isUserInChat(chatId: string, userId: string) {
  return chatRepo.isUserInChat(chatId, userId);
}

export async function markChatAsRead(chatId: string, userId: string) {
  return chatRepo.markChatAsRead(chatId, userId);
}

export async function updateChatTimestamp(chatId: string) {
  return chatRepo.updateChatTimestamp(chatId);
}

export async function getUserChats(userId: string) {
  const user = await userRepo.findUserById(userId);
  assert.exists(user, "User");

  // 获取聊天列表
  return chatRepo.findChatsByUserId(userId);
}

/**
 * 获取聊天详情并验证权限
 * @param chatId - 聊天 ID
 * @param userId - 用户 ID
 */
export async function getChatWithPermission(chatId: string, userId: string) {
  // 1. 获取聊天
  const chat = await chatRepo.findChatById(chatId);
  assert.exists(chat, "Chat");

  // 2. 验证用户是否有权限访问
  const isMember = await chatRepo.isUserInChat(chatId, userId);
  assert.authorized(isMember, "Not a member of this chat");

  return chat;
}

export async function updateChat(
  chatId: string,
  userId: string,
  data: {
    name?: string;
    avatar?: string;
    description?: string;
  },
) {
  const chatOrNull = await chatRepo.findChatById(chatId);
  const chat = assert.exists(chatOrNull, "Chat");

  assert.authorized(
    chat.createdById === userId,
    "Only creator can update this chat",
  );

  return chatRepo.updateChat(chatId, data);
}

export async function deleteChat(chatId: string, userId: string) {
  const chatOrNull = await chatRepo.findChatById(chatId);
  const chat = assert.exists(chatOrNull, "Chat");

  assert.authorized(
    chat.createdById === userId,
    "Only creator can delete this chat",
  );

  return chatRepo.deleteChat(chatId);
}

export async function markAsRead(chatId: string, userId: string) {
  const isMember = await chatRepo.isUserInChat(chatId, userId);
  assert.authorized(isMember, "Not a member of this chat");
  return chatRepo.markChatAsRead(chatId, userId);
}

export async function createChat(
  userId: string,
  data: {
    name?: string;
    isGroup: boolean;
    avatar?: string;
    description?: string;
    memberIds?: string[];
    participantId?: string;
  },
) {
  const user = await userRepo.findUserById(userId);
  assert.exists(user, "User");

  if (data.isGroup && !data.name) {
    throw createError.validation("Group chat must have a name");
  }

  if (!data.isGroup && !data.participantId) {
    throw createError.validation("One-on-one chat must have participant ID");
  }

  if (data.participantId === userId) {
    throw createError.validation("Cannot create chat with yourself");
  }

  if (!data.isGroup && data.participantId) {
    const existing = await chatRepo.findExistingOneOnOneChat(
      userId,
      data.participantId,
    );

    if (existing) {
      throw createError.conflict("Chat already exists");
    }
  }

  const memberIds = data.isGroup
    ? [userId, ...(data.memberIds || [])]
    : data.participantId
      ? [userId, data.participantId]
      : [userId];

  return chatRepo.createChat(
    {
      name: data.name,
      isGroup: data.isGroup,
      avatar: data.avatar,
      description: data.description,
      creator: {
        connect: { id: userId },
      },
    },
    memberIds,
  );
}
