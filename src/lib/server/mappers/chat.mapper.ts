import type { ChatWithDetails, MessageWithSender, User } from "@/types";
import { mapMessageToMessageType } from "./message.mapper";
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
  sender?: PrismaUser & { isAdmin: boolean };
  replyTo?: PrismaMessage | null;
};

type PrismaChatMember = {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  chatId: string;
  userId: string;
  unreadCount: number;
  lastReadAt: Date | null;
  joinedAt: Date;
  user: PrismaUser & { isAdmin: boolean };
};

type PrismaChat = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string | null;
  avatar: string | null;
  description: string | null;
  isGroup: boolean;
  createdById: string;
  creator?: PrismaUser;
  members?: PrismaChatMember[];
  messages?: PrismaMessage[];
  lastMessage?: PrismaMessage | null;
  unreadCount?: number;
};

export function mapChatToChatType(chat: PrismaChat): ChatWithDetails {
  const participants: User[] = [];

  if (chat.members) {
    for (const member of chat.members) {
      if (member?.user) {
        participants.push(mapUserToUserType(member.user));
      }
    }
  }

  let lastMessage: MessageWithSender | null = null;
  if (chat.lastMessage) {
    lastMessage = mapMessageToMessageType(chat.lastMessage);
  } else if (chat.messages && chat.messages.length > 0) {
    lastMessage = mapMessageToMessageType(chat.messages[0]);
  }

  const mappedChat: ChatWithDetails = {
    id: chat.id,
    name: chat.name,
    avatar: chat.avatar,
    description: chat.description,
    isGroup: chat.isGroup || false,
    createdById: chat.createdById,
    createdBy: chat.createdById,
    lastMessage,
    participants,
    unreadCount: chat.unreadCount ?? 0,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    groupName: chat.isGroup ? chat.name : undefined,
    groupAvatar: chat.isGroup ? chat.avatar : undefined,
    members: (chat.members ?? []) as typeof mappedChat.members,
    messages: (chat.messages ?? []) as typeof mappedChat.messages,
    creator: chat.creator
      ? {
          ...chat.creator,
          isAdmin: chat.creator.isAdmin ?? false,
        }
      : {
          id: chat.createdById,
          clerkId: "",
          email: "",
          name: "Unknown",
          avatar: null,
          bio: null,
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
  };
  return mappedChat;
}

export function mapChatsToChatTypes(chats: PrismaChat[]): ChatWithDetails[] {
  return chats.map(mapChatToChatType);
}
