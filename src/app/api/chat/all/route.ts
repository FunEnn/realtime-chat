import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { assert } from "@/lib/errors/app-error";
import {
  createSuccessResponse,
  handleApiError,
} from "@/lib/errors/error-handler";
import * as chatService from "@/lib/server/services/chat.service";
import * as userService from "@/lib/server/services/user.service";
import type { ApiResponse } from "@/types/common";

/**
 * GET /api/chat/all
 * 获取当前用户的所有聊天列表
 *
 * @returns {ApiResponse} 聊天列表
 * @throws {UnauthorizedError} 当用户未登录时
 * @throws {NotFoundError} 当用户不存在时
 */
export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 认证检查
    const { userId: clerkId } = await auth();
    const authenticatedClerkId = assert.authenticated(clerkId);

    // 2. 获取用户
    const userOrNull =
      await userService.findUserByClerkId(authenticatedClerkId);
    const user = assert.exists(userOrNull, "User");

    // 3. 获取聊天列表
    const chats = await chatService.findChatsByUserId(user.id);

    // 4. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(chats, "Chats fetched successfully"),
    );
  } catch (error) {
    // 5. 统一错误处理
    return handleApiError(error);
  }
}
