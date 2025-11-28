import type { UserType } from "./auth.type";

export type MessageType = {
  _id: string;
  chatId: string;
  content: string | null;
  image: string | null;
  sender: UserType | null;
  replyTo: MessageType | null;
  createdAt: string;
  updatedAt: string;
  status?: string;
  streaming?: boolean;
};

export type ChatType = {
  _id: string;
  participants: UserType[];
  lastMessage: MessageType | null;
  isGroup: boolean;
  isAiChat: boolean;
  createdBy: string;
  groupName?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateChatInput = {
  participantId?: string;
  participants?: string[];
  isGroup?: boolean;
  groupName?: string;
};

export type CreateChatType = CreateChatInput;

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
