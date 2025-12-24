import type { MessageWithSender } from "@/types";
import { mapUserToUserType } from "./user.mapper";

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

type PrismaMessage = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  chatId: string;
  senderId: string;
  content: string | null;
  image: string | null;
  replyToId: string | null;
  isSystemMessage?: boolean;
  sender?: PrismaUser;
  replyTo?: PrismaMessage | null;
};

export function mapMessageToMessageType(
  message: PrismaMessage,
): MessageWithSender {
  if (!message?.id || !message.chatId) {
    throw new Error("Message must have id and chatId");
  }

  if (!message.sender) {
    throw new Error("Message sender is required");
  }

  let replyTo: MessageWithSender | null = null;
  if (message.replyTo?.sender) {
    replyTo = {
      id: message.replyTo.id,
      chatId: message.replyTo.chatId,
      senderId: message.replyTo.senderId,
      content: message.replyTo.content ?? null,
      image: message.replyTo.image ?? null,
      replyToId: message.replyTo.replyToId,
      isSystemMessage: message.replyTo.isSystemMessage ?? false,
      sender: mapUserToUserType(message.replyTo.sender),
      replyTo: null,
      createdAt: message.replyTo.createdAt,
      updatedAt: message.replyTo.updatedAt,
    };
  }

  const mappedMessage: MessageWithSender = {
    id: message.id,
    chatId: message.chatId,
    senderId: message.senderId,
    content: message.content ?? null,
    image: message.image ?? null,
    replyToId: message.replyToId,
    isSystemMessage: message.isSystemMessage ?? false,
    sender: mapUserToUserType(message.sender),
    replyTo,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };

  return mappedMessage;
}

export function mapMessagesToMessageTypes(
  messages: PrismaMessage[],
): MessageWithSender[] {
  return messages.map(mapMessageToMessageType);
}
