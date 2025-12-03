"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import * as userService from "../services/user.service";

/**
 * 获取所有用户列表
 */
export async function getAllUsers() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const users = await userService.getAllUsers();
    return { success: true, users };
  } catch (error) {
    console.error("Get all users error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get users",
    };
  }
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(data: {
  name?: string;
  avatar?: string;
  bio?: string;
}) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const user = await userService.findUserByClerkId(clerkId);

    if (!user) {
      throw new Error("User not found");
    }

    const updatedUser = await userService.updateUser(user.id, data);

    // 重新验证相关页面
    revalidatePath("/chat");
    revalidatePath(`/user/${user.id}`);

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Update user profile error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const user = await userService.findUserByClerkId(clerkId);

    if (!user) {
      throw new Error("User not found");
    }

    return { success: true, user };
  } catch (error) {
    console.error("Get current user error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get current user",
    };
  }
}

/**
 * 获取用户信息（通过 ID）
 */
export async function getUserById(userId: string) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      throw new Error("Unauthorized");
    }

    const user = await userService.findUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return { success: true, user };
  } catch (error) {
    console.error("Get user by ID error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get user",
    };
  }
}
