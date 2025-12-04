"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { assert, createError } from "@/lib/errors/app-error";
import {
  createSuccessResponse,
  handleServerActionError,
} from "@/lib/errors/error-handler";
import {
  emitChatDeletedToParticipants,
  emitChatInfoUpdatedToParticipants,
  emitLastMessageToParticipants,
  emitNewChatToParticipants,
  emitNewMessageToChatRoom,
} from "@/lib/socket";
import type { ApiResponse } from "@/types/common";
import type { CreateChatInput, CreateMessageInput } from "@/types/prisma.types";
import * as chatRepository from "../repositories/chat.repository";
import * as messageRepository from "../repositories/message.repository";
import * as userRepository from "../repositories/user.repository";

/**
 * 获取当前用户的所有聊天列表
 */
export async function getAllChats(): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    const chats = await chatRepository.findChatsByUserId(user.id);

    return createSuccessResponse(chats, "Chats fetched successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 根据 ID 获取聊天详情（包含消息）
 */
export async function getChatById(chatId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 获取聊天
    const chat = await chatRepository.findChatById(chatId);
    if (!chat) throw new Error("Chat not found");

    // 验证权限
    const isMember = await chatRepository.isUserInChat(chatId, user.id);
    assert.authorized(isMember, "You are not a member of this chat");

    // 获取消息
    const result = await messageRepository.findMessagesByChatId(chatId);

    return createSuccessResponse(
      { chat, messages: result.messages },
      "Chat fetched successfully",
    );
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 获取聊天的消息列表
 */
export async function getChatMessages(chatId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 验证权限
    const isMember = await chatRepository.isUserInChat(chatId, user.id);
    assert.authorized(isMember, "You are not a member of this chat");

    // 获取消息
    const result = await messageRepository.findMessagesByChatId(chatId);

    return createSuccessResponse(
      { messages: result.messages },
      "Messages fetched successfully",
    );
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 更新聊天信息（仅创建者可操作）
 */
export async function updateChatInfo(
  chatId: string,
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

    // 获取聊天并验证权限
    const chat = await chatRepository.findChatById(chatId);
    if (!chat) throw new Error("Chat not found");

    assert.authorized(
      chat.createdById === user.id,
      "Only creator can update this chat",
    );

    // 更新聊天
    const updatedChat = await chatRepository.updateChat(chatId, data);

    // 获取所有参与者ID，用于通知
    const participantIds = await chatRepository.getChatParticipantIds(chatId);

    // 使用 mapper 转换为完整的 ChatWithDetails 格式
    const { mapChatToChatType } = await import("../mappers/chat.mapper");
    const mappedChat = mapChatToChatType(updatedChat);

    // 通知所有参与者聊天信息已更新
    emitChatInfoUpdatedToParticipants(participantIds, mappedChat);

    revalidatePath(`/chat/${chatId}`);

    return createSuccessResponse(mappedChat, "Chat updated successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 删除聊天（仅创建者可操作）
 */
export async function deleteChat(chatId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 获取聊天并验证权限
    const chat = await chatRepository.findChatById(chatId);
    if (!chat) throw new Error("Chat not found");

    assert.authorized(
      chat.createdById === user.id,
      "Only creator can delete this chat",
    );

    // 获取所有参与者ID，用于通知
    const participantIds = await chatRepository.getChatParticipantIds(chatId);

    // 删除聊天
    await chatRepository.deleteChat(chatId);

    // 通知所有参与者聊天已删除
    emitChatDeletedToParticipants(participantIds, chatId);

    revalidatePath("/chat");

    return createSuccessResponse(null, "Chat deleted successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 标记聊天为已读
 */
export async function markChatAsRead(chatId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 验证权限
    const isMember = await chatRepository.isUserInChat(chatId, user.id);
    assert.authorized(isMember, "Not a member of this chat");

    // 标记已读
    await chatRepository.markChatAsRead(chatId, user.id);

    revalidatePath(`/chat/${chatId}`);

    return createSuccessResponse(null, "Chat marked as read");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 创建新聊天
 */
export async function createChat(input: CreateChatInput): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 验证输入
    if (input.isGroup && !input.name) {
      throw createError.validation("Group chat must have a name");
    }

    if (!input.isGroup && !input.participantId) {
      throw createError.validation("One-on-one chat must have participant ID");
    }

    if (input.participantId === user.id) {
      throw createError.validation("Cannot create chat with yourself");
    }

    // 检查一对一聊天是否已存在
    if (!input.isGroup && input.participantId) {
      const existing = await chatRepository.findExistingOneOnOneChat(
        user.id,
        input.participantId,
      );

      if (existing) {
        return createSuccessResponse(existing, "Chat already exists");
      }
    }

    // 确定成员列表
    const memberIds = input.isGroup
      ? [user.id, ...(input.participants || [])]
      : input.participantId
        ? [user.id, input.participantId]
        : [user.id];

    // 创建聊天
    const chat = await chatRepository.createChat(
      {
        name: input.name,
        isGroup: input.isGroup,
        avatar: input.avatar,
        description: input.description,
        creator: {
          connect: { id: user.id },
        },
      },
      memberIds,
    );

    // 使用 mapper 转换为完整的 ChatWithDetails 格式
    const { mapChatToChatType } = await import("../mappers/chat.mapper");
    const mappedChat = mapChatToChatType(chat as any);

    // 通知相关用户
    emitNewChatToParticipants(memberIds, mappedChat);

    revalidatePath("/chat");

    return createSuccessResponse(mappedChat, "Chat created successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 发送消息
 */
export async function sendMessage(
  input: CreateMessageInput,
): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 验证输入
    if (!input.chatId) {
      throw createError.validation("Chat ID is required");
    }
    if (!input.content?.trim() && !input.image) {
      throw createError.validation("Message must have content or image");
    }

    // 验证聊天权限
    const isMember = await chatRepository.isUserInChat(input.chatId, user.id);
    assert.authorized(isMember, "Not a member of this chat");

    // 创建消息
    const message = await messageRepository.createChatMessage({
      chat: { connect: { id: input.chatId } },
      sender: { connect: { id: user.id } },
      content: input.content,
      image: input.image,
      replyToId: input.replyToId,
    });

    // 更新聊天时间戳
    await chatRepository.updateChatTimestamp(input.chatId);

    // 获取聊天参与者
    const participantIds = await chatRepository.getChatParticipantIds(
      input.chatId,
    );

    // 实时推送消息
    emitNewMessageToChatRoom(user.id, input.chatId, message);
    emitLastMessageToParticipants(participantIds, input.chatId, message);

    revalidatePath(`/chat/${input.chatId}`);

    return createSuccessResponse(message, "Message sent successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}
