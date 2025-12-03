import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assert } from "@/lib/errors/app-error";
import {
  createSuccessResponse,
  handleApiError,
} from "@/lib/errors/error-handler";
import * as userService from "@/lib/server/services/user.service";
import type { ApiResponse } from "@/types/common";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(200).optional(),
});

/**
 * PATCH /api/user/profile
 * 更新用户资料
 *
 * @body name - 用户名（可选）
 * @body avatar - 头像URL（可选）
 * @body bio - 个人简介（可选）
 * @returns {ApiResponse} 更新后的用户对象
 * @throws {UnauthorizedError} 当用户未登录时
 * @throws {NotFoundError} 当用户不存在时
 * @throws {ValidationError} 当输入数据无效时
 */
export async function PATCH(
  request: Request,
): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 认证检查
    const { userId: clerkId } = await auth();
    const authenticatedClerkId = assert.authenticated(clerkId);

    // 2. 验证输入
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // 3. 获取用户
    const userOrNull =
      await userService.findUserByClerkId(authenticatedClerkId);
    const user = assert.exists(userOrNull, "User");

    // 4. 更新用户
    const updatedUser = await userService.updateUser(user.id, validatedData);

    // 5. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(updatedUser, "Profile updated successfully"),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
