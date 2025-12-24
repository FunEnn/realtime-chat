import type { User } from "@/types";

type PrismaUser = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  clerkId: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  isAdmin?: boolean;
};

export function mapUserToUserType(user: PrismaUser): User {
  if (!user?.id || !user.email) {
    throw new Error("User must have id and email");
  }

  const mappedUser: User = {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name ?? "Unknown",
    avatar: user.avatar ?? null,
    bio: user.bio ?? null,
    isAdmin: false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return mappedUser;
}

export function mapUsersToUserTypes(users: PrismaUser[]): User[] {
  return users.map(mapUserToUserType);
}
