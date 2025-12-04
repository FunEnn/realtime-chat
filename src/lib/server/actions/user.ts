"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createSuccessResponse,
  handleServerActionError,
} from "@/lib/errors/error-handler";
import type { ApiResponse } from "@/types/common";
import type { UpdateUserProfileInput } from "@/types/prisma.types";
import prisma from "../prisma";
import * as userRepository from "../repositories/user.repository";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

/**
 * 获取所有用户列表
 */
export async function getAllUsers(): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const users = await userRepository.getAllUsers();

    return createSuccessResponse(users, "Users fetched successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(
  data: UpdateUserProfileInput,
): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const validatedData = updateProfileSchema.parse(data);

    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: validatedData,
    });

    revalidatePath("/chat");

    return createSuccessResponse(updatedUser, "Profile updated successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserByClerkId(clerkId);
    if (!user) throw new Error("User not found");

    return createSuccessResponse(user, "User fetched successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * 获取用户信息（通过 ID）
 */
export async function getUserById(userId: string): Promise<ApiResponse> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await userRepository.findUserById(userId);
    if (!user) throw new Error("User not found");

    return createSuccessResponse(user, "User fetched successfully");
  } catch (error) {
    return handleServerActionError(error);
  }
}
