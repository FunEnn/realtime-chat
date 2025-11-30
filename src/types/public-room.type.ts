import type { UserType } from "./auth.type";
import type { MessageType } from "./chat.type";

export type PublicRoomType = {
  _id: string;
  name: string;
  description: string;
  avatar?: string;
  members: string[];
  createdBy: UserType;
  memberCount: number;
  isMember: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatePublicRoomInput = {
  name: string;
  description?: string;
  avatar?: string;
};

export type PublicRoomDetailType = {
  room: PublicRoomType;
  messages: MessageType[];
};
