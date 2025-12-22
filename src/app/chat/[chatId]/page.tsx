import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import {
  mapChatToChatType,
  mapMessageToMessageType,
} from "@/lib/server/mappers/chat.mapper";
import * as chatRepository from "@/lib/server/repositories/chat.repository";
import * as messageRepository from "@/lib/server/repositories/message.repository";
import * as userRepository from "@/lib/server/repositories/user.repository";
import SingleChatClient from "./_components/single-chat-client";

export default async function SingleChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await userRepository.findUserByClerkId(userId);

  if (!user) {
    redirect("/sign-in");
  }

  const chat = await chatRepository.findChatById(chatId);

  if (!chat) {
    notFound();
  }

  const isMember = await chatRepository.isUserInChat(chatId, user.id);

  if (!isMember) {
    notFound();
  }

  const { messages } = await messageRepository.findMessagesByChatId(chatId);
  const allUsers = await userRepository.getAllUsers();

  const chatType = mapChatToChatType(chat);
  const validMessages = messages.filter(
    (msg) => msg && typeof msg === "object" && msg.id && msg.chatId,
  );
  const messageTypes = validMessages.map(mapMessageToMessageType);

  return (
    <SingleChatClient
      key={chatId}
      initialChat={chatType}
      initialMessages={messageTypes}
      chatId={chatId}
      currentUserId={user.id}
      allUsers={allUsers}
    />
  );
}
