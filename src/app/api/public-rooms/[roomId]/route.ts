import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assert } from "@/lib/errors/app-error";
import {
  createSuccessResponse,
  handleApiError,
} from "@/lib/errors/error-handler";
import * as publicRoomService from "@/lib/server/services/room.service";
import * as userService from "@/lib/server/services/user.service";
import type { ApiResponse } from "@/types/common";

const updatePublicRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  description: z.string().max(500).optional(),
});

/**
 * GET /api/public-rooms/[roomId]
 * 获取公共聊天室详情
 *
 * @returns {ApiResponse} 聊天室对象
 * @throws {NotFoundError} 当聊天室不存在时
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> },
): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 获取参数
    const { roomId } = await params;

    // 2. 获取聊天室
    const room = await publicRoomService.findPublicRoomById(roomId);
    assert.exists(room, "Room");

    // 3. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(room, "Room fetched successfully"),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/public-rooms/[roomId]
 * 更新公共聊天室信息
 *
 * @returns {ApiResponse} 更新后的聊天室对象
 * @throws {UnauthorizedError} 当用户未登录时
 * @throws {ValidationError} 当输入数据无效时
 */
export async function PATCH(
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

    // 3. 获取参数并验证输入
    const { roomId } = await params;
    const body = await request.json();
    const validatedData = updatePublicRoomSchema.parse(body);

    // 4. 更新聊天室
    const room = await publicRoomService.updatePublicRoom(
      roomId,
      user.id,
      validatedData,
    );

    // 4. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(room, "Room updated successfully"),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/public-rooms/[roomId]
 * 删除公共聊天室
 *
 * @returns {ApiResponse} 删除成功消息
 * @throws {UnauthorizedError} 当用户未登录时
 */
export async function DELETE(
  _request: Request,
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

    // 4. 删除聊天室
    await publicRoomService.deletePublicRoom(roomId, user.id);

    // 4. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(null, "Room deleted successfully"),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
