import { NextResponse } from "next/server";
import {
  createSuccessResponse,
  handleApiError,
} from "@/lib/errors/error-handler";
import * as userService from "@/lib/server/services/user.service";
import type { ApiResponse } from "@/types/common";

/**
 * GET /api/user/all
 * 获取所有用户列表
 *
 * @returns {ApiResponse} 用户列表
 */
export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 获取所有用户
    const users = await userService.getAllUsers();

    // 2. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(users, "Users fetched successfully"),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
