import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { assert, createError } from "@/lib/errors/app-error";
import {
  createSuccessResponse,
  handleApiError,
} from "@/lib/errors/error-handler";
import * as publicRoomService from "@/lib/server/services/room.service";
import * as userService from "@/lib/server/services/user.service";
import type { ApiResponse } from "@/types/common";

/**
 * POST /api/public-rooms/[roomId]/join
 * 加入公共聊天室
 *
 * @returns {ApiResponse} 成员信息
 * @throws {UnauthorizedError} 当用户未登录时
 * @throws {NotFoundError} 当用户不存在时
 * @throws {ConflictError} 当用户已是成员时
 */
export async function POST(
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

    // 4. 检查是否已是成员
    const isAlreadyMember = await publicRoomService.isUserInRoom(
      roomId,
      user.id,
    );

    if (isAlreadyMember) {
      throw createError.conflict("User is already a member of this room");
    }

    // 5. 加入聊天室
    const member = await publicRoomService.joinPublicRoom(roomId, user.id);

    // 6. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(member, "Successfully joined the room"),
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
