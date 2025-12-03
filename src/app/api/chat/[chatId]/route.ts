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

const updateChatSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  description: z.string().max(500).optional(),
});

/**
 * GET /api/chat/[chatId]
 * 获取聊天详情
 *
 * @returns {ApiResponse} 聊天对象
 * @throws {UnauthorizedError} 当用户未登录时
 * @throws {NotFoundError} 当聊天不存在时
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> },
): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 认证检查
    const { userId: clerkId } = await auth();
    assert.authenticated(clerkId);

    // 2. 获取参数
    const { chatId } = await params;

    // 3. 获取聊天
    const chat = await chatService.findChatById(chatId);
    assert.exists(chat, "Chat");

    // 4. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(chat, "Chat fetched successfully"),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/chat/[chatId]
 * 更新聊天信息
 *
 * @returns {ApiResponse} 更新后的聊天对象
 * @throws {UnauthorizedError} 当用户未登录时
 * @throws {ValidationError} 当输入数据无效时
 */
export async function PATCH(
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

    // 3. 获取参数和验证输入
    const { chatId } = await params;
    const body = await request.json();
    const validatedData = updateChatSchema.parse(body);

    // 4. 更新聊天
    const chat = await chatService.updateChat(chatId, user.id, validatedData);

    // 4. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(chat, "Chat updated successfully"),
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/chat/[chatId]
 * 删除聊天
 *
 * @returns {ApiResponse} 删除成功消息
 * @throws {UnauthorizedError} 当用户未登录时
 */
export async function DELETE(
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

    // 4. 删除聊天
    await chatService.deleteChat(chatId, user.id);

    // 4. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(null, "Chat deleted successfully"),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
