import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assert, createError } from "@/lib/errors/app-error";
import {
  createSuccessResponse,
  handleApiError,
} from "@/lib/errors/error-handler";
import * as messageRepo from "@/lib/server/repositories/message.repository";
import * as messageService from "@/lib/server/services/message.service";
import * as publicRoomService from "@/lib/server/services/room.service";
import * as userService from "@/lib/server/services/user.service";
import {
  emitLastMessageToParticipants,
  emitNewMessageToChatRoom,
} from "@/lib/socket";
import type { ApiResponse } from "@/types/common";

const sendRoomMessageSchema = z
  .object({
    content: z.string().max(10000).optional(),
    image: z.string().url().optional(),
    replyToId: z.string().uuid().optional(),
  })
  .refine((data) => data.content || data.image, {
    message: "Either content or image is required",
  });

const getRoomMessagesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().uuid().optional(),
});

/**
 * GET /api/public-rooms/[roomId]/messages
 * 获取聊天室消息列表（支持分页）
 *
 * @query limit - 每页数量（默认50）
 * @query cursor - 分页游标
 * @returns {ApiResponse} 消息列表和分页信息
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 获取参数
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);

    // 2. 验证查询参数
    const validatedParams = getRoomMessagesSchema.parse({
      limit: searchParams.get("limit"),
      cursor: searchParams.get("cursor"),
    });

    // 3. 获取消息列表
    const result = await messageService.findMessagesByRoomId(roomId, {
      take: validatedParams.limit,
      skip: validatedParams.cursor ? 1 : 0,
    });

    // 4. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(result, "Messages fetched successfully"),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/public-rooms/[roomId]/messages
 * 在聊天室中发送消息
 *
 * @body content - 消息内容（可选）
 * @body image - 图片URL（可选）
 * @body replyToId - 回复消息ID（可选）
 * @returns {ApiResponse} 创建的消息对象
 * @throws {UnauthorizedError} 当用户未登录时
 * @throws {NotFoundError} 当用户不存在时
 * @throws {ForbiddenError} 当用户未加入聊天室时
 * @throws {ValidationError} 当输入数据无效时
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 认证检查
    const { userId: clerkId } = await auth();
    const authenticatedClerkId = assert.authenticated(clerkId);

    // 2. 获取用户
    const userOrNull =
      await userService.findUserByClerkId(authenticatedClerkId);
    const user = assert.exists(userOrNull, "User");

    // 3. 获取参数
    const { roomId } = await params;

    // 4. 验证用户是否在聊天室中
    const isInRoom = await publicRoomService.isUserInRoom(roomId, user.id);
    if (!isInRoom) {
      throw createError.forbidden(
        "You must join the room before sending messages",
      );
    }

    // 5. 验证输入
    const body = await request.json();
    const validatedData = sendRoomMessageSchema.parse(body);

    // 6. 创建消息
    const message = await messageRepo.createRoomMessage({
      content: validatedData.content,
      image: validatedData.image,
      sender: {
        connect: { id: user.id },
      },
      room: {
        connect: { id: roomId },
      },
      ...(validatedData.replyToId && {
        replyTo: {
          connect: { id: validatedData.replyToId },
        },
      }),
    });

    // 7. 通过 Socket.IO 发送实时消息
    try {
      emitNewMessageToChatRoom(user.id, roomId, message);

      // 获取房间成员并发送最后一条消息更新
      const memberIds = await publicRoomService.getRoomMemberIds(roomId);
      emitLastMessageToParticipants(memberIds, roomId, message);
    } catch (socketError) {
      console.error("Socket.IO error:", socketError);
      // 即使 Socket 失败，仍然返回成功（消息已保存）
    }

    // 8. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(message, "Message sent successfully"),
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
