export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  avatar?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type UserType = {
  id: string;
  clerkId?: string;
  name: string;
  email: string;
  avatar: string | null;
  bio?: string;
  isAdmin?: boolean;
  isAI?: boolean;
  createdAt: string;
  updatedAt: string;
};
