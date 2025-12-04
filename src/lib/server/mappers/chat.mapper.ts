import type { ChatWithDetails, MessageWithSender, User } from "@/types";

type PrismaUser = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  clerkId: string;
  email: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
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
  sender?: PrismaUser;
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
  user: PrismaUser;
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

export function mapMessageToMessageType(
  message: PrismaMessage,
): MessageWithSender {
  if (!message?.id || !message.chatId) {
    throw new Error("Message must have id and chatId");
  }

  if (!message.sender) {
    throw new Error("Message sender is required");
  }

  const mappedMessage: MessageWithSender = {
    id: message.id,
    chatId: message.chatId,
    senderId: message.senderId,
    content: message.content ?? null,
    image: message.image ?? null,
    replyToId: message.replyToId,
    sender: mapUserToUserType(message.sender),
    replyTo: null,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
  return mappedMessage;
}

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
    members: (chat.members ?? []) as any,
    messages: (chat.messages ?? []) as any,
    creator: chat.creator
      ? ({
          ...chat.creator,
          isAdmin: (chat.creator as any).isAdmin ?? false,
        } as any)
      : ({
          id: chat.createdById,
          clerkId: "",
          email: "",
          name: "Unknown",
          avatar: null,
          bio: null,
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any),
  };
  return mappedChat;
}

export function mapChatsToChatTypes(chats: PrismaChat[]): ChatWithDetails[] {
  return chats.map(mapChatToChatType);
}

export function mapUsersToUserTypes(users: PrismaUser[]): User[] {
  return users.map(mapUserToUserType);
}
