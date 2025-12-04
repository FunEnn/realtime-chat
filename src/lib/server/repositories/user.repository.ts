/**
 * User Repository - 用户数据访问层
 * 职责：仅负责数据库操作，不包含业务逻辑
 */

import type { Prisma } from "@prisma/client";
import prisma from "../prisma";

/**
 * 根据 Clerk ID 查找用户
 * @param clerkId - Clerk ID
 */
export async function findUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
  });
}

/**
 * 根据用户 ID 查找用户
 * @param userId - 用户 ID
 */
export async function findUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}

/**
 * 根据邮箱查找用户
 * @param email - 邮箱
 */
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * 获取所有用户
 */
export async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * 创建用户
 * @param data - 用户数据
 */
export async function createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({
    data,
  });
}

/**
 * 更新用户信息
 * @param userId - 用户 ID
 * @param data - 更新数据
 */
export async function updateUser(userId: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

/**
 * 删除用户
 * @param userId - 用户 ID
 */
export async function deleteUser(userId: string) {
  return prisma.user.delete({
    where: { id: userId },
  });
}

/**
 * 同步 Clerk 用户到数据库
 * @param clerkId - Clerk ID
 * @param data - 用户数据
 */
export async function upsertUserFromClerk(
  clerkId: string,
  data: {
    email: string;
    name: string;
    avatar?: string;
  },
) {
  return prisma.user.upsert({
    where: { clerkId },
    update: {
      email: data.email,
      name: data.name,
      avatar: data.avatar,
    },
    create: {
      clerkId,
      email: data.email,
      name: data.name,
      avatar: data.avatar,
    },
  });
}

/**
 * 从 Clerk 用户对象同步用户
 * @param clerkUser - Clerk 用户对象
 */
export async function syncUserFromClerk(clerkUser: {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
}) {
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("User email is required");
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    "Anonymous";

  return upsertUserFromClerk(clerkUser.id, {
    email,
    name,
    avatar: clerkUser.imageUrl,
  });
}
