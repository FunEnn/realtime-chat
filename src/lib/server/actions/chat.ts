"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { assert } from "@/lib/errors/app-error";
import {
  createSuccessResponse,
  handleServerActionError,
} from "@/lib/errors/error-handler";
import {
  emitLastMessageToParticipants,
  emitNewChatToParticipants,
  emitNewMessageToChatRoom,
} from "@/lib/socket";
import type { MessageType } from "@/types/chat.type";
import type { ApiResponse } from "@/types/common";
import * as chatService from "../services/chat.service";
import * as messageService from "../services/message.service";
import * as userService from "../services/user.service";

export async function getAllChats(): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    const authenticatedClerkId = assert.authenticated(clerkId);
    const userOrNull =
      await userService.findUserByClerkId(authenticatedClerkId);
    const user = assert.exists(userOrNull, "User");

    const chats = await chatService.findChatsByUserId(user.id);
    return createSuccessResponse(chats, "Chats fetched successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

export async function getChatById(chatId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    const authenticatedClerkId = assert.authenticated(clerkId);
    const userOrNull =
      await userService.findUserByClerkId(authenticatedClerkId);
    const user = assert.exists(userOrNull, "User");

    const chat = await chatService.findChatById(chatId);
    assert.exists(chat, "Chat");

    const isMember = await chatService.isUserInChat(chatId, user.id);
    assert.authorized(isMember, "You are not a member of this chat");

    const { messages } = await messageService.findMessagesByChatId(chatId);

    return createSuccessResponse(
      { chat, messages },
      "Chat fetched successfully",
    );
  } catch (error) {
    return handleServerActionError(error);
  }
}

export async function getChatMessages(
  chatId: string,
): Promise<ApiResponse<{ messages: MessageType[] }>> {
  try {
    const { userId: clerkId } = await auth();
    const authenticatedClerkId = assert.authenticated(clerkId);
    const userOrNull =
      await userService.findUserByClerkId(authenticatedClerkId);
    const user = assert.exists(userOrNull, "User");

    const isMember = await chatService.isUserInChat(chatId, user.id);
    assert.authorized(isMember, "You are not a member of this chat");

    const { messages } = await messageService.findMessagesByChatId(chatId);

    // 转换为客户端格式
    const { mapMessageToMessageType } = await import("../mappers/chat.mapper");
    const messageTypes = messages.map(mapMessageToMessageType);

    return createSuccessResponse(
      { messages: messageTypes },
      "Messages fetched successfully",
    );
  } catch (error) {
    return handleServerActionError(error) as ApiResponse<{
      messages: MessageType[];
    }>;
  }
}

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
    const authenticatedClerkId = assert.authenticated(clerkId);
    const userOrNull =
      await userService.findUserByClerkId(authenticatedClerkId);
    const user = assert.exists(userOrNull, "User");

    const chatOrNull = await chatService.findChatById(chatId);
    const chat = assert.exists(chatOrNull, "Chat");

    assert.authorized(
      chat.createdById === user.id,
      "Only creator can update this chat",
    );

    const updatedChat = await chatService.updateChat(chatId, user.id, {
      name: data.name,
      avatar: data.avatar,
      description: data.description,
    });

    revalidatePath("/chat");
    revalidatePath(`/chat/${chatId}`);

    return createSuccessResponse(updatedChat, "Chat updated successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

export async function deleteChat(chatId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    const authenticatedClerkId = assert.authenticated(clerkId);
    const userOrNull =
      await userService.findUserByClerkId(authenticatedClerkId);
    const user = assert.exists(userOrNull, "User");

    const chatOrNull = await chatService.findChatById(chatId);
    const chat = assert.exists(chatOrNull, "Chat");

    assert.authorized(
      chat.createdById === user.id,
      "Only creator can delete this chat",
    );

    await chatService.deleteChat(chatId, user.id);
    revalidatePath("/chat");

    return createSuccessResponse(null, "Chat deleted successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

export async function markChatAsRead(chatId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    const authenticatedClerkId = assert.authenticated(clerkId);
    const userOrNull =
      await userService.findUserByClerkId(authenticatedClerkId);
    const user = assert.exists(userOrNull, "User");

    await chatService.markChatAsRead(chatId, user.id);
    // 不需要 revalidatePath，避免触发无限循环
    // 未读数会在下次加载时自动更新

    return createSuccessResponse(null, "Chat marked as read");
  } catch (error) {
    return handleServerActionError(error);
  }
}

export async function createChat(data: {
  isGroup: boolean;
  participantId?: string;
  participants?: string[];
  groupName?: string;
  groupAvatar?: string;
}): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    const authenticatedClerkId = assert.authenticated(clerkId);
    const userOrNull =
      await userService.findUserByClerkId(authenticatedClerkId);
    const user = assert.exists(userOrNull, "User");

    const chat = await chatService.createChat(user.id, {
      isGroup: data.isGroup,
      participantId: data.participantId,
      memberIds: data.participants,
      name: data.groupName,
      avatar: data.groupAvatar,
    });

    if (!chat) {
      throw new Error("Failed to create chat");
    }

    // 获取所有参与者 ID
    const participantIds = await chatService.getChatParticipantIds(chat.id);

    try {
      const { mapChatToChatType } = await import("../mappers/chat.mapper");
      const chatType = mapChatToChatType(chat);
      emitNewChatToParticipants(participantIds, chatType);
    } catch (socketError) {
      console.error("[Action] Failed to emit new chat event:", socketError);
    }

    revalidatePath("/chat");

    return createSuccessResponse(chat, "Chat created successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

export async function sendMessage(data: {
  chatId: string;
  content?: string;
  image?: string;
  replyToId?: string;
}): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    const authenticatedClerkId = assert.authenticated(clerkId);
    const userOrNull =
      await userService.findUserByClerkId(authenticatedClerkId);
    const user = assert.exists(userOrNull, "User");

    const isMember = await chatService.isUserInChat(data.chatId, user.id);
    assert.authorized(isMember, "You are not a member of this chat");

    const dbMessage = await messageService.createChatMessage(user.id, {
      chatId: data.chatId,
      content: data.content || "",
      contentType: data.image ? "image" : "text",
    });

    // 转换为客户端格式
    const message = {
      _id: dbMessage.id,
      chatId: dbMessage.chatId,
      content: dbMessage.content,
      image: dbMessage.image,
      sender: {
        _id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      replyTo: null,
      createdAt: dbMessage.createdAt.toISOString(),
      updatedAt: dbMessage.updatedAt.toISOString(),
    };

    // 更新聊天时间戳
    await chatService.updateChatTimestamp(data.chatId);

    // 通过 Socket 发送实时消息
    try {
      emitNewMessageToChatRoom(user.id, data.chatId, message);

      // 获取聊天参与者并发送最后一条消息更新
      const participantIds = await chatService.getChatParticipantIds(
        data.chatId,
      );
      emitLastMessageToParticipants(participantIds, data.chatId, message);
    } catch (socketError) {
      console.error("Failed to emit message event:", socketError);
      // 不影响主流程
    }

    revalidatePath(`/chat/${data.chatId}`);

    return createSuccessResponse(message, "Message sent successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}
