import { cookies } from "next/headers";
import type { RegisterInput, UserType } from "@/src/types/auth.type";

const SESSION_COOKIE_KEY = "rc_session_user_id";

const users: UserType[] = [];

const generateId = () => crypto.randomUUID();

export async function getCurrentUser(): Promise<UserType | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE_KEY)?.value;
  return userId ? (getUserById(userId) ?? null) : null;
}

export async function setCurrentUser(user: UserType | null): Promise<void> {
  const cookieStore = await cookies();
  if (user) {
    cookieStore.set(SESSION_COOKIE_KEY, user._id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  } else {
    cookieStore.delete(SESSION_COOKIE_KEY);
  }
}

export function registerUser(payload: RegisterInput): UserType {
  if (users.some((u) => u.email === payload.email)) {
    throw new Error("User already exists");
  }

  const now = new Date().toISOString();
  const user: UserType = {
    _id: generateId(),
    name: payload.name,
    email: payload.email,
    avatar: payload.avatar ?? null,
    createdAt: now,
    updatedAt: now,
  };
  users.push(user);
  return user;
}

export function loginUser(email: string, _password: string): UserType {
  const user = users.find((u) => u.email === email);
  if (!user) {
    throw new Error("Invalid credentials");
  }
  return user;
}

export function getAllUsers(): UserType[] {
  return users;
}

export function getUserById(userId: string): UserType | undefined {
  return users.find((u) => u._id === userId);
}

export function getUsersByIds(userIds: string[]): UserType[] {
  if (userIds.length === 0) return [];
  const idSet = new Set(userIds);
  return users.filter((u) => idSet.has(u._id));
}
