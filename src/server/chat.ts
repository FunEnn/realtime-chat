import type {
  ChatType,
  CreateChatInput,
  MessageType,
} from "@/src/types/chat.type";
import { getUserById, getUsersByIds } from "./auth";

const chats: ChatType[] = [];
const messages: MessageType[] = [];

const generateId = () => crypto.randomUUID();

export function getAllChatsForUser(userId: string): ChatType[] {
  return chats.filter((chat) =>
    chat.participants.some((p) => p._id === userId),
  );
}

export function getChatById(chatId: string): ChatType | undefined {
  return chats.find((c) => c._id === chatId);
}

export function createChatForUser(
  creatorId: string,
  input: CreateChatInput,
): ChatType {
  const participantIds =
    input.participants ?? (input.participantId ? [input.participantId] : []);
  const participants = getUsersByIds(participantIds);

  if (participants.length === 0) {
    throw new Error("At least one participant is required");
  }

  const now = new Date().toISOString();
  const chat: ChatType = {
    _id: generateId(),
    participants,
    lastMessage: null,
    isGroup: input.isGroup ?? false,
    isAiChat: false,
    createdBy: creatorId,
    groupName: input.groupName,
    createdAt: now,
    updatedAt: now,
  };
  chats.push(chat);
  return chat;
}

export function getChatWithMessages(chatId: string) {
  const chat = getChatById(chatId);
  if (!chat) return null;

  const chatMessages = messages.filter((m) => m.chatId === chatId);
  return { chat, messages: chatMessages };
}

export function sendMessageToChat(
  chatId: string,
  senderId: string,
  input: {
    content?: string;
    image?: string;
    replyToId?: string;
  },
): MessageType {
  const chat = getChatById(chatId);
  if (!chat) {
    throw new Error("Chat not found");
  }

  const sender = getUserById(senderId) ?? null;
  const replyTo = input.replyToId
    ? (messages.find((m) => m._id === input.replyToId) ?? null)
    : null;

  const now = new Date().toISOString();
  const message: MessageType = {
    _id: generateId(),
    chatId,
    content: input.content ?? null,
    image: input.image ?? null,
    sender,
    replyTo,
    createdAt: now,
    updatedAt: now,
  };
  messages.push(message);

  chat.lastMessage = message;
  chat.updatedAt = now;

  return message;
}
