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
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  isAI?: boolean;
  createdAt: string;
  updatedAt: string;
};
