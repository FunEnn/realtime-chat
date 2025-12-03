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

const createPublicRoomSchema = z.object({
  name: z.string().min(1).max(100),
  avatar: z.string().url().optional(),
  description: z.string().max(500).optional(),
});

/**
 * POST /api/public-rooms/create
 * 创建新的公共聊天室
 *
 * @body name - 聊天室名称（必需）
 * @body avatar - 聊天室头像URL（可选）
 * @body description - 聊天室描述（可选）
 * @returns {ApiResponse} 创建的聊天室对象
 * @throws {UnauthorizedError} 当用户未登录时
 * @throws {NotFoundError} 当用户不存在时
 * @throws {ValidationError} 当输入数据无效时
 */
export async function POST(
  request: Request,
): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 认证检查
    const { userId: clerkId } = await auth();
    const authenticatedClerkId = assert.authenticated(clerkId);

    // 2. 获取用户
    const userOrNull =
      await userService.findUserByClerkId(authenticatedClerkId);
    const user = assert.exists(userOrNull, "User");

    // 3. 验证输入
    const body = await request.json();
    const validatedData = createPublicRoomSchema.parse(body);

    // 4. 创建公共聊天室
    const room = await publicRoomService.createPublicRoom(user.id, {
      name: validatedData.name,
      avatar: validatedData.avatar,
      description: validatedData.description,
    });

    // 5. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(room, "Public room created successfully"),
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
