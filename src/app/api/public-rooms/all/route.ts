import { NextResponse } from "next/server";
import {
  createSuccessResponse,
  handleApiError,
} from "@/lib/errors/error-handler";
import * as publicRoomService from "@/lib/server/services/room.service";
import type { ApiResponse } from "@/types/common";

/**
 * GET /api/public-rooms/all
 * 获取所有公共聊天室列表
 *
 * @returns {ApiResponse} 聊天室列表
 */
export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. 获取所有公共聊天室
    const rooms = await publicRoomService.getAllPublicRooms();

    // 2. 转换数据格式
    const formattedRooms = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description || "",
      avatar: room.avatar || undefined,
      members: room.members?.map((m) => m.userId) || [],
      createdBy: room.creator
        ? {
            id: room.creator.id,
            name: room.creator.name || "Unknown",
            email: room.creator.email,
            avatar: room.creator.avatar || null,
            createdAt: room.creator.createdAt.toISOString(),
            updatedAt: room.creator.updatedAt.toISOString(),
          }
        : undefined,
      memberCount: room._count?.members || 0,
      isMember: false,
      isActive: true,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
      _count: room._count,
    }));

    // 3. 返回成功响应
    return NextResponse.json(
      createSuccessResponse(
        formattedRooms,
        "Public rooms fetched successfully",
      ),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
