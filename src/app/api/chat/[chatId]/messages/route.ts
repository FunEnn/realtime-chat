import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assert } from "@/lib/errors/app-error";
import {
  createSuccessResponse,
  handleApiError,
} from "@/lib/errors/error-handler";
import * as messageRepo from "@/lib/server/repositories/message.repository";
import * as chatService from "@/lib/server/services/chat.service";
import * as userService from "@/lib/server/services/user.service";
import {
  emitLastMessageToParticipants,
  emitNewMessageToChatRoom,
} from "@/lib/socket";
import type { ApiResponse } from "@/types/common";

const sendMessageSchema = z
  .object({
    content: z.string().max(10000).optional(),
    image: z.string().url().optional(),
    replyToId: z.string().uuid().optional(),
  })
  .refine((data) => data.content || data.image, {
    message: "Either content or image is required",
  });

/**
 * GET /api/chat/[chatId]/messages
 * 获取聊天消息列表（支持分页）
 *
 * @query limit - 每页数量（默认50）
 * @query cursor - 分页游标
 * @returns {ApiResponse} 消息列表和分页信息
 * @throws {UnauthorizedError} 当用户未登录时
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> },
): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 认证检查
    const { userId: clerkId } = await auth();
    assert.authenticated(clerkId);

    // 2. 获取参数
    const { chatId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const cursor = searchParams.get("cursor") || undefined;

    // 3. 获取消息列表
    const result = await messageRepo.findMessagesByChatId(chatId, {
      take: limit,
      skip: cursor ? 1 : 0,
    });

    // 4. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(
        {
          messages: result.messages,
          total: result.total,
          hasMore: result.hasMore,
        },
        "Messages fetched successfully",
      ),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/chat/[chatId]/messages
 * 发送新消息
 *
 * @body content - 消息内容（可选）
 * @body image - 图片URL（可选）
 * @body replyToId - 回复消息ID（可选）
 * @returns {ApiResponse} 创建的消息对象
 * @throws {UnauthorizedError} 当用户未登录时
 * @throws {NotFoundError} 当用户不存在时
 * @throws {ValidationError} 当输入数据无效时
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> },
): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 认证检查
    const { userId: clerkId } = await auth();
    const authenticatedClerkId = assert.authenticated(clerkId);

    // 2. 获取用户
    const userOrNull =
      await userService.findUserByClerkId(authenticatedClerkId);
    const user = assert.exists(userOrNull, "User");

    // 3. 获取参数并验证输入
    const { chatId } = await params;
    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // 4. 创建消息
    const dbMessage = await messageRepo.createChatMessage({
      content: validatedData.content,
      image: validatedData.image,
      chat: {
        connect: { id: chatId },
      },
      sender: {
        connect: { id: user.id },
      },
      ...(validatedData.replyToId && {
        replyTo: {
          connect: { id: validatedData.replyToId },
        },
      }),
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

    // 5. 更新聊天时间戳
    await chatService.updateChatTimestamp(chatId);

    // 6. 通过 Socket.IO 发送实时消息
    try {
      emitNewMessageToChatRoom(user.id, chatId, message);

      // 获取聊天参与者并发送最后一条消息更新
      const chat = await chatService.findChatById(chatId);
      if (chat) {
        const participantIds = await chatService.getChatParticipantIds(chatId);
        emitLastMessageToParticipants(participantIds, chatId, message);
      }
    } catch (socketError) {
      console.error("[API Route] Socket.IO error:", socketError);
      // 即使 Socket 失败，仍然返回成功（消息已保存）
    }

    // 7. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(message, "Message sent successfully"),
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
