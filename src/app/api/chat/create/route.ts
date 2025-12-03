import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assert } from "@/lib/errors/app-error";
import {
  createSuccessResponse,
  handleApiError,
} from "@/lib/errors/error-handler";
import * as chatService from "@/lib/server/services/chat.service";
import * as userService from "@/lib/server/services/user.service";
import type { ApiResponse } from "@/types/common";

const createChatSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  description: z.string().max(500).optional(),
  isGroup: z.boolean().default(false),
  memberIds: z.array(z.string().uuid()).min(1),
});

/**
 * POST /api/chat/create
 * 创建新聊天（一对一或群聊）
 *
 * @returns {ApiResponse} 创建的聊天对象
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
    const validatedData = createChatSchema.parse(body);

    const { memberIds, ...chatData } = validatedData;

    // 4. 创建聊天
    const chat = await chatService.createChat(user.id, {
      name: chatData.name,
      avatar: chatData.avatar,
      description: chatData.description,
      isGroup: chatData.isGroup,
      memberIds,
    });

    // 5. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(chat, "Chat created successfully"),
      { status: 201 },
    );
  } catch (error) {
    // 6. 统一错误处理
    return handleApiError(error);
  }
}
