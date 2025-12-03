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
 * POST /api/chat/[chatId]/mark-read
 * 标记聊天为已读
 *
 * @returns {ApiResponse} 成功消息
 * @throws {UnauthorizedError} 当用户未登录时
 * @throws {NotFoundError} 当用户不存在时
 */
export async function POST(
  _request: Request,
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

    // 3. 获取参数
    const { chatId } = await params;

    // 4. 标记为已读
    await chatService.markChatAsRead(chatId, user.id);

    // 5. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(null, "Chat marked as read"),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
