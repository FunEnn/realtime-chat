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
 * 离开群聊
 */
export async function leaveChat(chatId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 获取聊天信息
    const chat = await chatRepository.findChatById(chatId);
    if (!chat) throw new Error("Chat not found");

    // 验证是否为群聊
    if (!chat.isGroup) {
      throw createError.forbidden("Cannot leave a private chat");
    }

    // 验证是否为成员
    const isMember = await chatRepository.isUserInChat(chatId, user.id);
    if (!isMember) {
      throw createError.forbidden("You are not a member of this chat");
    }

    // 移除成员
    await chatRepository.removeChatMember(chatId, user.id);

    // 创建并保存系统消息通知群组
    const systemMessage = await messageRepository.createChatMessage({
      chat: { connect: { id: chatId } },
      sender: { connect: { id: user.id } },
      content: `${user.name || "Someone"} left the group`,
      image: null,
      replyToId: null,
      isSystemMessage: true,
    });

    // 实时推送系统消息
    emitNewMessageToChatRoom(user.id, chatId, systemMessage);

    // 通知所有成员群信息更新
    const updatedChat = await chatRepository.findChatById(chatId);
    if (updatedChat) {
      const participantIds = await chatRepository.getChatParticipantIds(chatId);
      // 使用 mapper 转换为完整的 ChatWithDetails 格式
      const { mapChatToChatType } = await import("../mappers/chat.mapper");
      const mappedChat = mapChatToChatType(updatedChat);
      await emitChatInfoUpdatedToParticipants(participantIds, mappedChat);
    }

    // 通知离开的用户聊天已删除（从他的列表中移除）
    emitChatDeletedToParticipants([user.id], chatId);

    revalidatePath("/chat");

    return createSuccessResponse(null, "Left group successfully");
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

    if (!chat) {
      throw new Error("Failed to create chat");
    }

    // 使用 mapper 转换为完整的 ChatWithDetails 格式
    const { mapChatToChatType } = await import("../mappers/chat.mapper");
    const mappedChat = mapChatToChatType(chat as any);

    // 通知相关用户
    emitNewChatToParticipants(memberIds, mappedChat);

    // 如果是群聊，创建并保存系统消息
    if (input.isGroup && chat) {
      const systemMessage = await messageRepository.createChatMessage({
        chat: { connect: { id: chat.id } },
        sender: { connect: { id: user.id } },
        content: `${user.name || "Someone"} created the group`,
        image: null,
        replyToId: null,
        isSystemMessage: true,
      });

      // 实时推送系统消息
      emitNewMessageToChatRoom(user.id, chat.id, systemMessage);
    }

    revalidatePath("/chat");

    return createSuccessResponse(mappedChat, "Chat created successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 添加用户到群聊
 */
export async function addUsersToChat(
  chatId: string,
  userIds: string[],
): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const currentUser = await userRepository.findUserByClerkId(clerkId);
    if (!currentUser) throw new Error("User not found");

    // 验证聊天是否存在
    const chat = await chatRepository.findChatById(chatId);
    if (!chat) throw new Error("Chat not found");

    // 验证是否为群聊
    if (!chat.isGroup) {
      throw createError.forbidden("Cannot add users to a private chat");
    }

    // 验证当前用户是否为成员
    const isMember = await chatRepository.isUserInChat(chatId, currentUser.id);
    if (!isMember) {
      throw createError.forbidden("You are not a member of this chat");
    }

    // 添加所有新成员
    const addedMembers = [];
    const addedUsers = [];
    for (const userId of userIds) {
      // 检查用户是否已经是成员
      const isAlreadyMember = await chatRepository.isUserInChat(chatId, userId);
      if (!isAlreadyMember) {
        const member = await chatRepository.addChatMember(chatId, userId);
        addedMembers.push(member);
        // 获取用户信息用于系统消息
        const addedUser = await userRepository.findUserById(userId);
        if (addedUser) {
          addedUsers.push(addedUser);
        }
      }
    }

    if (addedMembers.length === 0) {
      return createSuccessResponse(
        null,
        "All selected users are already members",
      );
    }

    // 获取更新后的聊天信息
    const updatedChat = await chatRepository.findChatById(chatId);

    // 发送通知给所有参与者
    if (updatedChat) {
      const participantIds = await chatRepository.getChatParticipantIds(chatId);
      // 使用 mapper 转换为完整的 ChatWithDetails 格式
      const { mapChatToChatType } = await import("../mappers/chat.mapper");
      const mappedChat = mapChatToChatType(updatedChat);
      await emitChatInfoUpdatedToParticipants(participantIds, mappedChat);

      // 为新成员创建聊天
      for (const member of addedMembers) {
        await emitNewChatToParticipants([member.userId], mappedChat);
      }
    }

    // 创建并保存系统消息通知群组
    if (addedUsers.length > 0) {
      const userNames = addedUsers.map((u) => u.name || "Someone").join(", ");
      const systemMessage = await messageRepository.createChatMessage({
        chat: { connect: { id: chatId } },
        sender: { connect: { id: currentUser.id } },
        content: `${currentUser.name || "Someone"} invited ${userNames} to the group`,
        image: null,
        replyToId: null,
        isSystemMessage: true,
      });

      // 实时推送系统消息
      emitNewMessageToChatRoom(currentUser.id, chatId, systemMessage);
    }

    revalidatePath("/chat");

    return createSuccessResponse(
      { addedCount: addedMembers.length },
      `Successfully added ${addedMembers.length} user${addedMembers.length > 1 ? "s" : ""} to the group`,
    );
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
