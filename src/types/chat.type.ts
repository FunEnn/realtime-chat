import type { UserType } from "./auth.type";

export type MessageType = {
  _id: string;
  chatId: string;
  content: string | null;
  image: string | null;
  sender: UserType | null;
  replyTo: MessageType | null;
  isSystemMessage?: boolean;
  createdAt: string;
  updatedAt: string;
  status?: string;
  streaming?: boolean;
};

type BaseChatType = {
  _id: string;
  lastMessage: MessageType | null;
  isGroup: boolean;
  isAiChat: boolean;
  createdBy: string;
  groupName?: string;
  groupAvatar?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type ChatType = BaseChatType & {
  participants: UserType[];
};

export type PublicRoomChatType = BaseChatType & {
  name: string;
  description: string;
  avatar?: string;
  members: string[];
  memberCount: number;
};

export type CreateChatInput = {
  participantId?: string;
  participants?: string[];
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
};

export type SendMessageInput = {
  chatId: string;
  content?: string;
  image?: string;
  replyToId?: string;
};

export type CreateMessageType = {
  chatId: string | null;
  content?: string;
  image?: string;
  replyTo?: MessageType | null;
};
