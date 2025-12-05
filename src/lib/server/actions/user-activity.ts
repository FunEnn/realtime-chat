"use server";

import { auth } from "@clerk/nextjs/server";
import {
  createSuccessResponse,
  handleServerActionError,
} from "@/lib/errors/error-handler";
import type { ApiResponse } from "@/types/common";
import * as chatRepository from "../repositories/chat.repository";
import * as messageRepository from "../repositories/message.repository";
import * as userRepository from "../repositories/user.repository";

/**
 * 获取用户的群聊邀请记录
 */
export async function getUserGroupInvitations(): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 获取用户所在的所有群聊
    const userChats = await chatRepository.findChatsByUserId(user.id);
    const groupChats = userChats.filter((chat) => chat.isGroup);

    // 收集所有群聊的邀请系统消息
    const invitations = [];

    for (const chat of groupChats) {
      // 获取该群聊中提到当前用户的邀请消息
      const { messages } = await messageRepository.findMessagesByChatId(
        chat.id,
      );

      const inviteMessages = messages.filter((msg) => {
        const isSystemMsg = (msg as any).isSystemMessage ?? false;
        return (
          isSystemMsg &&
          msg.content &&
          msg.content.includes("invited") &&
          msg.content.includes(user.name || user.email)
        );
      });

      for (const msg of inviteMessages) {
        // 解析邀请者名称
        const match = msg.content?.match(/^(.+?) invited/);
        const inviterName = match ? match[1] : "Someone";

        // 过滤掉自己邀请自己的情况
        if (inviterName === user.name || msg.senderId === user.id) {
          continue;
        }

        invitations.push({
          id: msg.id,
          chatId: chat.id,
          chatName: chat.name,
          chatAvatar: chat.avatar,
          inviterName,
          invitedAt: msg.createdAt,
        });
      }
    }

    // 按时间倒序排序
    invitations.sort(
      (a, b) =>
        new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime(),
    );

    return createSuccessResponse(
      invitations,
      "Invitations retrieved successfully",
    );
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 获取用户的私聊发起记录
 */
export async function getUserPrivateChats(): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    // 获取用户所有的私聊
    const userChats = await chatRepository.findChatsByUserId(user.id);
    const privateChats = userChats.filter((chat) => !chat.isGroup);

    // 整理私聊信息
    const privateChatsInfo = privateChats.map((chat) => {
      // 从 members 中获取另一方用户信息
      const otherMember = chat.members.find((m) => m.userId !== user.id);

      if (!otherMember || !otherMember.user) return null;

      const otherUser = otherMember.user;

      // 判断谁发起的聊天
      const isInitiatedByMe = chat.createdById === user.id;

      return {
        id: chat.id,
        otherUserId: otherUser.id,
        otherUserName: otherUser.name,
        otherUserAvatar: otherUser.avatar,
        otherUserEmail: otherUser.email,
        initiatedBy: isInitiatedByMe ? ("me" as const) : ("other" as const),
        initiatorName: isInitiatedByMe ? user.name : otherUser.name,
        createdAt: chat.createdAt,
      };
    });

    // 过滤掉 null 值并按时间倒序排序
    const validChats = privateChatsInfo.filter((chat) => chat !== null);
    validChats.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return createSuccessResponse(
      validChats,
      "Private chats retrieved successfully",
    );
  } catch (error) {
    return handleServerActionError(error);
  }
}
