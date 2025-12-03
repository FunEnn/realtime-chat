import { assert } from "@/lib/errors/app-error";
import * as userRepo from "../repositories/user.repository";

export async function findUserByClerkId(clerkId: string) {
  return userRepo.findUserByClerkId(clerkId);
}

export async function findUserById(userId: string) {
  return userRepo.findUserById(userId);
}

export async function getAllUsers() {
  return userRepo.getAllUsers();
}

export async function updateUser(
  userId: string,
  data: {
    name?: string;
    avatar?: string;
    bio?: string;
  },
) {
  const user = await userRepo.findUserById(userId);
  assert.exists(user, "User");
  return userRepo.updateUser(userId, data);
}

export async function syncUserFromClerk(
  clerkId: string,
  data: {
    email: string;
    name: string;
    avatar?: string;
  },
) {
  return userRepo.upsertUserFromClerk(clerkId, data);
}
